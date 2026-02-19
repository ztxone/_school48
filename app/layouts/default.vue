<script setup lang="ts"></script>

<template>
  <div class="min-h-dvh flex flex-col">
    <UHeader>
      <template #left>
        <NuxtLink
          to="/"
          class="font-semibold"
        > Фотоальбом 4Б класса (Школа №48) </NuxtLink>
      </template>
      <template #right>
        <UButton
          to="/admin"
          icon="i-lucide-shield"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UHeader>
    <UMain class="flex-1 min-h-0">
      <slot />
    </UMain>
    <UFooter class="bg-white/70 backdrop-blur-sm">
      <template #default>
        <p class="text-sm">
          © {{ new Date().getFullYear() }} Разработка сайта: <NuxtLink
            to="https://ztx.one"
            target="_blank"
            class="text-primary hover:underline"
          >ztx.one</NuxtLink>
        </p>
      </template>
    </UFooter>
  </div>
</template>
