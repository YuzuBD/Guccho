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

let prevSwitcherState = {
  ...page.switcher as UnwrapShallowReactive<typeof page['switcher']>,
}
function stabilizeScoreRank(rankingSystem: LeaderboardRankingSystem) {
  if (
    leaderboardScoreRankingSystems.includes(
      rankingSystem as LeaderboardScoreRankingSystem,
    )
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
const topPage = shallowRef(0)
const outStatus = ref<'idle' | 'pending' | 'error' | 'success'>('pending')

/*
 * Registered here — in the synchronous part of setup — deliberately. This component
 * awaits `useAsyncData()` further down, and a Vue lifecycle hook registered after a
 * top-level await has no active component instance: it warns and silently never runs.
 * The switcher watcher below lives outside onMounted for the same reason (`watch` needs
 * no instance), so its disposal is wired up explicitly instead.
 */
let stopSwitcherWatch: (() => void) | undefined
onBeforeUnmount(() => stopSwitcherWatch?.())

defineExpose({
  status: outStatus,
})

const {
  data: top,
  error: errorTop,
  refresh: refreshTop,
  pending: pendingTop,
  status,
} = await useAsyncData(async () => {
  if (
    !page.user
    || !page.switcher.mode
    || !page.switcher.ruleset
    || !page.switcher.rankingSystem
  ) {
    return {
      count: 0,
      scores: [],
      handle: page.user?.id,
      page: topPage.value,
      lastSwitcherStatus: {
        ...page.switcher,
      },
    }
  }
  const val = await app.$client.user.tops.query({
    id: page.user.id,
    mode: page.switcher.mode,
    ruleset: page.switcher.ruleset,
    rankingSystem: page.switcher.rankingSystem as PPRankingSystem,
    page: topPage.value,
  }) as {
    count: number
    scores: RankingSystemScore<string, string, Mode, LeaderboardRankingSystem, RankingStatus>[]
  }
  return {
    ...val,

    page: topPage.value,
    id: page.user.id,
    lastSwitcherStatus: {
      ...page.switcher,
    },
  }
})
watch([() => page.user, topPage], async () => {
  if (!page.user) {
    return
  }
  await refreshTop()
})

watch(status, (val) => {
  outStatus.value = val
})
outStatus.value = status.value

const transition = shallowRef<'left' | 'right'>('left')
stopSwitcherWatch = (() => {
  const animationDirection = <T extends readonly any[]>(
    val: T[number],
    prevVal: T[number],
    array: T,
  ) => {
    const [idx, prevIdx] = [array.indexOf(val), array.indexOf(prevVal)]
    if (idx === prevIdx) {
      return
    }
    if (idx > prevIdx) {
      return 'right'
    }
    else {
      return 'left'
    }
  }

  // transition direction
  const arrayMap = {
    mode: modes,
    ruleset: rulesets,
    rankingSystem: leaderboardRankingSystems,
  } as const

  const computeAnimateDirection = () => {
    const sw = page.switcher

    for (const [key, switcherState] of Object.entries(sw)) {
      const [value, previousValue] = [
        switcherState,
        prevSwitcherState[key as keyof typeof prevSwitcherState],
      ]
      const direction = animationDirection(
        value,
        previousValue,
        arrayMap[key as keyof typeof prevSwitcherState],
      )
      if (!direction) {
        continue
      }
      transition.value = direction
      break
    }
  }

  // `page.switcher` itself, not `() => page.switcher`: a getter would return the same
  // object reference every time and the watcher would never fire.
  return watch(page.switcher, (sw) => {
    if (switchBetweenScoreRanks()) {
      prevSwitcherState = { ...sw }
      return
    }
    // reset bp page
    topPage.value = 0
    // animate
    computeAnimateDirection()
    refreshTop()
    prevSwitcherState = { ...sw }
  })
})()
function prevPage(val: Ref<number>) {
  transition.value = 'left'
  if (val.value > 0) {
    val.value -= 1
  }
}
function nextPage(val: Ref<number>) {
  transition.value = 'right'
  if (val.value < 9) {
    val.value += 1
  }
}

const prevTop = prevPage.bind(null, topPage)
const nextTop = nextPage.bind(null, topPage)
</script>

<i18n src="./scores.base.yaml" lang="yaml" />

<i18n lang="yaml">
en-GB:
  top: Top Ranks
  loading: Loading Top Scores...

zh-CN:
  top: 排行榜
  loading: 正在加载排行榜

fr-FR:
  top: Premières places
  loading: Chargement des Scores...

de-DE:
  top: Top Ränge
  loading: Lade Top Scores...
</i18n>

<template>
  <div v-if="errorTop" class="error-message">
    {{ errorTop }}
  </div>
  <template v-else-if="page.user">
    <section v-if="top?.count" class="scores-section-minimal">
      <div class="section-header-minimal">
        <h2 class="section-title-minimal">{{ t('top') }}</h2>
        <span class="section-count-minimal">{{ top.count }}</span>
      </div>

      <div
        class="scores-list-minimal"
        :class="{ 'loading-state': pendingTop }"
      >
        <transition :name="transition">
          <ul
            :key="top.lastSwitcherStatus.mode
              + top.lastSwitcherStatus.ruleset
              + stabilizeScoreRank(top.lastSwitcherStatus.rankingSystem)
              + page.user.id
              + top.page
            "
            class="score-items"
          >
            <li v-for="i in top.scores" :key="`tops-${i.id}`">
              <app-score-list-item
                :score="i"
                :mode="top.lastSwitcherStatus.mode"
                :ruleset="top.lastSwitcherStatus.ruleset"
                :ranking-system="top.lastSwitcherStatus.rankingSystem"
              />
            </li>
          </ul>
        </transition>
      </div>

      <div class="pagination-minimal">
        <button
          class="pagination-btn"
          :disabled="topPage === 0"
          @click="prevTop"
        >
          Previous
        </button>
        <button
          class="pagination-current"
          @click="refreshTop()"
        >
          Page {{ topPage + 1 }}
        </button>
        <button
          class="pagination-btn"
          :disabled="top.scores.length < 10"
          @click="nextTop"
        >
          Next
        </button>
      </div>
    </section>
    <div v-else-if="!top?.scores.length && pendingTop" class="loading-message">
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
  @apply flex items-baseline justify-between pb-6;
  @apply border-b border-black/5 dark:border-white/5;
}

.section-title-minimal {
  @apply text-2xl md:text-3xl font-light tracking-tight;
  @apply text-black dark:text-white;
}

.section-count-minimal {
  @apply text-sm font-light;
  @apply text-gbase-500 dark:text-gbase-500;
  font-variant-numeric: tabular-nums;
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
