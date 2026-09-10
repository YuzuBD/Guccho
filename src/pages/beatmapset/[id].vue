<script setup lang="ts">
import { BeatmapSource, RankingStatus } from '~/def/beatmap'
import { Mode } from '~/def'
import { type AppScoresRankingSystemSwitcher } from '#components'
import type { Label } from '~/composables/useLinks'

definePageMeta({
  alias: ['/s/:id', '/beatmapsets/:id'],
})

const app = useNuxtApp()
const route = useRoute('beatmapset-id')
const { supportedModes, supportedRulesets, hasRankingSystem, hasRuleset }
  = useAdapterConfig()
const [switcher, setSwitcher] = useSwitcher()
const lazyBgCover = shallowRef('')
const { t } = useI18n()

const { data: beatmapset, error } = await app.$client.map.beatmapset.useQuery({ id: route.params.id.toString() })
const votePending = shallowRef(false)
const showDownloads = ref(false)

const queryBeatmap = route.query.beatmap?.toString()

const hashed = beatmapset.value?.beatmaps.find(
  bm => bm.md5 === queryBeatmap || bm.id === queryBeatmap
)
const selectedMapMd5 = shallowRef<string>(
  hashed?.md5 || beatmapset.value?.beatmaps[0].md5 || ''
)
const selectedMap = computed(() =>
  beatmapset.value?.beatmaps.find(bm => bm.md5 === selectedMapMd5.value)
)
const allowedModes = computed(() => {
  if (selectedMap.value?.mode === undefined) {
    return supportedModes
  }
  return selectedMap.value.mode !== Mode.Osu
    ? [selectedMap.value.mode]
    : supportedModes
})

const queryRankingSystem = route.query.rank?.toString()
const queryMode = route.query.mode?.toString()
const queryRuleset = route.query.ruleset?.toString()

setSwitcher({
  mode: includes(queryMode, supportedModes) ? queryMode : undefined,
  ruleset: includes(queryRuleset, supportedRulesets) ? queryRuleset : undefined,
})

if (
  queryRankingSystem
  && hasRuleset(switcher.mode, switcher.ruleset)
  && hasRankingSystem(switcher.mode, switcher.ruleset, queryRankingSystem)
) {
  setSwitcher({
    rankingSystem: queryRankingSystem,
  })
}

watch(selectedMapMd5, updateSwitcher)

const {
  data: leaderboard,
  refresh,
  pending: pendingLeaderboard,
} = await useAsyncData(async () => {
  if (!selectedMap.value) {
    return null
  }

  return await app.$client.rank.beatmap.query({
    ...switcher,
    page: 0,
    pageSize: 20,
    md5: selectedMap.value.md5,
  })
})

updateSwitcher()

const title = computed(
  () =>
    `${beatmapset.value?.meta.intl.artist} - ${beatmapset.value?.meta.intl.title} > ${selectedMap.value?.version}`
)
const description = computed(() => selectedMap.value?.version)
const url = useRequestURL()

useHead({
  title,
  titleTemplate: title => `${title} - ${app.$i18n.t(localeKey.server.name.__path__)}`,
})

useSeoMeta({
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: () => beatmapset.value?.assets.cover,
  ogUrl: () => url.href,
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: () => beatmapset.value?.assets.list,
  twitterCard: 'summary',
})

const scoreRS = shallowRef<InstanceType<
  typeof AppScoresRankingSystemSwitcher
> | null>(null)

const links = shallowRef<{
  external: Label[]
  directDownload: Label[]
}>()

onBeforeMount(() => {
  beatmapset.value
    && isBanchoBeatmapset(beatmapset.value)
    && beatmapset.value.assets.cover
    && loadImage(beatmapset.value.assets.cover)
      .then(() => {
        lazyBgCover.value = `url(${beatmapset.value?.assets.cover})`
      })
      .catch(noop)

  links.value = beatmapset.value
    ? useExternalBeatmapsetLinks(beatmapset.value)
    : undefined
})

