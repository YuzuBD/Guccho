<script setup lang="ts">
import { useSession } from '~/store/session'

const scrollY = useScrollYObserver()
const session = useSession()
const route = useRoute()

const detached = shallowRef(false)
watch(scrollY, () => (detached.value = scrollY.value > 0))

const shownMenu = shallowReactive({
  user: false,
})

function clearFocus() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}
</script>

<template>
  <div
    class="w-full transition-all duration-300 sticky top-0 navbar-container z-40 h-20"
    :class="[detached && 'detached']"
  >
    <div class="navbar-minimal w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 flex items-center justify-between">
      <!-- Brand / Logo -->
      <div class="navbar-start">
        <app-nav-brand />
      </div>

      <!-- Right Side - User Menu Only -->
      <div class="navbar-end flex items-center gap-4">
        <!-- User Menu -->
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="cursor-pointer hover:opacity-60 transition-opacity">
            <img 
              v-if="session.loggedIn" 
              :src="session.$state.user?.avatarSrc" 
              class="w-10 h-10 rounded-full object-cover"
            >
            <div v-else class="user-icon-placeholder">
              <icon class="w-10 h-10" name="solar:user-circle-bold" />
            </div>
          </label>
          <ul
            tabindex="0" 
            class="menu-minimal mt-4 dropdown-content" 
            :class="{ 'dropdown-open': shownMenu.user }"
          >
            <template v-if="session.loggedIn">
              <li>
                <nuxt-link-locale
                  :to="{
                    name: 'user-handle',
                    params: { handle: `@${session.$state.user?.safeName}` },
                  }" 
                  @click="clearFocus"
                >
                  <icon name="mingcute:profile-fill" class="w-4 h-4" />
                  <span>Profile</span>
                </nuxt-link-locale>
              </li>
              <li>
                <nuxt-link-locale
                  :to="{ name: 'leaderboard-mode' }" 
                  @click="clearFocus"
                >
                  <icon name="material-symbols:leaderboard" class="w-4 h-4" />
                  <span>Leaderboard</span>
                </nuxt-link-locale>
              </li>
              <li>
                <nuxt-link-locale
                  :to="{ name: 'me-settings' }" 
                  @click="clearFocus"
                >
                  <icon name="solar:settings-bold" class="w-4 h-4" />
                  <span>Settings</span>
                </nuxt-link-locale>
              </li>
              <div class="menu-divider" />
              <li>
                <nuxt-link-locale 
                  :to="{ name: 'auth-logout', query: { redirect: route.fullPath } }" 
                  @click="clearFocus"
                >
                  <icon name="majesticons:logout-half-circle-line" class="w-4 h-4" />
                  <span>Logout</span>
                </nuxt-link-locale>
              </li>
            </template>
            <template v-else>
              <li>
                <nuxt-link-locale 
                  :to="{ name: 'auth-login', query: { redirect: route.fullPath } }" 
                  @click="clearFocus"
                >
                  <icon name="majesticons:login-half-circle-line" class="w-4 h-4" />
                  <span>Login</span>
                </nuxt-link-locale>
              </li>
              <li>
                <nuxt-link-locale 
                  :to="{ name: 'auth-register' }" 
                  @click="clearFocus"
                >
                  <icon name="mingcute:signature-fill" class="w-4 h-4" />
                  <span>Register</span>
                </nuxt-link-locale>
              </li>
            </template>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="postcss">
.navbar-container {
  @apply bg-transparent;
  backdrop-filter: blur(30px) saturate(1.2);
  border-bottom: 1px solid transparent;
}

.navbar-container.detached {
  @apply bg-white/5 dark:bg-black/20;
  backdrop-filter: blur(40px) saturate(1.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

@media (prefers-color-scheme: dark) {
  .navbar-container.detached {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
}

.navbar-minimal {
  @apply h-full;
}

.user-icon-placeholder {
  @apply flex items-center justify-center;
}

.menu-minimal {
  @apply min-w-[200px] p-2 bg-white dark:bg-[#1a1a1a];
  @apply border border-black/5 dark:border-white/5;
  backdrop-filter: blur(20px);
  
  li {
    @apply my-1;
    
    a {
      @apply flex items-center gap-3 px-4 py-3 text-sm font-light;
      @apply text-black dark:text-white;
      @apply hover:bg-black/5 dark:hover:bg-white/5;
      @apply transition-colors duration-200;
      border-radius: 0;
    }
  }
}

.menu-divider {
  @apply h-px bg-black/5 dark:bg-white/5 my-2;
}
</style>
