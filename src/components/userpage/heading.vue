<script setup async lang="ts">
import { useElementHover } from '@vueuse/core'
import { MutualRelationship, Relationship } from '~/def'
import { UserRole, UserStatus } from '~/def/user'
import { useSession } from '~/store/session'
import userpageStore from '~/store/userpage'

const page = userpageStore()
const route = useRoute<'user-handle'>()
const { t, locale } = useI18n()
const app$ = useNuxtApp()
const session = useSession()
const changeFriendStateButton = shallowRef(null)

const { data, refresh } = await useAsyncData(async () => {
  if (!page.user) {
    return {}
  }
  const relationWithMe
    = session.loggedIn
      ? app$.$client.me.relation.query({
        id: page.user.id,
      })
      : undefined
  const friendCount = app$.$client.user.countRelations.query({
    id: page.user.id,
    type: Relationship.Friend,
  })
  return {
    relationWithMe: await relationWithMe,
    friendCount: await friendCount,
  }
})

const { data: live, refresh: reloadLiveData } = useAsyncData(async () =>
  // eslint-disable-next-line n/prefer-global/process
  process.server
    ? null
    : page.user?.id
      ? await app$.$client.user.status.query({ id: page.user.id })
      : null,
)

const isMutualFriend = computed(
  () => data.value?.relationWithMe?.mutual?.includes(MutualRelationship.MutualFriend) || false,
)
const isFriend = computed(() =>
  data.value?.relationWithMe?.self.includes(Relationship.Friend),
)

let isFriendButtonHovered = shallowRef(false)
onBeforeMount(() => {
  isFriendButtonHovered = useElementHover(changeFriendStateButton)
})

const friendButtonContent = computed(
  () => isFriend.value ? (isFriendButtonHovered.value ? 'Unfriend' : data.value?.friendCount || 'Friend') : 'Add Friend'
)

const pendingRelation = ref(false)

onMounted(() => {
  onBeforeUnmount(() => clearInterval(setInterval(reloadLiveData, 5000)))
})

async function toggleFriend() {
  pendingRelation.value = true
  if (!session.loggedIn) {
    return navigateTo({
      name: 'auth-login',
      query: {
        redirect: route.fullPath,
      },
    })
  }
  if (!page.user) {
    return
  }
  const input = { type: Relationship.Friend, id: page.user.id } as const
  if (isFriend.value) {
    await app$.$client.me.removeOneRelation.mutate(input)
  }
  else {
    await app$.$client.me.addOneRelation.mutate(input)
  }

  await refresh()
  pendingRelation.value = false
}
</script>

<template>
  <section
    v-if="page.user"
    class="user-profile-minimal"
  >
    <div class="custom-container">
      <!-- Mode Switcher Sidebar -->
      <app-mode-switcher :model-value="page.switcher" @update:model-value="page.setSwitcher" />
      
      <!-- Hero Section with Avatar -->
      <div class="profile-hero">
        <div class="avatar-section">
          <div
            :style="`background-image: url(${page.user.avatarSrc})`"
            class="avatar-large"
          >
            <!-- Supporter Badge -->
            <div
              v-if="page.user.roles.includes(UserRole.Supporter)"
              class="supporter-crown"
              :title="'Supporter'"
            >
              <icon name="twemoji:crown" class="w-6 h-6" />
            </div>
            
            <!-- Clan Badge -->
            <div
              v-if="page.user.clan?.badge"
              class="clan-tag"
              :title="page.user.clan.name"
            >
              {{ page.user.clan.badge }}
            </div>
          </div>
        </div>

        <div class="profile-info">
          <!-- Username -->
          <h1 class="profile-name" :class="useUserRoleColor(page.user)">
            {{ page.user.name }}
          </h1>

          <!-- Handle & Status -->
          <div class="profile-meta">
            <nuxt-link-locale 
              :to="{ name: 'user-handle', params: { handle: `@${page.user.safeName}` } }" 
              class="profile-handle"
            >
              @{{ page.user.safeName }}
            </nuxt-link-locale>
            
            <template v-if="live">
              <span class="meta-separator">·</span>
              <span v-if="live.status === UserStatus.Offline" class="profile-status">
                {{ t('status.offline', { lastSeen: live.lastSeen.toLocaleDateString(locale, { dateStyle: 'medium' }) }) }}
              </span>
              <span v-else class="profile-status online">
                <span class="status-indicator" />
                {{ live.status === UserStatus.Idle ? t('status.idle') : live.status === UserStatus.Afk ? t('status.afk') : 'Online' }}
              </span>
            </template>
          </div>

          <!-- Badges -->
          <div v-if="page.user.roles.includes(UserRole.Verified) || isStaff(page.user)" class="profile-badges">
            <span v-if="page.user.roles.includes(UserRole.Verified)" class="badge-item">
              <icon name="ic:round-verified" class="w-4 h-4" />
              Verified
            </span>
            <span v-if="isStaff(page.user)" class="badge-item">
              <icon name="healthicons:social-work" class="w-4 h-4" />
              Staff
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="profile-actions">
            <button
              v-if="session.$state.userId !== page.user.id"
              ref="changeFriendStateButton" 
              class="btn-minimal-filled" 
              :class="{ '!bg-red-500 dark:!bg-red-500': isFriendButtonHovered && isFriend }"
              @click="toggleFriend"
            >
              <icon
                :name="isFriendButtonHovered && isFriend
                  ? 'solar:heart-broken-bold'
                  : 'solar:heart-bold'
                " 
                class="w-4 h-4"
              />
              <span v-if="!pendingRelation">{{ friendButtonContent }}</span>
              <span v-else class="animate-pulse">...</span>
            </button>
            <nuxt-link
              v-else
              class="btn-minimal-filled" 
              :to="{ name: 'me-settings' }"
            >
              <icon name="solar:settings-bold" class="w-4 h-4" />
              Settings
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<i18n lang="yaml">
en-GB:
  status.offline: Last seen {lastSeen}
  status.idle: Idle
  status.afk: Away

