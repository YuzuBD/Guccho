<script setup lang="ts">
import {
  Rank,
} from '~/def'
import { BeatmapSource, RankingStatus } from '~/def/beatmap'
import type { ActiveMode, ActiveRuleset, LeaderboardPPRankingSystem, LeaderboardRankingSystem, LeaderboardScoreRankingSystem } from '$active'
import { type RankingSystemScore, StableMod } from '~/def/score'

const props = withDefaults(
  defineProps<{
    score: RankingSystemScore<string, string, ActiveMode, LeaderboardRankingSystem>
    mode: ActiveMode
    ruleset: ActiveRuleset
    rankingSystem: LeaderboardRankingSystem
    useIntl?: boolean
  }>(),
  {
    useIntl: true,
  },
)

const rankingStatusIconMapping: Partial<Record<RankingStatus, string>> = {
  [RankingStatus.Approved]: 'line-md:circle-to-confirm-circle-transition',
  [RankingStatus.Ranked]: 'line-md:chevron-small-triple-up',
  [RankingStatus.Pending]: 'line-md:alert',
  [RankingStatus.Loved]: 'line-md:heart-filled',
  [RankingStatus.Qualified]: 'line-md:confirm',
}

const numberFmt = createNumberFormatter()
const beatmap = computed(() => {
  if (!props.score || !beatmapIsVisible(props.score.beatmap)) {
    return
  }
  return props.score.beatmap
})
const meta = computed(
  (): {
    artist: string
    title: string
  } | void => {
    if (!beatmap.value) {
      return
    }
    if (!beatmapIsVisible(beatmap.value)) {
      return
    }

    if (props.useIntl) {
      return beatmap.value.beatmapset.meta.intl
    }
    else {
      return {
        artist:
          beatmap.value.beatmapset.meta.artist
          || beatmap.value.beatmapset.meta.intl.artist,
        title:
          beatmap.value.beatmapset.meta.title
          || beatmap.value.beatmapset.meta.intl.title,
      }
    }
  },
)

const { t, locale } = useI18n()
const {
  supportedLeaderboardPPRankingSystems: ppRankingSystems,
  supportedLeaderboardScoreRankingSystems: leaderboardScoreRankingSystems,
} = useAdapterConfig()

const mods = computed(() => {
  if (!props.score) {
    return []
  }
  return modControl(props.score.mods)
})

/** Grade colours follow the classic osu! convention — same palette as the score page. */
const gradeClass = computed(() => `score-item-grade-${String(props.score.grade).toLowerCase()}`)
</script>

<i18n lang="yaml">
en-GB:
  unknown-beatmap: Unknown Beatmap
  detail: Detail

zh-CN:
  unknown-beatmap: 未知铺面
  detail: 详情

fr-FR:
  unknown-beatmap: Beatmap Inconnue
  detail: Détail

de-DE:
  unknown-beatmap: Unbekannte Beatmap
  detail: Detail
</i18n>