function rewriteAnchor() {
  const url = new URL(window.location.toString())
  if (selectedMap.value) {
    url.searchParams.set('beatmap', selectedMap.value.md5)
  }

  url.searchParams.set('rank', switcher.rankingSystem)
  url.searchParams.set('mode', switcher.mode)
  url.searchParams.set('ruleset', switcher.ruleset)
  history.replaceState({}, '', url)
}

function updateSwitcher() {
  if (!selectedMap.value) {
    return
  }
  if (selectedMap.value.mode !== Mode.Osu) {
    switcher.mode = selectedMap.value.mode
  }
}

async function vote() {
  if (!selectedMap.value?.request) {
    return
  }

  votePending.value = true
  try {
    const res = await app.$client.map.voteBeatmap.mutate({
      id: selectedMap.value.id,
    })

    if (res) {
      selectedMap.value.request = res
    }
  }
  catch (e) {
    error.value = e as any
  }
  finally {
    votePending.value = false
  }
}

async function update() {
  await refresh()
  updateSwitcher()
  rewriteAnchor()
}
</script>

<i18n lang="yaml">
en-GB:
  beatmapset:
    placement: '{title} by {artist}'
    external-links: External Links
    direct-downloads: Direct downloads
    creator: Creator
    status: Status
    beatmap-id: Beatmap ID
    source-id: Source | ID
    last-update: Last Update
    star-rating: Star Rating
    circle-size: Circle Size
    approach-rate: Approach Rate
    od: OD
    hp-drain: HP Drain
    duration: Duration
    hit-objects: Hit Objects
    hit-object:
      circles: circles
      sliders: sliders
      spinners: spinners
zh-CN:
  beatmapset:
    placement: "曲名:{title} \n 艺术家:{artist}"
    external-links: 其它链接
    direct-downloads: 直接下载
    creator: 谱师
    status: 状态
    beatmap-id: 谱面 ID
    source-id: 来源 | ID
    last-update: 上次更新时间
    star-rating: 难度星级
    circle-size: 圆圈大小
    approach-rate: 缩圈速度
    od: 准度要求
    hp-drain: 掉血速度
    duration: 长度
    hit-objects: 物件统计
    hit-object:
      circles: 圆圈
      sliders: 滑条
      spinners: 转盘
fr-FR:
  beatmapset:
    placement: '{title} par {artist}'
    external-links: Lien externe
    direct-downloads: Téléchargement direct
    creator: Créateur
    status: Statut
    beatmap-id: Beatmap ID
    source-id: Source | ID
    last-update: Dernière mise à jour
    star-rating: Difficulté en étoiles
    circle-size: Taille des cercles
    approach-rate: Taux d'approche
    od: Précision
    hp-drain: Drain de santé
    duration: Durée
    hit-objects: Hit Objects
    hit-object:
      circles: cercles
      sliders: sliders
      spinners: spinners

de-DE:
  beatmapset:
    placement: '{title} von {artist}'
    external-links: Externe Links
    direct-downloads: Direkter Download
    creator: Ersteller
    status: Status
    beatmap-id: Beatmap ID
    source-id: Quelle | ID
    last-update: Letztes Update
    star-rating: Sternebewertung
    circle-size: CS
    approach-rate: AR
    od: OD
    hp-drain: HP-Drain
    duration: Dauer
    hit-objects: Hit-Objekte
    hit-object:
      circles: Circles
      sliders: Sliders
      spinners: Spinner
</i18n>

