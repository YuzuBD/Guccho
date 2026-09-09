<script setup lang="ts">
import { useSession } from '~/store/session'

const session = useSession()
const { t } = useI18n()
const app = useNuxtApp()
const url = useRequestURL()

useSeoMeta({
  description: () => app.$i18n.t('landing.content'),
  ogTitle: () => app.$i18n.t('server.name'),
  ogDescription: () => app.$i18n.t('landing.content'),
  ogImage: '/mascot/riru.png',
  ogUrl: url.href,
  twitterTitle: () => app.$i18n.t('server.name'),
  twitterDescription: app.$i18n.t('landing.content'),
  twitterImage: '/mascot/riru.png',
  twitterCard: 'summary',
})

useHead({
  title: () => app.$i18n.t('server.name'),
})

// Mouse position for 3D effect
const mouseX = ref(0)
const mouseY = ref(0)

const handleMouseMove = (e: MouseEvent) => {
  mouseX.value = (e.clientX / window.innerWidth - 0.5) * 20
  mouseY.value = (e.clientY / window.innerHeight - 0.5) * 20
}

onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  window.removeEventListener('mousemove', handleMouseMove)
})
</script>

<i18n lang="yaml">
en-GB:
  enter: ENTER

zh-CN:
  enter: 进入

fr-FR:
  enter: ENTRER

de-DE:
  enter: EINGEBEN
</i18n>

<template>
  <div class="minimal-home">
    <div class="home-container">
      <!-- 3D Cube Animation -->
      <div class="cube-container">
        <div 
          class="cube" 
          :style="{
            transform: `rotateX(${mouseY}deg) rotateY(${mouseX}deg)`
          }"
        >
          <div class="cube-face front" />
          <div class="cube-face back" />
          <div class="cube-face right" />
          <div class="cube-face left" />
          <div class="cube-face top" />
          <div class="cube-face bottom" />
        </div>
      </div>

      <!-- Minimal Navigation -->
      <div class="home-nav">
        <template v-if="session.$state.loggedIn">
          <nuxt-link
            :to="{
              name: 'user-handle',
              params: { handle: session.$state.userId! },
            }"
            class="home-link"
          >
            {{ t('enter') }}
          </nuxt-link>
        </template>
        <template v-else>
          <nuxt-link :to="{ name: 'leaderboard-mode' }" class="home-link">
            {{ t('enter') }}
          </nuxt-link>
        </template>
      </div>

      <!-- Bottom hint -->
      <div class="home-hint">
        <p class="text-xs tracking-[0.3em] uppercase opacity-40">
          {{ $t('server.name') }}
        </p>
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
.minimal-home {
  @apply fixed inset-0 bg-white dark:bg-[#0a0a0a];
  @apply flex items-center justify-center;
  overflow: hidden;
}

.home-container {
  @apply relative w-full h-full flex flex-col items-center justify-center;
}

.cube-container {
  perspective: 1000px;
  @apply mb-20;
}

.cube {
  width: 200px;
  height: 200px;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.1s ease-out;
  animation: rotate 20s infinite linear;
}

@keyframes rotate {
  from {
    transform: rotateX(0deg) rotateY(0deg);
  }
  to {
    transform: rotateX(360deg) rotateY(360deg);
  }
}

.cube-face {
  position: absolute;
  width: 200px;
  height: 200px;
  border: 1px solid currentColor;
  @apply border-black/20 dark:border-white/20;
  backdrop-filter: blur(10px);
}

.front {
  transform: rotateY(0deg) translateZ(100px);
}

.back {
  transform: rotateY(180deg) translateZ(100px);
}

.right {
  transform: rotateY(90deg) translateZ(100px);
}

.left {
  transform: rotateY(-90deg) translateZ(100px);
}

.top {
  transform: rotateX(90deg) translateZ(100px);
}

.bottom {
  transform: rotateX(-90deg) translateZ(100px);
}

.home-nav {
  @apply absolute;
  top: 60%;
}

.home-link {
  @apply text-sm md:text-base font-light tracking-[0.3em] uppercase;
  @apply text-black dark:text-white;
  @apply hover:opacity-60 transition-opacity duration-300;
  @apply border-b border-current pb-1;
  text-decoration: none;
}

.home-hint {
  @apply absolute bottom-12;
}

/* Remove cube on mobile for better performance */
@media (max-width: 768px) {
  .cube {
    width: 150px;
    height: 150px;
  }
  
  .cube-face {
    width: 150px;
    height: 150px;
  }
  
  .front {
    transform: rotateY(0deg) translateZ(75px);
  }

  .back {
    transform: rotateY(180deg) translateZ(75px);
  }

  .right {
    transform: rotateY(90deg) translateZ(75px);
  }

  .left {
    transform: rotateY(-90deg) translateZ(75px);
  }

  .top {
    transform: rotateX(90deg) translateZ(75px);
  }

  .bottom {
    transform: rotateX(-90deg) translateZ(75px);
  }
}
</style>
