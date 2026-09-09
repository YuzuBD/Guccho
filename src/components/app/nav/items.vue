<script setup lang="ts">
import { useSession } from '~/store/session'
import { showAdminPanel } from '~/common/utils/admin'

const session = useSession()
const { t, locale, locales, setLocale, localeProperties } = useI18n()

const langSw = ref<HTMLDetailsElement>()
const dans = useTemplateRef('dans')

function clearFocus() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}
</script>

<template>
  <slot name="start" />
  <li>
    <nuxt-link-locale :to="{ name: 'leaderboard-mode' }" @click="clearFocus" class="nav-link">
      {{ t('title.leaderboard') }}
    </nuxt-link-locale>
  </li>
  <li>
    <nuxt-link-locale :to="{ name: 'clans' }" @click="clearFocus" class="nav-link">
      {{ t('title.clans') }}
    </nuxt-link-locale>
  </li>
  <li tabindex="0">
    <details ref="dans" class="nav-dropdown">
      <summary class="nav-link cursor-pointer">
        {{ t('title.dan-courses') }}
      </summary>
      <ul class="dropdown-menu-minimal">
        <li>
          <nuxt-link-locale :to="{ name: 'dan-list' }" @click="clearFocus">
            {{ t('title.dan-courses') }}
          </nuxt-link-locale>
        </li>
        <li>
          <nuxt-link-locale :to="{ name: 'dan-player' }" @click="clearFocus">
            {{ t('title.dan-players') }}
          </nuxt-link-locale>
        </li>
        <li v-if="session.loggedIn">
          <nuxt-link-locale :to="{ name: 'dan-compose' }" @click="clearFocus">
            {{ t('title.compose-dan') }}
          </nuxt-link-locale>
        </li>
      </ul>
    </details>
  </li>
  <li v-if="session.user && showAdminPanel(session.user.roles)">
    <nuxt-link-locale :to="{ name: 'status' }" @click="clearFocus" class="nav-link">
      {{ t('title.status') }}
    </nuxt-link-locale>
  </li>
  <li tabindex="0">
    <details ref="langSw" class="nav-dropdown">
      <summary class="nav-link cursor-pointer">
        {{ localeProperties?.name }}
      </summary>
      <ul class="dropdown-menu-minimal">
        <li v-for="l in locales" :key="l.code">
          <a
            class="flex items-center gap-2"
            @click.prevent="() => {
              setLocale(l.code)
              langSw?.removeAttribute('open')
            }"
          >
            <span v-if="locale === l.code" class="w-2 h-2 rounded-full bg-black dark:bg-white" />
            <span v-else class="w-2 h-2" />
            {{ l.name }}
          </a>
        </li>
      </ul>
    </details>
  </li>
</template>

<style lang="postcss" scoped>
.nav-link {
  @apply text-sm font-light tracking-wide uppercase;
  @apply text-black dark:text-white;
  @apply hover:opacity-60 transition-opacity duration-200;
  text-decoration: none;
  letter-spacing: 0.1em;
}

.nav-dropdown summary {
  list-style: none;
}

.nav-dropdown summary::-webkit-details-marker {
  display: none;
}

.dropdown-menu-minimal {
  @apply absolute mt-2 min-w-[180px] p-2;
  @apply bg-white dark:bg-[#1a1a1a];
  @apply border border-black/5 dark:border-white/5;
  backdrop-filter: blur(20px);
  
  li {
    @apply my-1;
    
    a {
      @apply block px-4 py-2 text-sm font-light;
      @apply text-black dark:text-white;
      @apply hover:bg-black/5 dark:hover:bg-white/5;
      @apply transition-colors duration-200;
      text-decoration: none;
    }
  }
}
</style>
