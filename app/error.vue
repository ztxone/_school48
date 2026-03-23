<script setup lang="ts">
import type { NuxtError } from '#app'
const props = defineProps<{
  error: NuxtError
}>()

definePageMeta({
  layout: 'default'
})

const handleClearError = () => clearError({ redirect: '/' })
</script>
<template>
  <UContainer class="h-screen flex items-center justify-center">
    <div class="p-10 text-center bg-white rounded-lg shadow-sm">
      <div v-if="error.status === 404" class="text-center">
        <p class="text-[200px] font-semibold uppercase tracking-wide bg-linear-to-b from-transparent to-primary bg-clip-text text-transparent">
          {{ error.status }}
        </p>
        <h1 class="mb-2 text-4xl font-extrabold tracking-tight">Такой страницы не существует на нашем сайте</h1>
        <p class="text-muted mt-4">{{ error.message }}</p>
        <div class="mt-6">
          <UButton color="primary" @click="handleClearError"> Вернуться на главную </UButton>
        </div>
      </div>
      <div v-else class="text-center">
        <p class="text-[200px] font-semibold uppercase tracking-wide bg-linear-to-b from-transparent to-primary bg-clip-text text-transparent">
          {{ error.status }}
        </p>
        <h1 class="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl">Произошла ошибка на нашем сайте. Мы уже получили уведомление и работаем над её исправлением.</h1>
        <p class="text-text-muted mt-4">{{ error.message }}</p>
        <div class="mt-6">
          <UButton color="primary" @click="handleClearError"> Вернуться на главную </UButton>
        </div>
      </div>
    </div>
  </UContainer>
</template>