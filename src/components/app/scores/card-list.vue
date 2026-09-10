<script setup lang="ts">
import type { RankingSystem } from '$active'
import type { BeatmapLeaderboard } from '~/def/leaderboard'
import { Rank } from '~/def'

const props = defineProps<{
  scores: BeatmapLeaderboard<string>[]
  rankingSystem: RankingSystem
}>()

const { t } = useI18n()
const comma = createNumberFormatter()
const pp = createPPFormatter()
</script>

<i18n lang="yaml">
en-GB:
  no-score: No scores available
zh-CN:
  no-score: 没有成绩
</i18n>

<template>
  <div class="score-cards">
    <template v-if="props.scores.length">
      <div
        v-for="(item, index) in props.scores"
        :key="index"
        class="score-card"
      >
        <!-- Rank Badge -->
        <div class="rank-badge">
          #{{ index + 1 }}
        </div>

        <!-- Player Info -->
        <div class="player-section">
          <div class="avatar">
            <nuxt-img
              :src="item.user.avatarSrc"
              :alt="item.user.name"
              loading="lazy"
              width="48"
              height="48"
            />
          </div>
          <div class="player-info">
            <div class="player-name">
              {{ item.user.name }}
            </div>
            <div class="player-meta">
              <span class="score-date">{{ item.score.playedAt.toLocaleDateString() }}</span>
            </div>
          </div>
        </div>

        <!-- Score Stats -->
        <div class="stats-section">
          <div class="stat-item primary">
            <div class="stat-label">Score</div>
            <div class="stat-value">{{ comma(item.score.score) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Accuracy</div>
            <div class="stat-value">{{ Number(item.score.accuracy).toFixed(2) }}%</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">{{ rankingSystem === Rank.PPv2 ? 'PP' : 'Score' }}</div>
            <div class="stat-value">{{ rankingSystem === Rank.PPv2 ? pp(item.score[Rank.PPv2] || 0) : comma(item.score.score) }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Combo</div>
            <div class="stat-value">{{ item.score.maxCombo }}x</div>
          </div>
        </div>

        <!-- Hit Stats -->
        <div class="hits-section">
          <span class="hit-count">300 {{ item.score.n300 }}</span>
          <span class="hit-count">100 {{ item.score.n100 }}</span>
          <span class="hit-count">50 {{ item.score.n50 }}</span>
          <span class="hit-count miss">Miss {{ item.score.nMiss }}</span>
        </div>

        <!-- Actions -->
        <div class="actions-section">
          <nuxt-link :to="`/score/${item.score.id}`" class="action-link">
            <Icon name="material-symbols:info-outline" />
            Detail
          </nuxt-link>
          <a :href="`/replay/${item.score.id}/download`" class="action-link primary">
            <Icon name="material-symbols:play-arrow" />
            Replay
          </a>
        </div>

        <!-- Grade Badge -->
        <div class="grade-badge">
          {{ item.score.grade }}
        </div>
      </div>
    </template>
    <div v-else class="no-scores">
      {{ t('no-score') }}
    </div>
  </div>
</template>

<style scoped lang="postcss">
.score-cards {
  @apply space-y-3 p-4;
}

.score-card {
  @apply relative;
  @apply bg-white dark:bg-gbase-900;
  @apply rounded-xl;
  @apply p-5;
  @apply border border-black/5 dark:border-white/5;
  @apply transition-all duration-300;
  @apply hover:shadow-lg hover:border-blue-500/30;
  @apply hover:-translate-y-0.5;
}

/* Rank Badge */
.rank-badge {
  @apply absolute -top-2 -left-2;
  @apply bg-gradient-to-br from-blue-500 to-blue-600;
  @apply text-white font-bold;
  @apply w-10 h-10;
  @apply rounded-full;
  @apply flex items-center justify-center;
  @apply shadow-md;
  @apply text-sm;
}

/* Player Section */
.player-section {
  @apply flex items-center gap-4 mb-4;
}

.avatar {
  @apply shrink-0;
}

.avatar img {
  @apply w-12 h-12 rounded-lg shadow-sm;
}

.player-info {
  @apply flex-1;
}

.player-name {
  @apply text-lg font-semibold;
  @apply text-gbase-800 dark:text-gbase-100;
}

.player-meta {
  @apply flex items-center gap-2 mt-1;
  @apply text-sm text-gbase-500;
}

.flag {
  @apply w-5 h-auto shadow-sm;
}

/* Stats Section */
.stats-section {
  @apply grid grid-cols-4 gap-3 mb-4;
  @apply pb-4 border-b border-black/5 dark:border-white/5;
}

.stat-item {
  @apply text-center;
}

.stat-item.primary .stat-value {
  @apply text-blue-600 dark:text-blue-400;
}

.stat-label {
  @apply text-xs uppercase tracking-wide;
  @apply text-gbase-500 dark:text-gbase-500;
  @apply mb-1;
}

.stat-value {
  @apply text-base font-semibold;
  @apply text-gbase-800 dark:text-gbase-100;
  @apply font-mono;
}

/* Hits Section */
.hits-section {
  @apply flex gap-3 mb-4 flex-wrap;
}

.hit-count {
  @apply px-3 py-1.5;
  @apply rounded-lg;
  @apply text-xs font-medium;
  @apply bg-black/5 dark:bg-white/5;
  @apply text-gbase-700 dark:text-gbase-300;
}

.hit-count.miss {
  @apply bg-red-500/10 text-red-600 dark:text-red-400;
}

/* Actions Section */
.actions-section {
  @apply flex gap-2;
}

.action-link {
  @apply flex items-center gap-1.5;
  @apply px-4 py-2;
  @apply rounded-lg;
  @apply text-sm font-medium;
  @apply bg-black/5 dark:bg-white/5;
  @apply text-gbase-700 dark:text-gbase-300;
  @apply transition-all duration-200;
  @apply hover:bg-black/10 dark:hover:bg-white/10;
  @apply hover:shadow-sm;
  @apply no-underline;
}

.action-link.primary {
  @apply bg-blue-500/10 text-blue-600 dark:text-blue-400;
  @apply hover:bg-blue-500/20;
}

/* Grade Badge */
.grade-badge {
  @apply absolute -top-2 -right-2;
  @apply bg-gradient-to-br from-amber-400 to-amber-500;
  @apply text-white font-bold;
  @apply w-10 h-10;
  @apply rounded-full;
  @apply flex items-center justify-center;
  @apply shadow-md;
  @apply text-sm;
}

/* No Scores */
.no-scores {
  @apply text-center py-12;
  @apply text-gbase-500;
}
</style>
