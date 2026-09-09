<script setup lang="ts">
import type { UserProvider } from '~/server/backend/$base/server'
import userpageStore from '~/store/userpage'
import { StableMod } from '~/def/score'

const app = useNuxtApp()
const { t } = useI18n()
const page = userpageStore()

const pagination = shallowRef(0)
const outStatus = ref<'idle' | 'pending' | 'error' | 'success'>('pending')

defineExpose({
  status: outStatus,
})
const {
  data: recent,
  error: err,
  refresh,
  pending,
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
      bpPage: pagination.value,
      lastSwitcherStatus: {
        ...page.switcher,
      },
    }
  }
  return {
    scores: await app.$client.user.recent.query({
      id: page.user.id,
      mode: page.switcher.mode,
      ruleset: page.switcher.ruleset,
      rankingSystem: page.switcher.rankingSystem,
      page: pagination.value,
    }) as UserProvider.RecentScoresResult<string, string>[],
    page: pagination.value,
    id: page.user.id,
    lastSwitcherStatus: {
      ...page.switcher,
    },
  }
})
watch([() => page.user, page.switcher, pagination], async () => {
  if (!page.user) {
    return
  }
  await refresh()
})

watch(status, (val) => {
  outStatus.value = val
})
outStatus.value = status.value
</script>

<i18n src="./scores.base.yaml" lang="yaml" />

<i18n lang="yaml">
en-GB:
  recent: Recent Scores
  folded: '{i} Folded Scores'

zh-CN:
  recent: 最近成绩
  folded: '{i} 个折叠的成绩'

# TODO FR
# TODO DE
</i18n>

<template>
  <div v-if="err" class="error-message">
    {{ err }}
  </div>
  <template v-else-if="page.user">
    <section v-if="recent?.scores?.length" class="scores-section-minimal">
      <div class="section-header-minimal">
        <h2 class="section-title-minimal">{{ t('recent') }}</h2>
      </div>

      <div
        class="scores-list-minimal"
        :class="{ 'loading-state': pending }"
      >
        <ul class="score-items">
          <li v-for="(i, idx) in recent.scores" :key="`recent-${idx}`">
            <template v-if="i.type === 'single'">
              <app-score-list-item
                :score="i"
                :mode="recent.lastSwitcherStatus.mode"
                :ruleset="recent.lastSwitcherStatus.ruleset"
                :ranking-system="recent.lastSwitcherStatus.rankingSystem"
              />
            </template>
            <template v-else-if="i.type === 'group'">
              <div>
                <app-score-list-item
                  v-if="i.scores.find(v => v.id === i.pinned)"
                  :score="{
                    ...i.scores.find(v => v.id === i.pinned)!,
                    beatmap: i.beatmap,
                  }"
                  :mode="recent.lastSwitcherStatus.mode"
                  :ruleset="recent.lastSwitcherStatus.ruleset"
                  :ranking-system="recent.lastSwitcherStatus.rankingSystem"
                />
                <details class="folded-scores">
                  <summary class="folded-summary">
                    <icon name="tabler:layers-selected" class="w-4 h-4" />
                    {{ t('folded', { i: i.scores.length - 1 }) }}
                  </summary>
                  <div class="folded-content">
                    <table class="folded-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Rank</th>
                          <th>PP</th>
                          <th>Score</th>
                          <th>Acc</th>
                          <th>Mods</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="s in i.scores"
                          :key="`recent-folded-${s.id}`"
                        >
                          <td>
                            <nuxt-link-locale
                              class="score-link"
                              :to="{
                                name: 'score-id',
                                params: { id: s.id },
                              }"
                            >
                              <icon v-if="i.pinned === s.id" name="material-symbols:star-outline-rounded" class="w-3 h-3" />
                              {{ s.id }}
                            </nuxt-link-locale>
                          </td>
                          <td>{{ s.grade }}</td>
                          <td>{{ s.pp.toFixed(2) }}</td>
                          <td>{{ s.score.toLocaleString() }}</td>
                          <td>{{ s.accuracy.toFixed(2) }}%</td>
                          <td>
                            <span v-if="s.mods.length" class="mods-list">
                              <app-mod v-for="mod in s.mods" :key="mod" :mod="mod" class="w-4 h-4" />
                            </span>
                          </td>
                          <td>{{ new Date(s.playedAt).toLocaleTimeString() }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </details>
              </div>
            </template>
          </li>
        </ul>
      </div>
    </section>
    <div v-else-if="!recent?.scores.length && pending" class="loading-message">
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

.score-items > li {
  @apply border-b border-black/5 dark:border-white/5;
}

.score-items > li:last-child {
  @apply border-b-0;
}

.folded-scores {
  @apply mt-2 mb-4;
}

.folded-summary {
  @apply flex items-center gap-2 px-4 py-2;
  @apply text-sm font-light;
  @apply border border-black/10 dark:border-white/10;
  @apply hover:bg-black/5 dark:hover:bg-white/5;
  @apply cursor-pointer;
  @apply transition-colors duration-200;
  list-style: none;
}

.folded-summary::-webkit-details-marker {
  display: none;
}

.folded-content {
  @apply mt-2 overflow-x-auto;
}

.folded-table {
  @apply w-full text-sm font-light;
  border-collapse: collapse;
}

.folded-table thead th {
  @apply px-3 py-2 text-left text-xs uppercase tracking-wider;
  @apply text-gbase-500 dark:text-gbase-500;
  @apply border-b border-black/10 dark:border-white/10;
}

.folded-table tbody td {
  @apply px-3 py-2;
  @apply border-b border-black/5 dark:border-white/5;
  font-variant-numeric: tabular-nums;
}

.folded-table tbody tr:hover {
  @apply bg-black/[0.02] dark:bg-white/[0.02];
}

.score-link {
  @apply flex items-center gap-1;
  @apply hover:opacity-60 transition-opacity;
  text-decoration: none;
}

.mods-list {
  @apply flex items-center gap-1;
}
</style>
