<script lang="ts" setup>
import type { IconLink, UIConfig } from '~/def/config'

const fullYear = new Date().getFullYear()
const runtime = useRuntimeConfig()
const { iconLinks, footerLink, brand } = runtime.public as unknown as { iconLinks: readonly IconLink[] | undefined; footerLink: UIConfig['footerLink']; brand?: UIConfig['brand'] }
</script>

<template>
  <footer class="footer-minimal">
    <div class="w-full section-spacing">
      <div class="custom-container">
        <div class="line-separator mb-16" />
        
        <div class="md:flex md:justify-between">
          <div class="mb-12 md:mb-0">
            <nuxt-link-locale :to="{ name: 'index' }">
              <span class="flex items-center text-xl font-light tracking-wide">
                <icon v-if="brand" :name="brand.icon" class="h-6 w-6 mr-3" :class="brand.iconClass" />
                <span>{{ $t('server.name') }}</span>
              </span>
            </nuxt-link-locale>
          </div>
          
          <div v-if="footerLink" class="grid grid-cols-2 gap-12 sm:gap-16 sm:grid-cols-3">
            <template v-for="(col, nm) in footerLink" :key="nm">
              <div v-if="col?.length">
                <h2 class="mb-6 text-xs font-light uppercase tracking-widest text-gbase-600 dark:text-gbase-400">
                  {{ $t(`footer.${nm}`) }}
                </h2>
                <ul class="space-y-3">
                  <li v-for="(i, index) in col" :key="nm + index">
                    <a 
                      :href="i.link" 
                      class="text-sm font-light text-gbase-700 dark:text-gbase-300 hover:opacity-60 transition-opacity"
                    >
                      {{ 'localeKey' in i ? $t(i.localeKey) : i.name }}
                    </a>
                  </li>
                </ul>
              </div>
            </template>
          </div>
        </div>
        
        <div class="mt-16 pt-8 border-t border-black/5 dark:border-white/5">
          <div class="sm:flex sm:items-center sm:justify-between">
            <span class="text-xs font-light text-gbase-500 dark:text-gbase-400 tracking-wide">
              © {{ fullYear }} <a href="https://github.com/ppy-sb" class="hover:opacity-60 transition-opacity">ppy.sb</a>. All Rights Reserved.
            </span>
            <div v-if="iconLinks?.length" class="flex mt-6 space-x-6 sm:mt-0">
              <a 
                v-for="link in iconLinks" 
                :key="link.name" 
                :href="link.link" 
                class="text-gbase-500 hover:text-gbase-900 dark:hover:text-white transition-colors"
              >
                <icon :name="link.icon" class="w-5 h-5" />
                <span class="sr-only">{{ link.name }}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="postcss" scoped>
.footer-minimal {
  @apply bg-white dark:bg-[#0a0a0a];
}
</style>
