<script setup lang="ts">
import type { ActiveMode, ActiveRuleset, LeaderboardRankingSystem } from '$active'
import * as icon from '~/common/icon'
import type { RouteLocationRaw } from '#vue-router'

const props = defineProps<{
  showSort?: boolean
  modelValue?: SwitcherState
  toHref?(switcher: SwitcherState): RouteLocationRaw
}>()

const emit = defineEmits<{
  (event: 'input', res: SwitcherState): void
  (event: 'update:modelValue', res: SwitcherState): void
}>()

const router = useRouter()

export interface SwitcherState {
  mode?: ActiveMode
  ruleset?: ActiveRuleset
  rankingSystem?: LeaderboardRankingSystem
}

const { hasLeaderboardRankingSystem, hasRuleset, supportedModes, supportedRulesets, supportedLeaderboardRankingSystems } = useAdapterConfig()
useI18n()

const [switcher, setSwitcher] = useLeaderboardSwitcher(
  toRaw(props.modelValue) || {},
)
watch(switcher, () => emitData())
function emitData() {
  emit('input', toRaw(switcher))
  emit('update:modelValue', toRaw(switcher))
}

function resolvePath(path: SwitcherState) {
  return props.toHref ? router.resolve(props.toHref(path)).fullPath : undefined
}

// Sidebar state
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}
</script>

<template>
  <div class="mode-switcher-sidebar">
    <!-- Toggle Button (floating) -->
    <button 
      class="sidebar-toggle"
      :class="{ 'open': sidebarOpen }"
      @click="toggleSidebar"
    >
      <svg v-if="!sidebarOpen" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Sidebar -->
    <div 
      class="sidebar"
      :class="{ 'open': sidebarOpen }"
    >
      <div class="sidebar-content">
        <!-- Mode Icons Section -->
        <div class="sidebar-section">
          <h3 class="sidebar-title">Game Mode</h3>
          <div class="mode-grid">
            <a
              v-for="mode in supportedModes"
              :key="mode"
              class="mode-button"
              :class="{
                'active': switcher.mode === mode,
                'disabled': switcher.ruleset && !hasRuleset(mode, switcher.ruleset),
              }"
              :href="resolvePath({ ...switcher, mode })"
              @click.prevent="setSwitcher({ mode })"
            >
              <img
                :src="`/icons/mode/${icon.mode[mode].icon}.svg`"
                class="mode-icon-img"
                :alt="mode"
              >
            </a>
          </div>
        </div>

        <!-- Ruleset Section -->
        <div class="sidebar-section">
          <h3 class="sidebar-title">Ruleset</h3>
          <div class="ruleset-grid">
            <a
              v-for="ruleset in supportedRulesets"
              :key="ruleset"
              class="ruleset-button"
              :class="{
                'active': switcher.ruleset === ruleset,
                'disabled': switcher.mode && !hasRuleset(switcher.mode, ruleset),
              }"
              :href="resolvePath({ ...switcher, ruleset })"
              @click.prevent="setSwitcher({ ruleset })"
            >
              {{ $t(localeKey.ruleset(ruleset)) }}
            </a>
          </div>
        </div>

        <!-- Ranking System Section (if showSort) -->
        <div
          v-if="props.showSort"
          class="sidebar-section"
        >
          <h3 class="sidebar-title">Ranking</h3>
          <div class="ranking-grid">
            <template
              v-for="rankingSystem in supportedLeaderboardRankingSystems"
              :key="rankingSystem"
            >
              <a
                v-if="
                  hasRuleset(switcher.mode, switcher.ruleset)
                    && hasLeaderboardRankingSystem(
                      switcher.mode,
                      switcher.ruleset,
                      rankingSystem,
                    )
                "
                class="ranking-button"
                :class="{
                  'active': switcher.rankingSystem === rankingSystem,
                }"
                :href="resolvePath({ ...switcher, rankingSystem })"
                @click.prevent="setSwitcher({ rankingSystem })"
              >
                {{ $t(localeKey.rankingSystem(rankingSystem)) }}
              </a>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay -->
    <div 
      v-if="sidebarOpen"
      class="sidebar-overlay"
      @click="toggleSidebar"
    />
  </div>