<template>
  <div class="flex gap-2 px-1 lg:mx-0">
    <div class="h-20 w-14 shrink-0 md:w-24 transition-[width]">
      <picture
        v-if="beatmap
          && beatmapIsVisible(beatmap)
          && beatmap.beatmapset.source === BeatmapSource.Bancho"
      >
        <source v-if="beatmap.beatmapset.assets['list@2x']" :srcset="`${beatmap.beatmapset.assets.list} 1x, ${beatmap.beatmapset.assets['list@2x']} 2x`">
        <nuxt-img
          loading="lazy"
          :src="beatmap.beatmapset.assets.list"
          :alt="autoLocale(beatmap.beatmapset.meta).title"
          :onerror="onLazyImageError"
          class="object-cover w-full h-full shadow-md rounded-xl"
        />
      </picture>
      <icon v-else class="w-full h-full" name="clarity:unknown-status-line" size="100%" />
    </div>

    <div class="truncate shrink grow">
      <template
        v-if="beatmap && beatmapIsVisible(beatmap)"
      >
        <router-link
          class="block"
          :to="{
            name: 'beatmapset-id',
            params: {
              id: beatmap.beatmapset.id as string,
            },
            query: {
              beatmap: beatmap.id as string,
              mode: props.mode,
              ruleset: props.ruleset,
              rank: [Rank.TotalScore, Rank.RankedScore].includes(
                props.rankingSystem,
              )
                ? 'score'
                : props.rankingSystem,
            },
          }"
        >
          <template v-if="meta">
            <span class="score-item-artist">{{ meta.artist }}</span>
            <span class="score-item-title">{{ meta.title }}</span>
          </template>
          <div class="score-item-diff">
            <icon
              v-if="rankingStatusIconMapping[beatmap.status]"
              size="100%"
              class="w-4 h-auto shrink-0"
              :name="rankingStatusIconMapping[beatmap.status]!"
              :aria-label="beatmap.status"
            />
            <span v-if="beatmap" class="score-item-version">
              {{ beatmap.version }}
            </span>
          </div>
        </router-link>
      </template>
      <div v-else>
        {{ t('unknown-beatmap') }}
      </div>
      <time class="score-item-time">
        {{ score.playedAt.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'medium' }) }}
      </time>
    </div>
    <span v-if="score.mods.length" class="hidden p-1 mt-auto space-x-4 rounded-lg lg:block bg-neutral/40 tooltip tooltip-primary" :data-tip="mods.map(m => StableMod[m]).join(', ')">
      <app-mod v-for="mod in mods" :key="mod" :mod="mod" class="w-8 h-8 opacity-80" />
    </span>
    <div class="flex flex-col justify-between">
      <div class="flex justify-end text-lg lg:text-2xl transition-[font-size]">
        <template v-if="(ppRankingSystems).includes(props.rankingSystem as LeaderboardPPRankingSystem)">
          <div class="font-mono font-bold">
            {{ score.pp.toFixed(2) }}
          </div>
          <span class="font-light">{{ $t('global.pp') }}</span>
        </template>
        <template v-else-if="(leaderboardScoreRankingSystems).includes(props.rankingSystem as LeaderboardScoreRankingSystem)">
          <div class="font-mono font-bold">
            {{ numberFmt(score.score) }}
          </div>
        </template>
      </div>
      <div class="text-xs sm:text-sm lg:text-base text-end text-nowrap transition-[font-size]">
        <template v-if="beatmap">
          <span class="font-semibold align-middle">
            {{ score.maxCombo }}
          </span>
          <span class="font-light align-middle">
            /
          </span>
          <span class="align-middle">
            {{ beatmap.properties.maxCombo }}
          </span>
        </template>
        <span v-else class="align-middle">
          {{ score.maxCombo }}
        </span>
        <span class="font-light align-middle">
          x
        </span>
      </div>

      <div class="text-xs sm:text-sm lg:text-base text-end text-nowrap transition-[font-size]">
        <span><b class="font-mono">{{ score.accuracy.toFixed(2) }}</b></span>
        <span class="text-light">% {{ $t('global.acc') }}</span>
      </div>
      <span v-if="score.mods.length" class="block px-2 mt-auto space-x-1 rounded-lg lg:hidden bg-neutral/40 tooltip tooltip-primary" :data-tip="mods.map(m => StableMod[m]).join(', ')">
        <app-mod v-for="mod in mods" :key="mod" :mod="mod" class="w-5 h-5" />
      </span>
    </div>
    <div class="score-item-grade" :class="gradeClass">
      {{ score.grade }}
    </div>
  </div>
</template>

<style lang="postcss">
.score {
  @apply py-2;
}

.score + .score {
  @apply border-t-2 border-gbase-500/20;
}

/* ---- Left column: label-style artist, theme-weight title ---- */
.score-item-artist {
  @apply block text-xs uppercase tracking-wider font-light;
  @apply text-gbase-500 dark:text-gbase-500;
  line-height: 1.4;
}

.score-item-title {
  @apply block text-base md:text-lg font-normal tracking-tight;
  @apply text-black dark:text-white;
  line-height: 1.3;
}

.score-item-diff {
  @apply flex items-center gap-1 mt-0.5;
  @apply text-xs font-light;
  @apply text-gbase-600 dark:text-gbase-400;
  line-height: 1.4;
}

.score-item-version {
  @apply truncate;
}

.score-item-time {
  @apply block text-xs font-light;
  @apply text-gbase-400 dark:text-gbase-500;
  font-variant-numeric: tabular-nums;
  line-height: 1.4;
}

/* ---- Grade ---- */
.score-item-grade {
  @apply self-center text-4xl md:text-5xl text-center w-14 md:w-20;
  @apply font-extralight;
  letter-spacing: -0.03em;
  line-height: 1;
}

.score-item-grade-ssh,
.score-item-grade-ss {
  background: linear-gradient(160deg, #cbd5e1 0%, #94a3b8 60%, #64748b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.score-item-grade-sh,
.score-item-grade-s {
  background: linear-gradient(160deg, #f59e0b 0%, #d97706 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.score-item-grade-a { color: #22c55e; }
.score-item-grade-b { color: #3b82f6; }
.score-item-grade-c { color: #a855f7; }
.score-item-grade-d { color: #f43f5e; }
.score-item-grade-f { color: #9ca3af; }
</style>
