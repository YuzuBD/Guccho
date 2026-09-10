<script setup lang="ts">
import type { Ref } from 'vue'
import {
  type Mode,
} from '~/def'
import type { RankingStatus } from '~/def/beatmap'
import type {
  LeaderboardRankingSystem,
  LeaderboardScoreRankingSystem,
  PPRankingSystem,
  ScoreRankingSystem,
} from '$active'
import type { RankingSystemScore } from '~/def/score'
import userpageStore from '~/store/userpage'

const app = useNuxtApp()
const { t } = useI18n()
const page = userpageStore()
const {
  supportedLeaderboardRankingSystems: leaderboardRankingSystems,
  supportedLeaderboardScoreRankingSystems: leaderboardScoreRankingSystems,
  supportedModes: modes,
  supportedRulesets: rulesets,
} = useAdapterConfig()

let prevSwitcherState: UnwrapShallowReactive<typeof page['switcher']> = {
  ...page.switcher,
}
function stabilizeScoreRank(rankingSystem: LeaderboardRankingSystem) {
  if (
    leaderboardScoreRankingSystems.includes(rankingSystem as LeaderboardScoreRankingSystem)
  ) {
    return 'score' as ScoreRankingSystem
  }
  return rankingSystem as PPRankingSystem
}
function switchBetweenScoreRanks() {
  return prevSwitcherState.rankingSystem !== page.switcher.rankingSystem
    && stabilizeScoreRank(prevSwitcherState.rankingSystem)
    === stabilizeScoreRank(page.switcher.rankingSystem)
}
const bpPage = shallowRef(0)
const outStatus = ref<'idle' | 'pending' | 'error' | 'success'>('pending')

defineExpose({
  status: outStatus,
})

const {
  data: bp,
  error: bpError,
  refresh: refreshBP,
  pending: pendingBP,
  status,
} = await useAsyncData(async () => {
  if (
    !page.user
    || !page.switcher.mode
    || !page.switcher.ruleset
    || !page.switcher.rankingSystem
  ) {
    return {
      scores: [],
      handle: page.user?.id,
      bpPage: bpPage.value,
      lastSwitcherStatus: {
        ...page.switcher,
      },
    }
  }
  return {
    scores: await app.$client.user.best.query({
      id: page.user.id,
      mode: page.switcher.mode,
      ruleset: page.switcher.ruleset,
      rankingSystem: page.switcher.rankingSystem,
      page: bpPage.value,
    }) as RankingSystemScore<string, string, Mode, LeaderboardRankingSystem, RankingStatus>[],
    page: bpPage.value,
    id: page.user.id,
    lastSwitcherStatus: {
      ...page.switcher,
    },
  }
})

watch([() => page.user, bpPage], async () => {
  if (!page.user) {
    return
  }
  await refreshBP()
})

watch(status, (val) => {
  outStatus.value = val
})
outStatus.value = status.value

const transition = computed(() => {
  if (
    prevSwitcherState.mode !== page.switcher.mode
    || prevSwitcherState.ruleset !== page.switcher.ruleset
    || !switchBetweenScoreRanks()
  ) {
    return 'slide'
  }
  return 'none'
})
watch(
  () => page.switcher,
  () => {
    prevSwitcherState = { ...page.switcher }
  },
)

function nextPage(r: Ref<number>) {
  r.value++
}
function prevPage(r: Ref<number>) {
  r.value--
}

const prevBp = prevPage.bind(null, bpPage)
const nextBp = nextPage.bind(null, bpPage)
</script>

<i18n src="./scores.base.yaml" lang="yaml" />

<i18n lang="yaml">
en-GB:
  bp: Best Performance

zh-CN:
  bp: 最佳成绩

fr-FR:
  bp: Meilleures Performances

de-DE:
  bp: Beste Leistung
</i18n>

