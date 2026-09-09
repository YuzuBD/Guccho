<script setup lang="ts">
import userpageStore from '~/store/userpage'

const page = userpageStore()

const totalCount = computed(() => {
  return Object.values(page.currentStatistic?.scoreRankComposition || {}).reduce((acc, cur) => acc + cur, 0)
})

const composition = computed(
  () => page.currentStatistic?.scoreRankComposition,
)

const ranks = [
  { key: 'ssh', label: 'SS+', color: '#fbbf24' },
  { key: 'ss', label: 'SS', color: '#fcd34d' },
  { key: 'sh', label: 'S+', color: '#d1d5db' },
  { key: 's', label: 'S', color: '#e5e7eb' },
  { key: 'a', label: 'A', color: '#34d399' },
  { key: 'b', label: 'B', color: '#60a5fa' },
  { key: 'c', label: 'C', color: '#c084fc' },
  { key: 'd', label: 'D', color: '#f87171' },
]

// Always show all 8 ranks
const rankStats = computed(() => {
  if (!composition.value || !totalCount.value) return []
  
  return ranks.map(rank => {
    const count = composition.value[rank.key] || 0
    const percentage = totalCount.value > 0 ? (count / totalCount.value) * 100 : 0
    
    return {
      ...rank,
      count,
      percentage,
    }
  })
})

const bestRank = computed(() => {
  return rankStats.value.find(r => r.count > 0) || rankStats.value[0]
})

const mostCommon = computed(() => {
  return rankStats.value.reduce((a, b) => a.count > b.count ? a : b, rankStats.value[0])
})
</script>

<template>
  <div v-if="composition && totalCount" class="rank-composition-clean">
    <!-- Header with Total -->
    <div class="composition-header-clean">
      <div class="header-left">
        <div class="header-line" />
        <h3 class="header-title">Ranks</h3>
      </div>
      <div class="header-right">
        <div class="total-number-large">{{ totalCount.toLocaleString() }}</div>
        <div class="total-label-small">Total Scores</div>
      </div>
    </div>

    <!-- Unified 8-Column Grid -->
    <div class="ranks-grid-unified">
      <div
        v-for="(rank, index) in rankStats"
        :key="rank.key"
        class="rank-cell"
        :style="{ 
          '--rank-color': rank.color,
          '--delay': `${index * 0.05}s`
        }"
      >
        <!-- Color Bar Top -->
        <div class="rank-color-bar" :style="{ backgroundColor: rank.color }" />
        
        <!-- Content -->
        <div class="rank-cell-content">
          <div class="rank-label-minimal">{{ rank.label }}</div>
          <div class="rank-count-large">{{ rank.count }}</div>
          <div class="rank-percent-small">{{ rank.percentage.toFixed(1) }}%</div>
        </div>
        
        <!-- Bottom Indicator -->
        <div class="rank-indicator">
          <div 
            class="rank-indicator-fill"
            :style="{ 
              width: `${Math.min(rank.percentage * 2, 100)}%`,
              backgroundColor: rank.color 
            }"
          />
        </div>
      </div>
    </div>

    <!-- Compact Summary Bar -->
    <div class="summary-bar-compact">
      <div class="summary-compact-item">
        <span class="summary-compact-label">Best</span>
        <span class="summary-compact-value">{{ bestRank.label }}</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-compact-item">
        <span class="summary-compact-label">Most</span>
        <span class="summary-compact-value">{{ mostCommon.label }}</span>
      </div>
      <div class="summary-divider" />
      <div class="summary-compact-item">
        <span class="summary-compact-label">Variety</span>
        <span class="summary-compact-value">{{ rankStats.filter(r => r.count > 0).length }}/8</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.rank-composition-clean {
  @apply py-8 md:py-12;
}

/* Clean Header */
.composition-header-clean {
  @apply flex items-start justify-between mb-8;
}

.header-left {
  @apply flex items-center gap-4;
}

.header-line {
  @apply w-12 h-px bg-black dark:bg-white;
}

.header-title {
  @apply text-3xl md:text-4xl font-extralight tracking-tight;
  @apply text-black dark:text-white;
}

.header-right {
  @apply text-right;
}

.total-number-large {
  @apply text-4xl md:text-5xl font-extralight tracking-tight;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.total-label-small {
  @apply text-xs uppercase tracking-widest font-light mt-1;
  @apply text-gbase-500 dark:text-gbase-400;
}

/* Unified Grid - Always 8 Columns */
.ranks-grid-unified {
  @apply grid grid-cols-4 md:grid-cols-8 gap-3;
  @apply mb-6;
}

.rank-cell {
  @apply relative bg-white dark:bg-black;
  @apply border border-black/5 dark:border-white/5;
  @apply hover:border-black/20 dark:hover:border-white/20;
  @apply transition-all duration-300;
  @apply overflow-hidden;
  animation: slideUp 0.4s ease-out var(--delay) backwards;
  aspect-ratio: 1 / 1.2;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.rank-cell:hover {
  @apply transform scale-105;
  @apply shadow-lg;
}

/* Color Bar */
.rank-color-bar {
  @apply absolute top-0 left-0 right-0 h-1;
  @apply transition-all duration-300;
}

.rank-cell:hover .rank-color-bar {
  @apply h-2;
}

/* Cell Content */
.rank-cell-content {
  @apply flex flex-col items-center justify-center;
  @apply h-full p-3;
}

.rank-label-minimal {
  @apply text-xs uppercase tracking-widest font-light mb-2;
  @apply text-gbase-600 dark:text-gbase-400;
}

.rank-count-large {
  @apply text-3xl md:text-4xl font-extralight;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.rank-percent-small {
  @apply text-xs font-light mt-2;
  @apply text-gbase-500 dark:text-gbase-500;
  font-variant-numeric: tabular-nums;
}

/* Bottom Indicator */
.rank-indicator {
  @apply absolute bottom-0 left-0 right-0 h-1;
  @apply bg-black/5 dark:bg-white/5;
  @apply overflow-hidden;
}

.rank-indicator-fill {
  @apply h-full;
  @apply transition-all duration-1000 ease-out;
  animation: fillIndicator 1.5s ease-out;
}

@keyframes fillIndicator {
  from {
    width: 0%;
  }
}

/* Compact Summary Bar */
.summary-bar-compact {
  @apply flex items-center justify-center gap-6;
  @apply py-4 px-6;
  @apply border border-black/5 dark:border-white/5;
  @apply bg-black/[0.01] dark:bg-white/[0.01];
}

.summary-compact-item {
  @apply flex items-baseline gap-2;
}

.summary-compact-label {
  @apply text-xs uppercase tracking-wider font-light;
  @apply text-gbase-500 dark:text-gbase-400;
}

.summary-compact-value {
  @apply text-base font-light;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
}

.summary-divider {
  @apply w-px h-4 bg-black/10 dark:bg-white/10;
}

/* Responsive */
@media (max-width: 768px) {
  .header-title {
    @apply text-2xl;
  }
  
  .total-number-large {
    @apply text-3xl;
  }
  
  .rank-count-large {
    @apply text-2xl;
  }
  
  .summary-bar-compact {
    @apply flex-col gap-3;
  }
  
  .summary-divider {
    @apply w-full h-px;
  }
}
</style>
