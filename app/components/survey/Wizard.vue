<script setup lang="ts">
import type { CreateApplicationInput } from '../../../shared/schemas'
import { ALBUM_OPTIONS } from '../../../shared/album-options'
import { COVER_OPTIONS } from '../../../shared/covers'

type Student = {
  id: number
  firstName: string
  lastName: string
}

type HttpError = {
  data?: {
    statusMessage?: string
  }
}

const steps = [
  'Ученик',
  'Обложка',
  'Формат',
  'Комментарий',
  'Подтверждение'
]

const SURVEY_STORAGE_KEY = 'school48-survey-wizard'

const formState = useState<CreateApplicationInput>('survey-form-state', () => ({
  studentFirstName: '',
  studentLastName: '',
  studentId: null,
  coverId: '',
  albumFormatKey: '',
  comment: ''
}))

const currentStep = useState<number>('survey-current-step', () => 0)
const loading = ref(false)
const submitError = ref('')
const skipPersistence = ref(false)
const statusModalOpen = ref(false)
const submitStatus = ref<'success' | 'error'>('success')
const statusTitle = ref('')
const statusDescription = ref('')

const { data: studentsResponse } = await useFetch<{ items: Student[] }>('/api/students')
const students = computed(() => studentsResponse.value?.items ?? [])

const selectedCover = computed(() => COVER_OPTIONS.find(cover => cover.id === formState.value.coverId))
const selectedAlbum = computed(() => ALBUM_OPTIONS.find(option => option.key === formState.value.albumFormatKey))

onMounted(() => {
  const raw = localStorage.getItem(SURVEY_STORAGE_KEY)
  if (!raw) {
    return
  }

  try {
    const parsed = JSON.parse(raw) as {
      step?: number
      form?: Partial<CreateApplicationInput>
    }

    if (typeof parsed.step === 'number' && parsed.step >= 0 && parsed.step < steps.length) {
      currentStep.value = parsed.step
    }

    if (parsed.form) {
      formState.value = {
        ...formState.value,
        ...parsed.form
      }
    }
  } catch {
    localStorage.removeItem(SURVEY_STORAGE_KEY)
  }
})

watch([formState, currentStep], () => {
  if (!import.meta.client) {
    return
  }

  if (skipPersistence.value) {
    return
  }

  localStorage.setItem(SURVEY_STORAGE_KEY, JSON.stringify({
    step: currentStep.value,
    form: formState.value
  }))
}, { deep: true })

watch(statusModalOpen, async (open, prevOpen) => {
  if (open || !prevOpen || submitStatus.value !== 'success') {
    return
  }

  resetSurveyState()
  await navigateTo('/')
})

function resetSurveyState() {
  const emptyState: CreateApplicationInput = {
    studentFirstName: '',
    studentLastName: '',
    studentId: null,
    coverId: '',
    albumFormatKey: '',
    comment: ''
  }

  skipPersistence.value = true
  formState.value = emptyState
  currentStep.value = 0

  if (import.meta.client) {
    localStorage.removeItem(SURVEY_STORAGE_KEY)
  }

  queueMicrotask(() => {
    skipPersistence.value = false
  })
}

function selectStudent(student: Student) {
  formState.value.studentId = student.id
  formState.value.studentFirstName = student.firstName
  formState.value.studentLastName = student.lastName
}

function validateCurrentStep() {
  if (currentStep.value === 0) {
    return formState.value.studentFirstName.trim().length >= 2 && formState.value.studentLastName.trim().length >= 2
  }

  if (currentStep.value === 1) {
    return !!selectedCover.value
  }

  if (currentStep.value === 2) {
    return !!selectedAlbum.value
  }

  return true
}

function goNext() {
  if (!validateCurrentStep()) {
    submitError.value = 'Заполните обязательные поля текущего шага'
    return
  }

  submitError.value = ''
  if (currentStep.value < steps.length - 1) {
    currentStep.value += 1
  }
}

function goPrev() {
  submitError.value = ''
  if (currentStep.value > 0) {
    currentStep.value -= 1
  }
}

async function submit() {
  if (!validateCurrentStep()) {
    submitError.value = 'Проверьте данные перед отправкой'
    return
  }

  loading.value = true
  submitError.value = ''
  statusModalOpen.value = false

  try {
    const response = await $fetch<{ id: number, deduplicated?: boolean }>('/api/applications', {
      method: 'POST',
      body: formState.value
    })

    submitStatus.value = 'success'
    statusTitle.value = response.deduplicated ? 'Заявка уже существует' : 'Заявка отправлена'
    statusDescription.value = response.deduplicated
      ? 'Такая заявка уже была отправлена ранее.'
      : 'Спасибо! Ваша заявка успешно отправлена.'
    statusModalOpen.value = true
  } catch (error: unknown) {
    const maybeError = error as HttpError
    submitStatus.value = 'error'
    statusTitle.value = 'Ошибка отправки'
    statusDescription.value = maybeError.data?.statusMessage || 'Не удалось отправить заявку'
    statusModalOpen.value = true
  } finally {
    loading.value = false
  }
}
</script>
<template>
  <UCard class="max-w-4xl mx-auto">
    <template #header>
      <div class="space-y-2">
        <h2 class="text-2xl font-semibold"> Опрос по школьному фотоальбому </h2>
        <UProgress :model-value="((currentStep + 1) / steps.length) * 100" />
        <p class="text-sm text-muted"> Шаг {{ currentStep + 1 }} из {{ steps.length }}: {{ steps[currentStep] }}
        </p>
      </div>
    </template>
    <div class="space-y-6">
      <SurveyStepsStepStudent v-if="currentStep === 0" :students="students" :first-name="formState.studentFirstName" :last-name="formState.studentLastName" @select-student="selectStudent" @update-first-name="formState.studentFirstName = $event" @update-last-name="formState.studentLastName = $event" />
      <SurveyStepsStepCover v-if="currentStep === 1" :cover-id="formState.coverId" @update-cover="formState.coverId = $event" />
      <SurveyStepsStepFormat v-if="currentStep === 2" :album-format-key="formState.albumFormatKey" @update-format="formState.albumFormatKey = $event" />
      <SurveyStepsStepComment v-if="currentStep === 3" :comment="formState.comment || ''" @update-comment="formState.comment = $event" />
      <SurveyStepsStepSubmit v-if="currentStep === 4" :state="formState" />
      <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" />
    </div>
    <template #footer>
      <div class="flex items-center justify-between gap-4">
        <UButton
          variant="ghost"
          :disabled="currentStep === 0 || loading"
          @click="goPrev"> Назад </UButton>
        <UButton
          v-if="currentStep < steps.length - 1"
          :disabled="loading"
          @click="goNext"> Далее </UButton>
        <UButton
          v-else
          :loading="loading"
          @click="submit"> Отправить заявку </UButton>
      </div>
    </template>
  </UCard>

  <UModal
    v-model:open="statusModalOpen"
    :title="statusTitle"
    :description="statusDescription"
    :close="false"
    :dismissible="false">
    <template #footer>
      <div class="flex justify-end">
        <UButton
          :color="submitStatus === 'success' ? 'primary' : 'error'"
          @click="statusModalOpen = false">
          {{ submitStatus === 'success' ? 'Закрыть' : 'Понятно' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
