<script lang="ts" setup>
import '@fancyapps/ui/dist/fancybox/fancybox.css'

type PhotoItem = {
  fileName: string
  imagePath: string
}

type LookupResponse = {
  lastName: string
  items: PhotoItem[]
  selection: {
    lastName: string
    coverPhoto: string
    vignettePhoto: string
  } | null
}

type HttpError = {
  data?: {
    message?: string
  }
}

type FancyboxModule = typeof import('@fancyapps/ui/dist/fancybox/fancybox.js')
type FancyboxInstance = ReturnType<FancyboxModule['Fancybox']['show']>
type FancyboxSlide = {
  src: string
  type: 'image'
  thumbSrc: string
  fileName: string
  caption: string
}

const formState = reactive({
  lastName: '',
  coverPhoto: '',
  vignettePhoto: ''
})

const availablePhotos = ref<PhotoItem[]>([])
const loadedLastName = ref('')
const lookupLoading = ref(false)
const submitLoading = ref(false)
const errorMessage = ref('')
const infoMessage = ref('')
const successMessage = ref('')
let fancyboxModulePromise: Promise<FancyboxModule> | null = null
let activeCaptionEl: HTMLElement | null = null
let activeCaptionClickHandler: ((event: MouseEvent) => void) | null = null

const hasFreshLookup = computed(() => formState.lastName.trim() === loadedLastName.value.trim())
const hasSelections = computed(() => !!(formState.coverPhoto || formState.vignettePhoto))

const canSubmit = computed(() => {
  if (!loadedLastName.value || !hasFreshLookup.value || !formState.coverPhoto || !formState.vignettePhoto) {
    return false
  }

  const files = new Set(availablePhotos.value.map(item => item.fileName))
  return files.has(formState.coverPhoto) && files.has(formState.vignettePhoto)
})

function clearMessages() {
  errorMessage.value = ''
  infoMessage.value = ''
  successMessage.value = ''
}

function resetSelections() {
  formState.coverPhoto = ''
  formState.vignettePhoto = ''
}

function buildCaptionHtml(fileName: string) {
  const coverActive = formState.coverPhoto === fileName
  const vignetteActive = formState.vignettePhoto === fileName

  return `
    <div class="wizard2-fancybox-caption__inner">
      <div class="wizard2-fancybox-caption__meta">
        <div class="wizard2-fancybox-caption__title">${fileName}</div>
        <div class="wizard2-fancybox-caption__subtitle">Выберите, куда назначить это фото</div>
      </div>
      <div class="wizard2-fancybox-caption__actions">
        <button
          type="button"
          class="wizard2-fancybox-caption__button ${coverActive ? 'is-active is-cover' : 'is-cover'}"
          data-select-target="cover"
          data-select-photo="${fileName}"
        >
          ${coverActive ? 'Выбрано на обложку' : 'На обложку'}
        </button>
        <button
          type="button"
          class="wizard2-fancybox-caption__button ${vignetteActive ? 'is-active is-vignette' : 'is-vignette'}"
          data-select-target="vignette"
          data-select-photo="${fileName}"
        >
          ${vignetteActive ? 'Выбрано на виньетку' : 'На виньетку'}
        </button>
      </div>
    </div>
  `
}

async function getFancyboxModule() {
  if (!fancyboxModulePromise) {
    fancyboxModulePromise = import('@fancyapps/ui/dist/fancybox/fancybox.js')
  }

  return await fancyboxModulePromise
}

function refreshFancyboxCaption(instance?: FancyboxInstance) {
  if (!activeCaptionEl) {
    return
  }

  const slide = instance?.getSlide() as FancyboxSlide | undefined
  if (!slide) {
    return
  }

  activeCaptionEl.innerHTML = buildCaptionHtml(slide.fileName)
}

function selectPhoto(target: 'cover' | 'vignette', fileName: string) {
  clearMessages()

  if (target === 'cover') {
    formState.coverPhoto = fileName
    return
  }

  formState.vignettePhoto = fileName
}