<template>
  <section v-if="error" class="mx-auto section custom-container">
    <div>
      {{ formatGucchoErrorWithT(t, error) }}
    </div>
  </section>
  <div
    v-else-if="beatmapset"
    :class="[
      isBanchoBeatmapset(beatmapset) && `pre-bg-cover`,
      lazyBgCover !== '' && 'ready',
    ]"
  >
    <div class="container mx-auto custom-container">
      <div class="header-with-maps">
        <!-- Title and Artist -->
        <div class="flex flex-col gap-4">
          <h1 class="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">
            {{ beatmapset.meta.intl.title }}
          </h1>
          <p class="text-xl md:text-3xl font-light opacity-90 drop-shadow-md">
            {{ beatmapset.meta.intl.artist }}
          </p>
        </div>
        
        <!-- Difficulty Tabs -->
        <t-tabs
          v-model="selectedMapMd5"
          size="md"
          class="tabs-bordered"
          @update:model-value="update"
        >
          <t-tab
            v-for="bm in beatmapset.beatmaps"
            :key="bm.md5"
            :value="bm.md5"
          >
            {{ bm.version }}
          </t-tab>
        </t-tabs>
      </div>
      <div
        v-if="selectedMap"
        class="card bg-white dark:bg-gbase-900 rounded-2xl shadow-2xl overflow-hidden mt-8"
      >
        <div class="relative flex flex-col items-center m-2 md:flex-row">
          <t-tabs
            v-model="switcher.mode"
            class="md:mr-auto"
            @update:model-value="update"
          >
            <template v-for="m in allowedModes">
              <t-tab
                v-if="hasRuleset(m, switcher.ruleset)"
                :key="`sw-${m}`"
                :value="m"
              >
                <img
                  :alt="m"
                  :src="`/icons/mode/${m}.svg`"
                  class="color-theme-light-invert h-mode"
                >
              </t-tab>
            </template>
          </t-tabs>
          <t-tabs
            v-model="switcher.ruleset"
            variant=""
            @update:model-value="update"
          >
            <template v-for="r in supportedRulesets">
              <t-tab
                v-if="hasRuleset(switcher.mode, r)"
                :key="`sw-${r}`"
                :value="r"
              >
                {{ $t(localeKey.ruleset(r)) }}
              </t-tab>
            </template>
          </t-tabs>
        </div>
        <!-- Improved Info Layout -->
        <div class="beatmap-info-layout">
          <!-- Cover Image Section -->
          <div class="cover-section">
            <img
              class="cover-image"
              :src="beatmapset.assets['list@2x']"
              :alt="selectedMap.version"
              :onerror="onLazyImageError"
            >
          </div>
          
          <!-- Download Links - Collapsible -->
          <transition name="downloads-expand">
            <div v-if="showDownloads && links" class="download-section">
              <div class="download-group">
                <h3 class="section-subtitle">
                  {{ t("beatmapset.direct-downloads") }}
                </h3>
                <div class="link-buttons">
                  <a
                    v-for="{ link, label } in links.directDownload"
                    :key="`direct-${label}`"
                    :href="link"
                    class="download-btn primary"
                  >
                    {{ label }}
                  </a>
                </div>
              </div>
              
              <div class="download-group">
                <h3 class="section-subtitle">
                  {{ t("beatmapset.external-links") }}
                </h3>
                <div class="link-buttons">
                  <a
                    v-for="{ link, label } in links.external"
                    :key="`external-${label}`"
                    :href="link"
                    class="download-btn"
                  >
                    {{ label }}
                  </a>
                </div>
              </div>
            </div>
          </transition>
          
          <!-- Stats Grid -->
          <div class="stats-section">
            <dl class="stats-grid">
              <div class="striped rounded-tl-xl">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.creator") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  {{ selectedMap.creator }}
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.status") }}
                </dt>
                <dd class="flex gap-1 striped-text\">
                  <span>{{ RankingStatus[selectedMap.status as any] }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.beatmap-id") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  {{ selectedMap.id }}
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.source-id") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  {{ BeatmapSource[beatmapset.source] }}
                  <template v-if="'foreignId' in selectedMap">
                    | {{ selectedMap.foreignId }}
                  </template>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.last-update") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  {{ selectedMap.lastUpdate }}
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  BPM
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/bpm.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.bpm }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.star-rating") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/overall-difficulty.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.starRate }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.circle-size") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/size.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.circleSize }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.approach-rate") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/approach-rate.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.approachRate }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.od") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/accuracy.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.accuracy }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.hp-drain") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/hp-drain.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.hpDrain }}</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.duration") }}
                </dt>
                <dd class="flex gap-1 striped-text">
                  <img
                    src="~/assets/icons/length.png"
                    alt=""
                    class="w-5 color-theme-light-invert"
                  >
                  <span>{{ selectedMap.properties.totalLength }} seconds</span>
                </dd>
              </div>
              <div class="striped">
                <dt class="text-sm font-medium text-gbase-500">
                  {{ t("beatmapset.hit-objects") }}
                </dt>
                <dd class="striped-text">
                  <span class="flex gap-1">
                    <img
                      src="~/assets/icons/circles.png"
                      alt=""
                      class="w-5 color-theme-light-invert"
                    >
                    <span>
                      {{ selectedMap.properties.count.circles }}
                      {{ t("beatmapset.hit-object.circles") }},</span>
                  </span>
                  <span class="flex gap-1">
                    <img
                      src="~/assets/icons/sliders.png"
                      alt=""
                      class="w-5 color-theme-light-invert"
                    >
                    <span>{{ selectedMap.properties.count.sliders }}
                      {{ t("beatmapset.hit-object.sliders") }},</span>
                  </span>
                  <span class="flex gap-1">
                    <img
                      src="~/assets/icons/spinners.png"
                      alt=""
                      class="w-5 color-theme-light-invert"
                    >
                    <span>{{ selectedMap.properties.count.spinners }}
                      {{ t("beatmapset.hit-object.spinners") }}</span>
                  </span>
                </dd>
              </div>
            </dl>
          </div>
          
          <!-- Downloads Toggle Button -->
          <button
            v-if="links"
            class="downloads-toggle"
            @click="showDownloads = !showDownloads"
          >
            <span>{{ showDownloads ? '隐藏下载链接' : '显示下载链接' }}</span>
            <icon
              :name="showDownloads ? 'mdi:chevron-up' : 'mdi:chevron-down'"
              class="w-5 h-5"
            />
          </button>
        </div>
        <div
          class="collapse pointer-events-none transition-all will-change-transform duration-300 ease-out"
          :class="{
            'collapse-open mt-2 delay-300': selectedMap?.request?.status,
          }"
        >
          <div class="collapse-content p-0 !pb-0 pointer-events-auto">
            <div class="divider m-0" />
            <div v-if="selectedMap" class="p-4">
              <div class="text-xl">
                Rank Request
              </div>
              <div class="flex">
                <div>
                  <span class="text-2xl font-bold font-mono">{{ selectedMap.request?.voteCount }}</span>
                  Votes
                </div>
                <button
                  class="ms-auto btn btn-sm btn-shadow btn-secondary"
                  @click="vote"
                >
                  <template v-if="selectedMap.request?.status === 'allowed'">
                    Vote <i v-if="votePending" class="loading" /><Icon v-else name="material-symbols:how-to-vote" class="w-5 h-5" />
                  </template>
                  <template v-if="selectedMap.request?.status === 'voted'">
                    Unvote <i v-if="votePending" class="loading" /><Icon v-else name="material-symbols:how-to-vote" class="w-5 h-5" />
                  </template>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AppScoresRankingSystemSwitcher
        ref="scoreRS"
        v-model="switcher.rankingSystem" class="mt-2" :mode="switcher.mode"
        :ruleset="switcher.ruleset" @update:model-value="update"
      />
      <div
        class="relative overflow-x-auto rounded-lg bg-base-100" :class="{
          '!rounded-tl-none !rounded-tr-none': scoreRS?.rankingSystems[0] === switcher.rankingSystem,
        }"
      >
        <app-scores-card-list
          v-if="leaderboard" :scores="leaderboard" :ranking-system="switcher.rankingSystem"
          class="transition-opacity opacity-100 transition-filter"
          :class="{
            'opacity-30 saturate-50 blur-md': pendingLeaderboard,
          }"
        />
        <div
          class="absolute inset-0 flex transition-opacity opacity-0 pointer-events-none transition-filter blur-sm" :class="{
            'opacity-100 !blur-none': pendingLeaderboard,
          }"
        >
          <div class="m-auto loading loading-lg" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="postcss">
