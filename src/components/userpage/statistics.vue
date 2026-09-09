<script setup lang="ts">
import { storeToRefs } from 'pinia'

import type {
  LeaderboardRankingSystem, PPRankingSystem,
} from '$active'
import type { PPRank, ScoreRank } from '~/def/statistics'
import userpageStore from '~/store/userpage'

const page = userpageStore()
const { supportedLeaderboardPPRankingSystems: ppRankingSystems } = useAdapterConfig()
const {
  currentStatistic: data,
  user,
  currentRankingSystem,
} = storeToRefs(page)

const scoreFmtCompact = createScoreFormatter({
  notation: 'compact',
  maximumFractionDigits: 2,
})
const scoreFmt = createScoreFormatter({ notation: undefined })
const deferredRender = shallowReactive({ ...data.value })
const playTime = computed(() =>
  deferredRender
    ? toDuration(new Date((deferredRender.playTime || 0) * 1000), new Date(0))
    : { hours: 0, minutes: 0, seconds: 0 },
)

const selectedRankingSystem = computed(() => page.switcher.rankingSystem)

watch(data, () => {
  for (const key in deferredRender) {
    // @ts-expect-error it's fine
    deferredRender[key] = data.value[key]
  }
})

const userLevelInt = computed(() => Math.floor(deferredRender.level || 0))
const userLevelPercent = computed(() =>
  (((deferredRender.level || 0) % 1) * 100).toFixed(1)
)
const ScoreToNextLevel = computed(
  () =>
    getRequiredScoreForLevel(userLevelInt.value + 1)
    - getRequiredScoreForLevel(userLevelInt.value),
)

// Animated counter
const animatedRank = ref(0)
const animatedPP = ref(0)
const animatedLevel = ref(0)

function animateValue(target: any, endValue: number, duration: number) {
  // Client-side only
  if (typeof window === 'undefined') return
  
  const startValue = target.value || 0
  const startTime = Date.now()
  
  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function (ease-out cubic)
    const eased = 1 - Math.pow(1 - progress, 3)
    
    target.value = startValue + (endValue - startValue) * eased
    
    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      target.value = endValue
    }
  }
  
  requestAnimationFrame(animate)
}

// Initialize animations on mount (client-side only)
onMounted(() => {
  // Initial animation
  if (currentRankingSystem.value?.rank) {
    animateValue(animatedRank, currentRankingSystem.value.rank, 1000)
  }
  if (currentRankingSystem.value && 'performance' in currentRankingSystem.value) {
    animateValue(animatedPP, (currentRankingSystem.value as PPRank).performance, 1000)
  }
  if (deferredRender.level) {
    animateValue(animatedLevel, deferredRender.level, 1000)
  }
  
  // Watch for changes
  watch(currentRankingSystem, (newVal) => {
    if (newVal?.rank) {
      animateValue(animatedRank, newVal.rank, 1000)
    }
    if (newVal && 'performance' in newVal) {
      animateValue(animatedPP, (newVal as PPRank).performance, 1000)
    }
  })

  watch(() => deferredRender.level, (newVal) => {
    if (newVal) {
      animateValue(animatedLevel, newVal, 1000)
    }
  })
})
</script>

<template>
  <div v-if="user" class="stats-performance">
    <!-- Hero Performance Card -->
    <div class="performance-hero">
      <div class="performance-grid">
        <!-- Rank - Large Display -->
        <div v-if="currentRankingSystem" class="performance-card rank-card">
          <div class="card-glow rank-glow" />
          <div class="card-content">
            <div class="card-label">Global Rank</div>
            <div class="card-value rank-value">
              <span class="rank-hash">#</span>
              <span class="rank-number">{{ Math.floor(animatedRank).toLocaleString() }}</span>
            </div>
            <div v-if="currentRankingSystem.countryRank" class="card-meta">
              <img :src="getFlagURL(user.flag)" class="country-flag">
              <span class="country-rank">#{{ currentRankingSystem.countryRank.toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <!-- PP/Score - Large Display -->
        <div v-if="selectedRankingSystem" class="performance-card pp-card">
          <div class="card-glow pp-glow" />
          <div class="card-content">
            <div class="card-label">
              {{
                ppRankingSystems.includes(selectedRankingSystem as PPRankingSystem)
                  ? "Performance Points"
                  : "Total Score"
              }}
            </div>
            <div class="card-value pp-value">
              <span v-if="ppRankingSystems.includes(selectedRankingSystem as PPRankingSystem)">
                {{ Math.floor(animatedPP).toLocaleString() }}
              </span>
              <span v-else>
                {{ scoreFmtCompact((deferredRender[selectedRankingSystem as LeaderboardRankingSystem] as ScoreRank).score as bigint) }}
              </span>
              <span class="pp-unit">{{ ppRankingSystems.includes(selectedRankingSystem as PPRankingSystem) ? 'pp' : '' }}</span>
            </div>
            <div class="card-meta">
              {{ scoreFmt(deferredRender.totalHits || 0) }} total hits
            </div>
          </div>
        </div>

        <!-- Level - Circular Progress -->
        <div class="performance-card level-card">
          <div class="card-glow level-glow" />
          <div class="card-content">
            <div class="card-label">Level</div>
            <div class="level-circle-container">
              <svg class="level-circle" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="levelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <circle
                  class="level-circle-bg"
                  cx="100"
                  cy="100"
                  r="90"
                />
                <circle
                  class="level-circle-progress"
                  cx="100"
                  cy="100"
                  r="90"
                  :style="{
                    strokeDashoffset: 565 - (565 * parseFloat(userLevelPercent) / 100)
                  }"
                />
              </svg>
              <div class="level-text">
                <div class="level-number">{{ userLevelInt }}</div>
                <div class="level-percent">{{ userLevelPercent }}%</div>
              </div>
            </div>
            <div class="card-meta">
              {{ scoreFmt(ScoreToNextLevel) }} to next
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Secondary Stats Grid -->
    <div class="stats-grid-minimal">
      <div class="stat-card-mini">
        <div class="stat-mini-label">Play Count</div>
        <div class="stat-mini-value">{{ scoreFmt(deferredRender.playCount || 0) }}</div>
        <div class="stat-mini-bar">
          <div class="stat-bar-fill" :style="{ width: '100%' }" />
        </div>
      </div>

      <div class="stat-card-mini">
        <div class="stat-mini-label">Play Time</div>
        <div class="stat-mini-value">{{ playTime.hours }}h {{ playTime.minutes }}m</div>
        <div class="stat-mini-bar">
          <div class="stat-bar-fill" :style="{ width: '85%' }" />
        </div>
      </div>

      <div class="stat-card-mini">
        <div class="stat-mini-label">Max Combo</div>
        <div class="stat-mini-value">{{ scoreFmt(deferredRender.maxCombo || 0) }}x</div>
        <div class="stat-mini-bar">
          <div class="stat-bar-fill" :style="{ width: '70%' }" />
        </div>
      </div>

      <div class="stat-card-mini">
        <div class="stat-mini-label">Accuracy</div>
        <div class="stat-mini-value">{{ (currentRankingSystem?.accuracy || 0).toFixed(2) }}%</div>
        <div class="stat-mini-bar">
          <div class="stat-bar-fill" :style="{ width: `${currentRankingSystem?.accuracy || 0}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.stats-performance {
  @apply py-12 md:py-16;
}

