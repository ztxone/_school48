<script setup lang="ts">
import type { NavigationMenuItem } from '#ui/types'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [{
  label: 'Опрос №1',
  to: '/survey-one',
  icon: 'i-lucide-book-open',
  active: route.path.startsWith('/survey-one')
}, {
  label: 'Опрос №2',
  to: '/survey-two',
  icon: 'i-lucide-box',
  active: route.path.startsWith('/survey-two')
}
])

</script>
<template>
  <div class="min-h-dvh flex flex-col">
    <UHeader :ui="{ root: 'static' }">
      <template #left>
        <NuxtLink
          to="/"
          class="text-sm md:text-base lg:text-lg font-semibold"> Фотоальбом 4Б класса (Школа №48) </NuxtLink>
      </template>
      <UNavigationMenu :items="items" />
      <template #right>
        <UButton
          to="/admin"
          icon="i-lucide-shield"
          color="neutral"
          variant="ghost" />
      </template>
      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" collapsed
          :ui="{
            link: 'flex-col gap-1',
            linkLabel: 'block text-[10px]/3 text-center'
          }" />
      </template>
    </UHeader>
    <UMain class="flex-1 min-h-0">
      <slot />
    </UMain>
    <UFooter class="bg-white/70 backdrop-blur-sm">
      <template #default>
        <p class="text-sm"> © 2026 Разработка сайта: <NuxtLink
            to="https://ztx.one"
            target="_blank"
            class="text-primary hover:underline">ztx.one</NuxtLink>
        </p>
      </template>
    </UFooter>
  </div>
</template>