zh-CN:
  status.offline: 最后在线 {lastSeen}
  status.idle: 挂机
  status.afk: 离开

fr-FR:
  status.offline: Vu {lastSeen}
  status.idle: Inactif
  status.afk: Absent

de-DE:
  status.offline: Zuletzt {lastSeen}
  status.idle: Untätig
  status.afk: Abwesend
</i18n>

<style scoped lang="postcss">
.user-profile-minimal {
  @apply py-16 md:py-20;
}

.profile-hero {
  @apply flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12;
  @apply pb-12 md:pb-16 border-b border-black/5 dark:border-white/5;
}

.avatar-section {
  @apply flex-shrink-0;
}

.avatar-large {
  @apply relative w-48 h-48 md:w-56 md:h-56;
  @apply bg-cover bg-center;
  @apply border border-black/10 dark:border-white/10;
  border-radius: 2px;
}

.supporter-crown {
  @apply absolute -top-3 -right-3;
  @apply w-10 h-10 flex items-center justify-center;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(25deg);
  }
  50% {
    transform: translateY(-8px) rotate(25deg);
  }
}

.clan-tag {
  @apply absolute bottom-3 right-3;
  @apply px-2 py-1 text-xs font-medium;
  @apply bg-black/80 text-white dark:bg-white/80 dark:text-black;
  @apply backdrop-blur-sm;
}

.profile-info {
  @apply flex-1 flex flex-col items-center md:items-start text-center md:text-left;
  @apply space-y-4;
}

.profile-name {
  @apply text-5xl md:text-6xl lg:text-7xl font-light tracking-tight;
  @apply text-black dark:text-white;
  line-height: 1.1;
}

.profile-meta {
  @apply flex flex-wrap items-center justify-center md:justify-start gap-2 text-sm font-light;
  @apply text-gbase-600 dark:text-gbase-400;
}

.profile-handle {
  @apply hover:opacity-60 transition-opacity;
  text-decoration: none;
}

.meta-separator {
  @apply opacity-50;
}

.profile-status {
  @apply flex items-center gap-2;
}

.profile-status.online {
  @apply text-green-600 dark:text-green-400;
}

.status-indicator {
  @apply w-2 h-2 rounded-full bg-green-500;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.profile-badges {
  @apply flex flex-wrap items-center justify-center md:justify-start gap-3;
  @apply text-xs font-light uppercase tracking-wider;
  @apply text-gbase-500 dark:text-gbase-500;
}

.badge-item {
  @apply flex items-center gap-2;
  @apply px-3 py-1.5;
  @apply border border-black/10 dark:border-white/10;
}

.profile-actions {
  @apply flex flex-wrap gap-3 mt-2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .profile-name {
    @apply text-4xl;
  }
  
  .avatar-large {
    @apply w-40 h-40;
  }
}
</style>
