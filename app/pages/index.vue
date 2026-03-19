<script setup lang="ts">
useSeoMeta({
  title: 'Опрос по фотоальбому',
  description: 'Форма выбора обложки и формата школьного фотоальбома'
})
</script>
<template>
  <UContainer class="py-10">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <NuxtLink to="/survey-one" class="size-48 p-4 bg-white shadow-sm rounded-lg flex flex-col items-center justify-between text-center">
        <span class="flex items-center gap-2 text-primary font-semibold">
          <UIcon name="i-lucide-book-open" class="text-2xl" />Опрос №1
        </span>
        <span class="text-lg h-full flex items-center justify-center">Выбор обложки</span>
      </NuxtLink>
      <NuxtLink to="/survey-two" class="size-48 p-4 bg-white shadow-sm rounded-lg flex flex-col items-center justify-between text-center">
        <span class="flex items-center gap-2 text-primary font-semibold">
          <UIcon name="i-lucide-box" class="text-2xl" />Опрос №2
        </span>
        <span class="text-lg h-full flex items-center justify-center">Выбор фото на обложку и виньетку</span>
      </NuxtLink>
    </div>
  </UContainer>
</template>
