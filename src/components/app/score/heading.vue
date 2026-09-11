<script setup lang="ts">
/* eslint-disable no-irregular-whitespace */
import type { inferRouterOutputs } from '@trpc/server'
import { Mode, Rank } from '~/def'
import type { RankingSystem } from '$active'
import { type ManiaHitCount, StableMod, type StandardHitCount } from '~/def/score'
import type { AppRouter } from '~/server/trpc/routers'
import { getFlagURL } from '~/utils/flag'

type RouterOutput = inferRouterOutputs<AppRouter>

type Score = NonNullable<RouterOutput['score']['id']>

const props = defineProps<{
  score: Score
  rankingSystem: RankingSystem
}>()

const { hasRankingSystem, hasRuleset } = useAdapterConfig()

const { t, locale } = useI18n()

const scoreFmt = createScoreFormatter({ notation: undefined })
const ppFmt = createPPFormatter()

function haveStandardHitCounts(input: Score): input is typeof input & { hit: StandardHitCount } {
  return input.mode !== Mode.Mania
}

function haveManiaHitCounts(input: Score): input is typeof input & { hit: ManiaHitCount } {
  return input.mode === Mode.Mania
}

/** Grade colors follow the classic osu! convention (SSH/SS silver, S gold, A green …). */
const gradeClass = computed(() => `grade-${String(props.score.grade).toLowerCase()}`)

const showPP = computed(
  () =>
    hasRuleset(props.score.mode, props.score.ruleset)
    && hasRankingSystem(props.score.mode, props.score.ruleset, Rank.PPv2),
)

const pp = computed(() => (showPP.value ? props.score[Rank.PPv2]?.pp : undefined))
const ppRank = computed(() => (showPP.value ? props.score[Rank.PPv2]?.rank : undefined))

/**
 * Beatmap properties, narrowed through `beatmapIsVisible` so the abnormal
 * (deleted / notFound) branch — which carries no `properties` — stays safe.
 */
const mapProperties = computed(() =>
  beatmapIsVisible(props.score.beatmap) ? props.score.beatmap.properties : undefined,
)

