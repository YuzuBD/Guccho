<script setup>
const s = useRuntimeConfig()
</script>

<template>
  <nuxt-link-locale :to="{ name: 'index' }" class="text-xl font-light tracking-wide hover:opacity-60 transition-opacity">
    <icon v-if="s.public.brand" :name="s.public.brand.icon" class="w-5 h-5" />
    {{ $t('server.name') }}
  </nuxt-link-locale>
</template>
