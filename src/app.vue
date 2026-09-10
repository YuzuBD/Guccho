<script lang="ts" setup>
const scrollY = useScrollYObserver()
const { l1Status, l2Status } = useZoomModal()
</script>

<template>
  <nuxt-loading-indicator />
  <div id="app-drawer" class="drawer flex flex-col min-h-[100dvh]">
    <app-nav />
    <input id="app-drawer-toggle" type="checkbox" class="drawer-toggle">
    <!-- Page content here -->
    <NuxtLayout
      id="layout"
      viewport
      :class="safariDetector() ? 'safari' : 'not-safari'"
      class="drawer-content zoom-modal-container overflow-x-clip"
      :data-l1-status="l1Status"
      :data-l2-status="l2Status"
      :style="
        l1Status !== 'closed' && {
          'transform-origin': `center calc(${scrollY} * 1px + 50dvh)`,
        }
      "
    >
      <NuxtPage />
    </NuxtLayout>
    <app-footer class="mt-auto" />
    <div class="z-40 drawer-side">
      <label
        for="app-drawer-toggle"
        aria-label="Close sidebar"
        class="drawer-overlay"
      />
      <ul class="min-h-full p-4 menu w-80 bg-white/80 dark:bg-black/80 backdrop-blur-xl">
        <app-nav-items>
          <template #start>
            <li>
              <app-nav-brand />
            </li>
          </template>
        </app-nav-items>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@use "~/assets/styles/modal.scss" as m;

$scale: scale(0.98);
$scale2: scale(0.96);

.zoom-modal-container {
  transition-property: transform, filter;
  transition-duration: m.$duration;
  transition-timing-function: m.$animate-function;

  &[data-l1-status="show"] {
    &[data-l2-status="closed"] {
      transform: $scale;
    }

    &[data-l2-status="show"] {
      transform: $scale2;
    }
  }
}

.zoom-modal-container[data-l2-status="show"] > dialog::backdrop {
  z-index: 1000 !important;
}

#app-drawer .drawer-toggle:checked ~ .drawer-side > .drawer-overlay {
  @apply bg-black/20 dark:bg-black/60;
  @apply transition-colors;
  transition-duration: 350ms;
}

#app-drawer .drawer-content > * {
  transition-property: transform, filter;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 350ms;
  transition-delay: 30ms;
}

#app-drawer .drawer-toggle:checked ~ .drawer-content > * {
  @apply translate-x-5;
  transition-duration: 250ms;
  transition-delay: 50ms;
  filter: saturate(0.7) brightness(0.95);
}

#layout.safari {
  -webkit-overflow-scrolling: touch;

  .notify-safari-something-will-change {
    will-change: transform, filter;
  }
}
</style>