<template>
  <div v-if="bpError" class="error-message">
    {{ bpError }}
  </div>
  <template v-else-if="page.user">
    <section v-if="bp?.scores?.length" class="scores-section-minimal">
      <!-- Section Header -->
      <div class="section-header-minimal">
        <h2 class="section-title-minimal">{{ t('bp') }}</h2>
      </div>

      <!-- Scores List -->
      <div
        class="scores-list-minimal" 
        :class="{ 'loading-state': pendingBP }"
      >
        <transition :name="transition">
          <ul
            :key="bp.lastSwitcherStatus.mode
              + bp.lastSwitcherStatus.ruleset
              + stabilizeScoreRank(bp.lastSwitcherStatus.rankingSystem)
              + page.user.id
              + bp.page
            "
            class="score-items"
          >
            <li v-for="i in bp.scores" :key="`bests-${i.id}`">
              <app-score-list-item
                :score="i" 
                :mode="bp.lastSwitcherStatus.mode"
                :ruleset="bp.lastSwitcherStatus.ruleset" 
                :ranking-system="bp.lastSwitcherStatus.rankingSystem"
              />
            </li>
          </ul>
        </transition>
      </div>

      <!-- Pagination -->
      <div class="pagination-minimal">
        <button 
          class="pagination-btn" 
          :disabled="bpPage === 0" 
          @click="prevBp"
        >
          Previous
        </button>
        <button 
          class="pagination-current" 
          @click="refreshBP()"
        >
          Page {{ bpPage + 1 }}
        </button>
        <button 
          class="pagination-btn" 
          :disabled="bp.scores.length < 10" 
          @click="nextBp"
        >
          Next
        </button>
      </div>
    </section>
    <div v-else-if="!bp?.scores.length && pendingBP" class="loading-message">
      {{ t('loading') }}
    </div>
  </template>
</template>

<style scoped lang="postcss">
.error-message,
.loading-message {
  @apply py-12 text-center text-sm font-light;
  @apply text-gbase-500 dark:text-gbase-500;
}

.scores-section-minimal {
  @apply py-8 md:py-12;
}

.section-header-minimal {
  @apply pb-6 border-b border-black/5 dark:border-white/5;
}

.section-title-minimal {
  @apply text-2xl md:text-3xl font-light tracking-tight;
  @apply text-black dark:text-white;
}

.scores-list-minimal {
  @apply transition-opacity duration-200;
}

.scores-list-minimal.loading-state {
  @apply opacity-30;
}

.score-items {
  @apply space-y-3 md:space-y-4;
}

.score-items > li {
  @apply py-3 md:py-4;
  @apply border-b border-black/5 dark:border-white/5;
  @apply rounded-lg;
  @apply transition-all duration-300;
  
  /* Staggered fade-in animation */
  animation: scoreSlideIn 0.4s ease-out backwards;
}

/* Stagger delay for each item */
.score-items > li:nth-child(1) { animation-delay: 0.05s; }
.score-items > li:nth-child(2) { animation-delay: 0.1s; }
.score-items > li:nth-child(3) { animation-delay: 0.15s; }
.score-items > li:nth-child(4) { animation-delay: 0.2s; }
.score-items > li:nth-child(5) { animation-delay: 0.25s; }
.score-items > li:nth-child(6) { animation-delay: 0.3s; }
.score-items > li:nth-child(7) { animation-delay: 0.35s; }
.score-items > li:nth-child(8) { animation-delay: 0.4s; }
.score-items > li:nth-child(9) { animation-delay: 0.45s; }
.score-items > li:nth-child(10) { animation-delay: 0.5s; }

/* Hover effect */
.score-items > li:hover {
  @apply bg-black/[0.02] dark:bg-white/[0.02];
  @apply shadow-sm;
  transform: translateX(4px);
}

.score-items > li:last-child {
  @apply border-b-0;
}

.pagination-minimal {
  @apply flex items-center gap-2 mt-6;
}

.pagination-btn {
  @apply px-4 py-2 text-sm font-light;
  @apply border border-black/10 dark:border-white/10;
  @apply hover:bg-black/5 dark:hover:bg-white/5;
  @apply disabled:opacity-30 disabled:pointer-events-none;
  @apply transition-all duration-200;
}

.pagination-current {
  @apply flex-1 px-4 py-2 text-sm font-light text-center;
  @apply border border-black/10 dark:border-white/10;
  @apply hover:bg-black/5 dark:hover:bg-white/5;
  @apply transition-all duration-200;
}

/* Transition animations */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
/* Score item slide-in animation */
@keyframes scoreSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