/* Enhanced header */
.header-with-maps {
  @apply flex flex-col gap-6 py-16 md:py-24 items-center text-center;
  @apply text-white;
}

:deep(table.table.clear-rounded-tl) {
  > thead {
    tr:first-child {
      th:first-child {
        @apply rounded-tl-none;
      }
    }
  }
}

.safari .pre-bg-cover {
  transform: translate3d(0, 0, 0);
}

/* Enhanced background with better blur */
.pre-bg-cover {
  @apply relative;
  min-height: 50vh;

  &:before {
    content: "";
    @apply absolute inset-0 z-[-1];
    background-image: v-bind("lazyBgCover");
    background-size: cover;
    background-position: center;
    filter: blur(50px) brightness(0.5);
    transform: scale(1.1);
  }

  &.ready::before {
    animation: heroBgFade 0.8s ease-out forwards;
  }
}

@keyframes heroBgFade {
  0% {
    filter: opacity(0) blur(60px) brightness(0.3);
  }
  100% {
    filter: opacity(1) blur(50px) brightness(0.5);
  }
}

@media (prefers-color-scheme: dark) {
  @keyframes fadeIn {
    0% {
      filter: opacity(0) contrast(0.5) brightness(1) blur(5em);
    }

    100% {
      filter: opacity(1) contrast(0.5) brightness(0.5) blur(3em);
    }
  }
}

