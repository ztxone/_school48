<script setup lang="ts">
definePageMeta({
  middleware: 'admin-auth'
})

const route = useRoute()
const applicationId = Number(route.params.id)

const { data, pending, refresh } = await useFetch(`/api/admin/applications/${applicationId}`)

const paymentState = reactive({
  paymentStatus: 'pending',
  note: '',
  imagePath: null as string | null
})

watchEffect(() => {
  if (!data.value) {
    return
  }

  paymentState.paymentStatus = data.value.paymentStatus || 'pending'
  paymentState.note = data.value.paymentNote || ''
  paymentState.imagePath = data.value.paymentImagePath || null
})

const saveLoading = ref(false)
const saveMessage = ref('')
const saveError = ref('')

type HttpError = {
  data?: {
    message?: string
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) {
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await $fetch<{ imagePath: string }>('/api/admin/uploads/payment', {
    method: 'POST',
    body: formData
  })

  paymentState.imagePath = response.imagePath
}

async function savePayment() {
  saveLoading.value = true
  saveMessage.value = ''
  saveError.value = ''

  try {
    await $fetch(`/api/admin/applications/${applicationId}/payment`, {
      method: 'PATCH',
      body: paymentState
    })
    saveMessage.value = 'Данные оплаты сохранены'
    await refresh()
  } catch (error: unknown) {
    const maybeError = error as HttpError
    saveError.value = maybeError.data?.message || 'Не удалось сохранить оплату'
  } finally {
    saveLoading.value = false
  }
}
</script>
<template>
  <UContainer class="py-8 space-y-6">
    <div class="flex items-center justify-between gap-4">
      <UButton
        to="/admin"
        variant="outline"
        color="neutral"> Назад к списку </UButton>
      <UButton
        color="neutral"
        variant="soft"
        :loading="pending"
        @click="refresh()"> Обновить </UButton>
    </div>
    <UCard v-if="data">
      <template #header>
        <h1 class="text-xl font-semibold">
          {{ data.studentLastName }} {{ data.studentFirstName }}
        </h1>
      </template>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="space-y-3">
          <p><span class="text-muted">Формат:</span> {{ data.albumFormatTitle }}</p>
          <p><span class="text-muted">Стоимость:</span> {{ data.totalPriceRub.toLocaleString('ru-RU') }} ₽</p>
          <p><span class="text-muted">Комментарий:</span> {{ data.comment || '—' }}</p>
          <p>
            <span class="text-muted">Выбор фото:</span>
            {{ data.coverPhoto && data.vignettePhoto ? `обложка: ${data.coverPhoto}, виньетка: ${data.vignettePhoto}` : '—' }}
          </p>
          <img :src="`/Обложка_${data.coverId}.jpeg`" :alt="`Обложка ${data.coverId}`" class="rounded-md max-h-64 object-cover">
        </div>
        <div class="space-y-4">
          <UFormField label="Статус оплаты">
            <USelect v-model="paymentState.paymentStatus" :items="[{ label: 'Ожидает оплаты', value: 'pending' }, { label: 'Оплачено', value: 'paid' }]" class="w-full" />
          </UFormField>
          <UFormField label="Комментарий администратора">
            <UTextarea v-model="paymentState.note" :rows="4" />
          </UFormField>
          <UFormField label="Фото оплаты">
            <input type="file" accept="image/jpeg,image/png,image/webp" @change="onFileChange">
          </UFormField>
          <p class="text-sm text-muted"> Дата оплаты: {{ data.paidAt ? new Date(data.paidAt).toLocaleString('ru-RU') : '—' }}
          </p>
          <img v-if="paymentState.imagePath" :src="paymentState.imagePath" alt="Чек оплаты" class="rounded-md max-h-52 object-contain bg-neutral-50 dark:bg-neutral-900">
          <UButton :loading="saveLoading" @click="savePayment"> Сохранить </UButton>
          <UAlert v-if="saveMessage" color="success" variant="subtle" :title="saveMessage" />
          <UAlert v-if="saveError" color="error" variant="subtle" :title="saveError" />
        </div>
      </div>
    </UCard>
  </UContainer>
</template>