/** `totalLength` is in seconds — render as `m:ss`. */
function formatLength(seconds: number) {
  const total = Math.max(0, Math.round(seconds))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/** Trailing `.0` on integer difficulty values looks noisy, so trim it. */
function trimNum(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/**
 * Difficulty readout strip.
 *
 * CS / AR / OD / HP / BPM are osu! jargon and stay untranslated on purpose —
 * players read them as-is in every locale, so they are hard-coded here rather
 * than routed through i18n (only the plain-word "Length" is localised).
 */
const difficultySettings = computed(() => {
  const p = mapProperties.value
  if (!p) {
    return []
  }
  return [
    { key: 'cs', label: 'CS', value: trimNum(p.circleSize) },
    { key: 'ar', label: 'AR', value: trimNum(p.approachRate) },
    { key: 'od', label: 'OD', value: trimNum(p.accuracy) },
    { key: 'hp', label: 'HP', value: trimNum(p.hpDrain) },
    { key: 'bpm', label: 'BPM', value: trimNum(p.bpm) },
    { key: 'length', label: t('setting.length'), value: formatLength(p.totalLength) },
  ]
})

const playedAt = computed(() =>
  props.score.playedAt.toLocaleString(locale.value, { dateStyle: 'medium', timeStyle: 'short' }),
)
const playedAtISO = computed(() => props.score.playedAt.toISOString())

const countryFlag = computed(() => getFlagURL(props.score.user.flag))
</script>

<i18n lang="yaml">
en-GB:
  download-replay: Download replay
  score: Score
  rank: Rank
  setting.length: Length
  hit.300: Perfect
  hit.100: Ok
  hit.50: Meh
  hit.miss: Miss

zh-CN:
  download-replay: 下载回放
  score: 总分
  rank: 排名
  setting.length: 时长
  hit.300: 完美
  hit.100: 良好
  hit.50: 一般
  hit.miss: 失误

fr-FR:
  download-replay: Télécharger le replay
  score: Score
  rank: Rang
  setting.length: Durée
  hit.300: Parfait
  hit.100: Bien
  hit.50: Moyen
  hit.miss: Raté

de-DE:
  download-replay: Replay herunterladen
  score: Punkte
  rank: Rang
  setting.length: Länge
  hit.300: Perfekt
  hit.100: Gut
  hit.50: Okay
  hit.miss: Fehler
</i18n>

<template>
  <app-var
    v-if="beatmapIsVisible(score.beatmap)"
    v-slot="{ value: { beatmapset, creator, mode, md5, version, properties } }"
    :value="score.beatmap"
  >
    <article class="score-detail">
      <!-- ============ Hero: cover art, grade, mods ============ -->
      <header class="score-hero">
        <img
          v-if="beatmapset.assets['cover@2x'] || beatmapset.assets.cover"
          class="score-hero-image"
          :src="beatmapset.assets['cover@2x'] || beatmapset.assets.cover"
          alt=""
        >
        <div v-else class="score-hero-image score-hero-fallback" />
        <div class="score-hero-veil" />

        <div class="score-hero-grade" :class="gradeClass">
          {{ String(score.grade).toUpperCase() }}
        </div>

        <app-var
          v-if="score.mods.length"
          v-slot="{ value: mods }"
          :value="modControl(score.mods)"
        >
          <div class="score-hero-mods" :title="mods.map(m => StableMod[m]).join(', ')">
            <app-mod v-for="mod in mods" :key="mod" :mod="mod" class="score-mod-icon" />
          </div>
        </app-var>
      </header>

      <div class="score-body">
        <!-- ============ Beatmap identity ============ -->
        <section class="score-identity">
          <div class="score-identity-main">
            <nuxt-link-locale
              :to="{ name: 'beatmapset-id', params: { id: beatmapset.id }, query: { mode } }"
              class="score-title"
            >
              {{ autoLocale(beatmapset.meta).title }}
            </nuxt-link-locale>
            <div class="score-artist">
              {{ autoLocale(beatmapset.meta).artist }}
            </div>
          </div>

          <div class="score-identity-diff">
            <nuxt-link-locale
              class="difficulty-pill"
              :to="{ name: 'beatmapset-id', params: { id: beatmapset.id }, query: { beatmap: md5, mode } }"
            >
              <img src="~/assets/icons/overall-difficulty.png" alt="" class="difficulty-star color-theme-light-invert">
              <span class="difficulty-star-value">{{ properties.starRate }}</span>
              <span class="difficulty-name">{{ version }}</span>
            </nuxt-link-locale>
            <div class="score-creator">
              {{ creator }}
            </div>
          </div>
        </section>

        <!-- ============ Player ============ -->
        <section class="score-player">
          <nuxt-link-locale
            class="player-link"
            :to="{ name: 'user-handle', params: { handle: `@${score.user.safeName}` } }"
          >
            <img
              class="player-avatar"
              :src="score.user.avatarSrc"
              :alt="score.user.name"
              width="48"
              height="48"
            >
            <span class="player-name">{{ score.user.name }}</span>
          </nuxt-link-locale>
          <img v-if="countryFlag" class="player-flag" :src="countryFlag" :alt="score.user.flag">
          <div class="player-time">
            <span class="player-time-main">{{ playedAt }}</span>
            <span class="player-time-iso">{{ playedAtISO }}</span>
          </div>
        </section>

        <!-- ============ Difficulty settings ============ -->
        <section class="settings-strip">
          <div v-for="item in difficultySettings" :key="item.key" class="setting-cell">
            <span class="setting-label">{{ item.label }}</span>
            <span class="setting-value">{{ item.value }}</span>
          </div>
        </section>

        <!-- ============ Performance / Accuracy ============ -->
        <section class="highlight-grid">
          <div class="highlight-card">
            <div class="highlight-value">
              <template v-if="pp !== undefined">
                <span class="highlight-number">{{ ppFmt(pp) }}</span>
                <span class="highlight-unit">pp</span>
              </template>
              <span v-else class="highlight-number">{{ scoreFmt(score.score) }}</span>
            </div>
            <div v-if="ppRank" class="highlight-meta">
              {{ t('rank') }} #{{ scoreFmt(ppRank) }}
            </div>
          </div>

          <div class="highlight-card">
            <div class="highlight-value">
              <span class="highlight-number">{{ score.accuracy.toFixed(2) }}</span>
              <span class="highlight-unit">%</span>
            </div>
            <div class="highlight-meta">
              {{ scoreFmt(score.maxCombo) }}x / {{ scoreFmt(properties.maxCombo) }}x
            </div>
          </div>
        </section>

        <!-- ============ Hit counts ============ -->
        <section class="hits-grid">
          <template v-if="haveManiaHitCounts(score)">
            <div class="hit-cell hit-max">
              <span class="hit-value">{{ scoreFmt(score.hit.max) }}</span>
              <span class="hit-label">MAX</span>
            </div>
            <div class="hit-cell hit-300">
              <span class="hit-value">{{ scoreFmt(score.hit[300]) }}</span>
              <span class="hit-label">{{ t('hit.300') }}</span>
            </div>
            <div class="hit-cell hit-200">
              <span class="hit-value">{{ scoreFmt(score.hit[200]) }}</span>
              <span class="hit-label">200</span>
            </div>
            <div class="hit-cell hit-100">
              <span class="hit-value">{{ scoreFmt(score.hit[100]) }}</span>
              <span class="hit-label">{{ t('hit.100') }}</span>
            </div>
            <div class="hit-cell hit-50">
              <span class="hit-value">{{ scoreFmt(score.hit[50]) }}</span>
              <span class="hit-label">{{ t('hit.50') }}</span>
            </div>
            <div class="hit-cell hit-miss">
              <span class="hit-value">{{ scoreFmt(score.hit.miss) }}</span>
              <span class="hit-label">{{ t('hit.miss') }}</span>
            </div>
          </template>

          <template v-else-if="haveStandardHitCounts(score)">
            <div class="hit-cell hit-300">
              <span class="hit-value">{{ scoreFmt(score.hit[300]) }}</span>
              <span class="hit-label">{{ t('hit.300') }}</span>
            </div>
            <div class="hit-cell hit-geki">
              <span class="hit-value">{{ scoreFmt(score.hit.geki) }}</span>
              <span class="hit-label">Geki</span>
            </div>
            <div class="hit-cell hit-100">
              <span class="hit-value">{{ scoreFmt(score.hit[100]) }}</span>
              <span class="hit-label">{{ t('hit.100') }}</span>
            </div>
            <div class="hit-cell hit-katu">
              <span class="hit-value">{{ scoreFmt(score.hit.katu) }}</span>
              <span class="hit-label">Katu</span>
            </div>
            <div class="hit-cell hit-50">
              <span class="hit-value">{{ scoreFmt(score.hit[50]) }}</span>
              <span class="hit-label">{{ t('hit.50') }}</span>
            </div>
            <div class="hit-cell hit-miss">
              <span class="hit-value">{{ scoreFmt(score.hit.miss) }}</span>
              <span class="hit-label">{{ t('hit.miss') }}</span>
            </div>
          </template>
        </section>

        <!-- ============ Score total + replay ============ -->
        <footer class="score-footer">
          <div class="score-total">
            <span class="score-total-label">{{ t('score') }}</span>
            <span class="score-total-value">{{ scoreFmt(score.score) }}</span>
          </div>
          <a rel="nofollow" :href="`/replay/${score.id}/download`" class="btn-minimal score-replay">
            {{ t('download-replay') }}
            <icon name="line-md:download-loop" class="w-4 h-4" />
          </a>
        </footer>
      </div>
    </article>
  </app-var>
</template>

<style scoped lang="postcss">
/* ============ Card shell ============ */
.score-detail {
  /* Single source of truth for hairline rules, flipped in dark mode. */
  --hairline: rgba(0, 0, 0, 0.05);
  --hairline-strong: rgba(0, 0, 0, 0.1);

  @apply w-full overflow-hidden;
  @apply border;
  border-color: var(--hairline-strong);
  @apply bg-white/60 dark:bg-white/[0.02];
  @apply backdrop-blur-sm;
  border-radius: 2px;
  animation: scoreFadeIn 0.6s ease-out forwards;
}

@media (prefers-color-scheme: dark) {
  .score-detail {
    --hairline: rgba(255, 255, 255, 0.05);
    --hairline-strong: rgba(255, 255, 255, 0.1);
  }
}

@keyframes scoreFadeIn {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ============ Hero ============ */
.score-hero {
  @apply relative w-full overflow-hidden;
  aspect-ratio: 16 / 5;
  min-height: 140px;
  border-bottom: 1px solid var(--hairline-strong);
}

.score-hero-image {
  @apply absolute inset-0 w-full h-full object-cover;
  transform: scale(1.02);
}

.score-hero-fallback {
  @apply bg-black/5 dark:bg-white/5;
}

.score-hero-veil {
  @apply absolute inset-0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.55) 0%,
    rgba(0, 0, 0, 0.15) 45%,
    rgba(0, 0, 0, 0.05) 100%
  );
}

.score-hero-grade {
  @apply absolute left-5 bottom-4 md:left-8 md:bottom-5;
  @apply text-7xl md:text-8xl font-extralight;
  line-height: 0.85;
  letter-spacing: -0.04em;
  text-shadow: 0 2px 24px rgba(0, 0, 0, 0.45);
}

/* Grade palette — classic osu! conventions */
.grade-ssh,
.grade-ss {
  background: linear-gradient(160deg, #ffffff 0%, #cbd5e1 45%, #94a3b8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.grade-sh,
.grade-s {
  background: linear-gradient(160deg, #fde68a 0%, #f59e0b 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.grade-a { color: #4ade80; }
.grade-b { color: #60a5fa; }
.grade-c { color: #c084fc; }
.grade-d { color: #fb7185; }
.grade-f { color: #9ca3af; }

.score-hero-mods {
  @apply absolute right-4 top-4 md:right-6 md:top-5;
  @apply flex items-center gap-1.5;
  @apply px-3 py-2;
  @apply bg-black/40 backdrop-blur-md;
  border-radius: 2px;
}

.score-mod-icon {
  /* Icons inherit currentColor; the badge is always dark, so force light glyphs. */
  @apply w-6 h-6 text-white opacity-90;
}

/* ============ Body ============ */
.score-body {
  @apply flex flex-col;
}

/* ---- Identity ---- */
.score-identity {
  @apply flex flex-col gap-4 md:flex-row md:items-start md:justify-between;
  @apply px-5 py-6 md:px-8;
  border-bottom: 1px solid var(--hairline);
}

.score-identity-main {
  @apply min-w-0;
}

.score-title {
  @apply block text-2xl md:text-3xl font-normal tracking-tight truncate;
  @apply text-black dark:text-white;
  text-decoration: none;
  transition: opacity 0.3s ease-out;
}

.score-title:hover {
  @apply opacity-60;
}

.score-artist {
  @apply mt-1 text-sm font-light;
  @apply text-gbase-500 dark:text-gbase-400;
}

.score-identity-diff {
  @apply flex flex-col items-start gap-2 md:items-end md:text-right shrink-0;
}

.difficulty-pill {
  @apply inline-flex items-center gap-2;
  @apply px-3 py-1.5;
  @apply text-sm font-normal;
  @apply text-black dark:text-white;
  border: 1px solid var(--hairline-strong);
  text-decoration: none;
  border-radius: 2px;
  transition: background-color 0.3s ease-out;
}

.difficulty-pill:hover {
  @apply bg-black/5 dark:bg-white/5;
}

.difficulty-star {
  @apply w-4 h-4 opacity-70;
}

.difficulty-star-value {
  @apply font-mono;
  font-variant-numeric: tabular-nums;
}

.difficulty-name {
  @apply font-light max-w-[16rem] truncate;
  @apply text-gbase-600 dark:text-gbase-300;
}

.score-creator {
  @apply text-xs uppercase tracking-wider font-light;
  @apply text-gbase-500 dark:text-gbase-500;
}

/* ---- Player ---- */
.score-player {
  @apply flex flex-wrap items-center gap-x-3 gap-y-2;
  @apply px-5 py-5 md:px-8;
  border-bottom: 1px solid var(--hairline);
}

.player-link {
  @apply flex items-center gap-3 min-w-0;
  text-decoration: none;
}

.player-avatar {
  @apply w-10 h-10 object-cover shrink-0;
  border: 1px solid var(--hairline-strong);
  border-radius: 2px;
}

.player-name {
  @apply text-lg font-normal tracking-tight truncate;
  @apply text-black dark:text-white;
  transition: opacity 0.3s ease-out;
}

.player-link:hover .player-name {
  @apply opacity-60;
}

.player-flag {
  @apply w-6 h-4 object-cover shrink-0;
  border: 1px solid var(--hairline-strong);
}

.player-time {
  @apply ml-auto flex flex-col items-end text-right;
}

.player-time-main {
  @apply text-sm font-light;
  @apply text-gbase-600 dark:text-gbase-300;
}

.player-time-iso {
  @apply text-xs font-mono;
  @apply text-gbase-400 dark:text-gbase-500;
}

/* ---- Shared cell typography ---- */
.setting-label,
.score-total-label {
  @apply text-xs uppercase tracking-widest font-light;
  @apply text-gbase-500 dark:text-gbase-500;
}

/* ---- Settings strip: 3 cols mobile → 6 cols desktop ---- */
.settings-strip {
  @apply grid grid-cols-3 sm:grid-cols-6;
  border-bottom: 1px solid var(--hairline);
}

.setting-cell {
  @apply flex flex-col gap-1 px-4 py-4 md:px-5;
  border-right: 1px solid var(--hairline);
  /* First of the two mobile rows gets a rule underneath. */
  border-bottom: 1px solid var(--hairline);
}

.setting-cell:nth-child(3n) {
  border-right: none;
}

.setting-cell:nth-child(n + 4) {
  border-bottom: none;
}

@media (min-width: 640px) {
  .setting-cell {
    border-right: 1px solid var(--hairline);
    border-bottom: none;
  }

  .setting-cell:nth-child(3n) {
    border-right: 1px solid var(--hairline);
  }

  .setting-cell:last-child {
    border-right: none;
  }
}

.setting-value {
  @apply text-lg font-light;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
}

/* ---- Highlights: stacked mobile → 2 cols desktop ---- */
.highlight-grid {
  @apply grid grid-cols-1 md:grid-cols-2;
  border-bottom: 1px solid var(--hairline);
}

.highlight-card {
  @apply flex flex-col gap-2 px-5 py-7 md:px-8;
  border-bottom: 1px solid var(--hairline);
}

.highlight-card:last-child {
  border-bottom: none;
}

@media (min-width: 768px) {
  .highlight-card {
    border-bottom: none;
    border-right: 1px solid var(--hairline);
  }

  .highlight-card:last-child {
    border-right: none;
  }
}

.highlight-value {
  @apply flex items-baseline gap-1.5;
}

.highlight-number {
  @apply text-5xl md:text-6xl font-extralight tracking-tighter;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.highlight-unit {
  @apply text-lg font-light;
  @apply text-gbase-500 dark:text-gbase-400;
}

.highlight-meta {
  @apply text-sm font-light;
  @apply text-gbase-600 dark:text-gbase-400;
  font-variant-numeric: tabular-nums;
}

/* ---- Hits: 3 cols mobile → 6 cols desktop ---- */
.hits-grid {
  @apply grid grid-cols-3 sm:grid-cols-6;
  border-bottom: 1px solid var(--hairline);
}

.hit-cell {
  @apply flex flex-col items-center gap-1 px-2 py-5;
  border-right: 1px solid var(--hairline);
  border-bottom: 1px solid var(--hairline);
  transition: background-color 0.3s ease-out;
}

.hit-cell:nth-child(3n) {
  border-right: none;
}

.hit-cell:nth-child(n + 4) {
  border-bottom: none;
}

@media (min-width: 640px) {
  .hit-cell {
    border-right: 1px solid var(--hairline);
    border-bottom: none;
  }

  .hit-cell:nth-child(3n) {
    border-right: 1px solid var(--hairline);
  }

  .hit-cell:last-child {
    border-right: none;
  }
}

.hit-cell:hover {
  @apply bg-black/[0.02] dark:bg-white/[0.02];
}

.hit-value {
  @apply text-2xl md:text-3xl font-light;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.hit-label {
  @apply text-xs uppercase tracking-wider font-light;
  @apply text-gbase-500 dark:text-gbase-500;
}

.hit-300 .hit-value,
.hit-max .hit-value,
.hit-geki .hit-value {
  color: #22d3ee;
}

.hit-200 .hit-value,
.hit-100 .hit-value {
  color: #eab308;
}

.hit-50 .hit-value,
.hit-katu .hit-value {
  color: #fb923c;
}

.hit-miss .hit-value {
  color: #ef4444;
}

/* ---- Footer ---- */
.score-footer {
  @apply flex flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between md:px-8;
}

.score-total {
  @apply flex flex-col gap-1;
}

.score-total-value {
  @apply text-3xl md:text-4xl font-extralight tracking-tight;
  @apply text-black dark:text-white;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.score-replay {
  @apply inline-flex items-center gap-2 self-start;
  @apply px-6 py-3 text-xs;
  text-decoration: none;
}

/* ---- Responsive ---- */
@media (max-width: 768px) {
  .score-hero {
    aspect-ratio: 16 / 7;
  }

  .score-hero-grade {
    @apply text-6xl;
  }

  .highlight-number {
    @apply text-4xl;
  }
}
</style>