/* Mode icons enhancement */
.h-mode {
  @apply w-8 h-8;
  @apply transition-all duration-300 ease-out;
  @apply opacity-40 cursor-pointer;
  @apply hover:opacity-70 hover:scale-105;
}

.tab-active .h-mode {
  @apply opacity-100;
}

/* Card enhancement */
.card {
  @apply shadow-2xl rounded-2xl;
  animation: cardSlideUp 0.6s ease-out;
}

@keyframes cardSlideUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}


/* Improved Beatmap Info Layout */
.beatmap-info-layout {
  @apply flex flex-col gap-6 p-6;
}

.cover-section {
  @apply w-full max-w-md mx-auto;
}

.cover-image {
  @apply w-full rounded-2xl shadow-2xl;
  @apply transition-transform duration-300;
}

.cover-image:hover {
  @apply scale-105;
}

/* Download Section */
.download-section {
  @apply flex flex-col md:flex-row gap-6;
}

.download-group {
  @apply flex-1;
}

.section-subtitle {
  @apply text-xs uppercase tracking-widest font-semibold mb-3;
  @apply text-gbase-600 dark:text-gbase-400;
}

.link-buttons {
  @apply flex flex-col gap-2;
}

.download-btn {
  @apply block py-3 px-4 rounded-lg text-center;
  @apply text-sm font-medium;
  @apply bg-black/5 dark:bg-white/5;
  @apply border border-black/10 dark:border-white/10;
  @apply transition-all duration-200;
  @apply hover:bg-black/10 dark:hover:bg-white/10;
  @apply hover:shadow-md hover:-translate-y-0.5;
}

.download-btn.primary {
  @apply bg-blue-500/10 text-blue-600 dark:text-blue-400;
  @apply border-blue-500/20;
  @apply hover:bg-blue-500/20;
}

/* Stats Section */
.stats-section {
  @apply mt-4;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-px;
  @apply bg-gradient-to-br from-black/10 via-black/5 to-transparent;
  @apply dark:bg-gradient-to-br dark:from-white/10 dark:via-white/5 dark:to-transparent;
  @apply rounded-xl overflow-hidden;
  @apply shadow-sm;
}