/* Performance Hero */
.performance-hero {
  @apply mb-12;
}

.performance-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.performance-card {
  @apply relative p-8 overflow-hidden;
  @apply border border-black/10 dark:border-white/10;
  @apply backdrop-blur-sm;
  min-height: 240px;
  animation: fadeInUp 0.6s ease-out forwards;
}

.performance-card:nth-child(1) {
  animation-delay: 0.1s;
  opacity: 0;
}

.performance-card:nth-child(2) {
  animation-delay: 0.2s;
  opacity: 0;
}

.performance-card:nth-child(3) {
  animation-delay: 0.3s;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Glowing Background Effect */
.card-glow {
  @apply absolute inset-0 opacity-0;
  @apply transition-opacity duration-700;
  filter: blur(60px);
}

.performance-card:hover .card-glow {
  @apply opacity-100;
}

.rank-glow {
  background: radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.3), transparent 70%);
}

.pp-glow {
  background: radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.3), transparent 70%);
}

.level-glow {
  background: radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.3), transparent 70%);
}

.card-content {
  @apply relative z-10 flex flex-col items-center justify-center h-full;
}

.card-label {
  @apply text-xs uppercase tracking-widest font-light mb-4;
  @apply text-gbase-500 dark:text-gbase-400;
}

.card-value {
  @apply text-6xl md:text-7xl font-extralight tracking-tighter mb-2;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rank-value {
  @apply flex items-baseline;
}

.rank-hash {
  @apply text-4xl opacity-50 mr-1;
}

.rank-number {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.pp-value {
  @apply flex items-baseline gap-2;
}

.pp-unit {
  @apply text-2xl font-light opacity-60;
}

.card-meta {
  @apply flex items-center gap-2 text-sm font-light;
  @apply text-gbase-600 dark:text-gbase-400;
}

.country-flag {
  @apply w-6 h-4 object-cover;
}

.country-rank {
  @apply font-mono;
}

/* Level Circle */
.level-circle-container {
  @apply relative w-40 h-40 my-4;
}

.level-circle {
  @apply absolute inset-0 w-full h-full;
  transform: rotate(-90deg);
}

.level-circle-bg {
  @apply fill-none stroke-black/5 dark:stroke-white/5;
  stroke-width: 8;
}

.level-circle-progress {
  @apply fill-none;
  stroke: url(#levelGradient);
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 565;
  transition: stroke-dashoffset 1s ease-out;
}

.level-text {
  @apply absolute inset-0 flex flex-col items-center justify-center;
}

.level-number {
  @apply text-5xl font-extralight;
  @apply text-black dark:text-white;
}

.level-percent {
  @apply text-sm font-light opacity-60;
}

/* Secondary Stats Grid */
.stats-grid-minimal {
  @apply grid grid-cols-2 md:grid-cols-4 gap-4;
}

.stat-card-mini {
  @apply p-6;
  @apply border border-black/5 dark:border-white/5;
  @apply hover:border-black/10 dark:hover:border-white/10;
  @apply transition-all duration-300;
  @apply hover:transform hover:scale-105;
}

.stat-mini-label {
  @apply text-xs uppercase tracking-wider font-light mb-2;
  @apply text-gbase-500 dark:text-gbase-400;
}

.stat-mini-value {
  @apply text-2xl font-light mb-3;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
}

.stat-mini-bar {
  @apply w-full h-1 bg-black/5 dark:bg-white/5 overflow-hidden;
}

.stat-bar-fill {
  @apply h-full bg-gradient-to-r from-blue-500 to-purple-500;
  @apply transition-all duration-1000 ease-out;
  animation: fillBar 1.5s ease-out;
}

@keyframes fillBar {
  from {
    width: 0%;
  }
}

</style>