</template>

<style lang="postcss" scoped>
.mode-switcher-sidebar {
  @apply relative;
}

/* Toggle Button */
.sidebar-toggle {
  @apply fixed left-4 top-32 z-50;
  @apply w-12 h-12 flex items-center justify-center;
  @apply bg-white text-black dark:bg-black dark:text-white;
  @apply border border-black/20 dark:border-white/20;
  @apply hover:opacity-80;
  @apply transition-all duration-300;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar-toggle.open {
  @apply left-[280px];
}

/* Sidebar */
.sidebar {
  @apply fixed left-0 top-0 bottom-0 w-64 z-40;
  @apply bg-white dark:bg-[#0a0a0a];
  @apply border-r border-black/10 dark:border-white/10;
  @apply transform -translate-x-full;
  @apply transition-transform duration-300;
  @apply overflow-y-auto;
}

.sidebar.open {
  @apply translate-x-0;
}

.sidebar-content {
  @apply p-6 pt-24;
}

.sidebar-section {
  @apply mb-8;
}

.sidebar-section:last-child {
  @apply mb-0;
}

.sidebar-title {
  @apply text-xs font-light uppercase tracking-widest mb-4;
  @apply text-gbase-500 dark:text-gbase-500;
}

/* Mode Grid */
.mode-grid {
  @apply grid grid-cols-2 gap-3;
}

.mode-button {
  @apply w-full aspect-square flex items-center justify-center;
  @apply border border-black/10 dark:border-white/10;
  @apply opacity-40;
  @apply hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5;
  @apply transition-all duration-200;
  cursor: pointer;
}

.mode-button.active {
  @apply opacity-100 bg-black dark:bg-white;
  @apply border-black dark:border-white;
}

.mode-button.disabled {
  @apply opacity-10 pointer-events-none;
}
.mode-icon-img {
  @apply w-8 h-8;
  /* Default: invert for light backgrounds */
  filter: invert(1);
}

/* Active button: keep original icon color (white icons on dark bg, dark icons on light bg) */
.mode-button.active .mode-icon-img {
  filter: invert(0);
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .mode-icon-img {
    filter: invert(0);
  }
  
  .mode-button.active .mode-icon-img {
    filter: invert(1);
  }
}

/* Ruleset Grid */
.ruleset-grid {
  @apply flex flex-col gap-2;
}

.ruleset-button {
  @apply w-full px-4 py-3 text-sm font-light text-center;
  @apply border border-black/10 dark:border-white/10;
  @apply opacity-60;
  @apply hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5;
  @apply transition-all duration-200;
  cursor: pointer;
  text-decoration: none;
}

.ruleset-button.active {
  @apply opacity-100 bg-black text-white dark:bg-white dark:text-black;
  @apply border-black dark:border-white;
}

.ruleset-button.disabled {
  @apply opacity-20 pointer-events-none;
}

/* Ranking Grid */
.ranking-grid {
  @apply flex flex-col gap-2;
}

.ranking-button {
  @apply w-full px-4 py-2 text-xs font-light uppercase tracking-wider text-center;
  @apply border border-black/10 dark:border-white/10;
  @apply opacity-60;
  @apply hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5;
  @apply transition-all duration-200;
  cursor: pointer;
  text-decoration: none;
}

.ranking-button.active {
  @apply opacity-100 bg-black text-white dark:bg-white dark:text-black;
  @apply border-black dark:border-white;
}

/* Overlay */
.sidebar-overlay {
  @apply fixed inset-0 bg-black/20 dark:bg-black/40 z-30;
  @apply transition-opacity duration-300;
}

/* Scrollbar styling */
.sidebar::-webkit-scrollbar {
  @apply w-2;
}

.sidebar::-webkit-scrollbar-track {
  @apply bg-transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  @apply bg-black/20 dark:bg-white/20;
  @apply hover:bg-black/30 dark:hover:bg-white/30;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .sidebar {
    @apply w-full max-w-xs;
  }
  
  .sidebar-toggle.open {
    @apply left-[calc(100vw-3rem)];
  }
}
</style>
