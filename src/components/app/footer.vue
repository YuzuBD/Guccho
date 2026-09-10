<script lang="ts" setup>
import type { IconLink, UIConfig } from '~/def/config'

const fullYear = new Date().getFullYear()
const runtime = useRuntimeConfig()
const { iconLinks, footerLink, brand } = runtime.public as unknown as { iconLinks: readonly IconLink[] | undefined; footerLink: UIConfig['footerLink']; brand?: UIConfig['brand'] }
</script>

<template>
  <footer class="footer-minimal" />
</template>

<style lang="postcss" scoped>
.footer-minimal {
  @apply bg-transparent;
}
</style>