async function openPhotoViewer(startIndex: number) {
  if (!import.meta.client) {
    return
  }

  const { Fancybox } = await getFancyboxModule()
  const slides: FancyboxSlide[] = availablePhotos.value.map(photo => ({
    src: photo.imagePath,
    type: 'image',
    thumbSrc: photo.imagePath,
    fileName: photo.fileName,
    caption: buildCaptionHtml(photo.fileName)
  }))

  activeCaptionEl = document.createElement('div')
  activeCaptionEl.className = 'wizard2-fancybox-caption'

  Fancybox.show(slides, {
    startIndex,
    mainClass: 'wizard2-fancybox',
    Carousel: {
      captionEl: () => activeCaptionEl,
      formatCaption: (_, slide) => String(slide.caption || '')
    },
    on: {
      initLayout(instance) {
        const container = instance.getContainer()
        if (container && activeCaptionEl && !activeCaptionEl.parentElement) {
          container.appendChild(activeCaptionEl)
        }
      },
      ready(instance) {
        if (!activeCaptionEl) {
          return
        }

        activeCaptionClickHandler = (event: MouseEvent) => {
          const target = (event.target as HTMLElement).closest<HTMLElement>('[data-select-target][data-select-photo]')
          const selectTarget = target?.dataset.selectTarget
          const fileName = target?.dataset.selectPhoto

          if (!target || !fileName || (selectTarget !== 'cover' && selectTarget !== 'vignette')) {
            return
          }

          event.preventDefault()
          selectPhoto(selectTarget, fileName)
          refreshFancyboxCaption(instance)
        }

        activeCaptionEl.addEventListener('click', activeCaptionClickHandler)
        refreshFancyboxCaption(instance)
      },
      'Carousel.change'(instance) {
        refreshFancyboxCaption(instance)
      },
      destroy() {
        if (activeCaptionEl && activeCaptionClickHandler) {
          activeCaptionEl.removeEventListener('click', activeCaptionClickHandler)
        }

        activeCaptionClickHandler = null
        activeCaptionEl = null
      }
    }
  })
}

async function lookupPhotos() {
  const lastName = formState.lastName.trim()

  clearMessages()
  availablePhotos.value = []
  loadedLastName.value = ''
  resetSelections()

  if (lastName.length < 2) {
    errorMessage.value = 'Введите фамилию'
    return
  }

  lookupLoading.value = true

  try {
    const response = await $fetch<LookupResponse>('/api/survey-two/photos', {
      query: { lastName }
    })

    formState.lastName = response.lastName
    loadedLastName.value = response.lastName
    availablePhotos.value = response.items

    if (!response.items.length) {
      infoMessage.value = 'Для этой фамилии фотографии пока не назначены'
      return
    }

    if (response.selection) {
      formState.coverPhoto = response.selection.coverPhoto
      formState.vignettePhoto = response.selection.vignettePhoto
      infoMessage.value = 'Ранее сохраненный выбор загружен'
    } else {
      infoMessage.value = 'Выберите фото для обложки и фото для виньетки'
    }
  } catch (error: unknown) {
    const maybeError = error as HttpError
    errorMessage.value = maybeError.data?.message || 'Не удалось загрузить фотографии'
  } finally {
    lookupLoading.value = false
  }
}

async function submitSelection() {
  if (!canSubmit.value) {
    errorMessage.value = 'Выберите фото для обложки и виньетки'
    return
  }

  submitLoading.value = true
  clearMessages()

  try {
    await $fetch('/api/survey-two', {
      method: 'POST',
      body: {
        lastName: loadedLastName.value || formState.lastName.trim(),
        coverPhoto: formState.coverPhoto,
        vignettePhoto: formState.vignettePhoto
      }
    })

    successMessage.value = 'Выбор сохранен'
  } catch (error: unknown) {
    const maybeError = error as HttpError
    errorMessage.value = maybeError.data?.message || 'Не удалось сохранить выбор'
  } finally {
    submitLoading.value = false
  }
}