.stats-grid .striped {
  @apply bg-white/95 dark:bg-gbase-900/95;
  @apply backdrop-blur-sm;
  @apply p-5;
  @apply flex items-center justify-between;
  @apply transition-all duration-300;
  @apply hover:bg-blue-50/50 dark:hover:bg-blue-950/20;
  @apply hover:shadow-sm;
  @apply border-l-2 border-transparent;
  @apply hover:border-l-blue-500/50;
}

/* Downloads Toggle Button */
.downloads-toggle {
  @apply w-full py-3 px-4 mt-4;
  @apply flex items-center justify-center gap-2;
  @apply text-sm font-medium;
  @apply bg-black/5 dark:bg-white/5;
  @apply border border-black/10 dark:border-white/10;
  @apply rounded-lg;
  @apply transition-all duration-200;
  @apply hover:bg-black/10 dark:hover:bg-white/10;
  @apply cursor-pointer;
}

.downloads-toggle:hover {
  @apply shadow-md;
}

/* Downloads Expand Animation */
.downloads-expand-enter-active,
.downloads-expand-leave-active {
  transition: all 0.3s ease-out;
  overflow: hidden;
}

.downloads-expand-enter-from {
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
}

.downloads-expand-enter-to {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

.downloads-expand-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

.downloads-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-20px);
}

.stats-grid .striped dt {
  @apply text-xs uppercase tracking-wider font-semibold;
  @apply text-gbase-500 dark:text-gbase-500;
}


/* Ranking System Switcher Tabs */
.tabs-lifted .tab {
  @apply rounded-t-lg;
  @apply rounded-br-lg;
}

.tabs-lifted .tab-active {
  @apply rounded-tl-lg;
  @apply rounded-br-none;
}

.tabs-lifted .tab-active ~ .tab {
  @apply rounded-tr-lg rounded-tl-none;
  @apply rounded-bl-lg rounded-br-none;
}

.stats-grid .striped dd {
  @apply flex items-center gap-2;
  @apply text-lg font-semibold;
  @apply text-gbase-800 dark:text-gbase-100;
}
/* Stats section spacing */
.card dl {
  @apply divide-y divide-black/5 dark:divide-white/5;
}

.card .striped {
  @apply py-4 px-6;
  @apply transition-colors duration-200;
  @apply hover:bg-black/[0.02] dark:hover:bg-white/[0.02];
}

.card .striped:nth-child(4n+1),
.card .striped:nth-child(4n+2) {
  @apply bg-black/[0.01] dark:bg-white/[0.01];
}

/* Cover image enhancement */
.card img.rounded-xl {
  @apply rounded-2xl shadow-xl;
  @apply transition-transform duration-300;
}

.card img.rounded-xl:hover {
  @apply scale-105;
}

/* Links styling */
.menu li a {
  @apply py-2.5 px-4 rounded-lg;
  @apply text-sm font-light;
  @apply bg-black/[0.02] dark:bg-white/[0.02];
  @apply transition-all duration-200;
}

.menu li a:hover {
  @apply bg-black/[0.05] dark:bg-white/[0.05];
  @apply translate-x-1 shadow-sm;
}

/* Difficulty tabs enhancement */
.tabs-bordered .tab {
  @apply px-6 py-2.5 rounded-full;
  @apply bg-white/10 backdrop-blur-sm;
  @apply border border-white/20;
  @apply text-white/80 font-light text-sm text-center;
  @apply transition-all duration-300;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  white-space: nowrap;
  min-width: fit-content;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tabs-bordered .tab:hover {
  @apply bg-white/20 text-white scale-105;
}

.tabs-bordered .tab-active {
  @apply bg-white text-black font-medium;
  @apply shadow-lg scale-105;
}

/* Leaderboard enhancement */
.rounded-lg.bg-base-100 {
  @apply shadow-xl;
  animation: cardSlideUp 0.6s ease-out 0.3s backwards;
}
</style>
