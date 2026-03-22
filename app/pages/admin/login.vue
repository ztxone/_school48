<script setup lang="ts">
definePageMeta({
  layout: false
})

const state = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const errorMessage = ref('')

type HttpError = {
  data?: {
    message?: string
  }
}

async function submit() {
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: state
    })

    await navigateTo('/admin')
  } catch (error: unknown) {
    const maybeError = error as HttpError
    errorMessage.value = maybeError.data?.message || 'Не удалось войти'
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <UContainer class="py-16 max-w-md">
    <UCard>
      <template #header>
        <h1 class="text-xl font-semibold"> Вход администратора </h1>
      </template>
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Email" name="email">
          <UInput v-model="state.email" type="email" required class="w-full" />
        </UFormField>
        <UFormField label="Пароль" name="password">
          <UInput v-model="state.password" type="password" required class="w-full" />
        </UFormField>
        <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />
        <UButton type="submit" block :loading="loading"> Войти </UButton>
      </form>
    </UCard>
  </UContainer>
</template>