onBeforeUnmount(async () => {
  if (!import.meta.client) {
    return
  }

  const { Fancybox } = await getFancyboxModule()
  Fancybox.close()
})
</script>
<template>
  <div class="w-full mx-auto space-y-6">
    <div class="flex flex-col xl:flex-row xl:items-end gap-3">
      <form class="flex flex-col md:flex-row gap-3 items-end flex-1" @submit.prevent="lookupPhotos">
        <UFormField label="Фамилия" required class="w-full md:max-w-sm">
          <UInput
            v-model="formState.lastName"
            placeholder="Введите фамилию"
            class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="lookupLoading"> Найти фотографии </UButton>
      </form>
    </div>
    <div class="sticky top-0 z-20">
      <div class="rounded-xl border border-default bg-white/95 backdrop-blur-md shadow-sm p-3 md:p-4 flex items-center justify-between">
        <div class="flex flex-col md:flex-row items-center gap-2 text-sm">
          <span class="text-muted">Выбрано:</span>
          <div class="wizard2-selection-pill">
            <span class="wizard2-selection-pill__label">Обложка</span>
            <span class="wizard2-selection-pill__value">{{ formState.coverPhoto || '—' }}</span>
          </div>
          <div class="wizard2-selection-pill wizard2-selection-pill--info">
            <span class="wizard2-selection-pill__label">Виньетка</span>
            <span class="wizard2-selection-pill__value">{{ formState.vignettePhoto || '—' }}</span>
          </div>
        </div>
        <UButton :disabled="!canSubmit" :loading="submitLoading" @click="submitSelection"> Сохранить выбор </UButton>
      </div>
    </div>
    <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />
    <UAlert v-else-if="successMessage" color="success" variant="subtle" :title="successMessage" />
    <UAlert v-else-if="infoMessage" color="primary" variant="subtle" :title="infoMessage" />
    <div v-if="availablePhotos.length" class="space-y-6">
      <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        <UCard
          v-for="photo in availablePhotos"
          :key="photo.fileName"
          :ui="{ body: 'p-3 sm:p-3' }">
          <div class="space-y-3">
            <button
              type="button"
              class="block w-full"
              @click="openPhotoViewer(availablePhotos.findIndex(item => item.fileName === photo.fileName))">
              <img
                :src="photo.imagePath"
                :alt="photo.fileName"
                class="h-72 w-full rounded-md object-cover bg-neutral-100 cursor-zoom-in">
            </button>
            <div class="space-y-2">
              <p class="text-sm font-medium break-all">
                {{ photo.fileName }}
              </p>
              <div class="flex flex-wrap gap-2">
                <UButton
                  :variant="formState.coverPhoto === photo.fileName ? 'solid' : 'soft'"
                  @click="selectPhoto('cover', photo.fileName)"> На обложку </UButton>
                <UButton
                  color="info"
                  :variant="formState.vignettePhoto === photo.fileName ? 'solid' : 'soft'"
                  @click="selectPhoto('vignette', photo.fileName)"> На виньетку </UButton>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
<style>
.wizard2-selection-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.06);
}

.wizard2-selection-pill--info {
  background: rgba(56, 189, 248, 0.12);
}

.wizard2-selection-pill__label {
  color: rgb(107 114 128);
}

.wizard2-selection-pill__value {
  font-weight: 600;
}

.wizard2-fancybox-caption {
  padding: 16px 20px 20px;
  color: white;
  background: linear-gradient(180deg, rgba(10, 15, 28, 0.1) 0%, rgba(10, 15, 28, 0.88) 30%);
}

.wizard2-fancybox-caption__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.wizard2-fancybox-caption__title {
  font-size: 16px;
  font-weight: 600;
}

.wizard2-fancybox-caption__subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.74);
}

.wizard2-fancybox-caption__actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.wizard2-fancybox-caption__button {
  border: 0;
  border-radius: 999px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
}

.wizard2-fancybox-caption__button:hover {
  transform: translateY(-1px);
}

.wizard2-fancybox-caption__button.is-cover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.wizard2-fancybox-caption__button.is-vignette {
  background: rgba(56, 189, 248, 0.2);
  color: #d8f3ff;
}

.wizard2-fancybox-caption__button.is-active.is-cover {
  background: #ffffff;
  color: #111827;
}

.wizard2-fancybox-caption__button.is-active.is-vignette {
  background: #38bdf8;
  color: #082f49;
}
</style>