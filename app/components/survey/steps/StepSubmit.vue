<script setup lang="ts">
import { ALBUM_OPTIONS } from '../../../../shared/album-options'
import { COVER_OPTIONS } from '../../../../shared/covers'

const props = defineProps<{
  state: {
    studentFirstName: string
    studentLastName: string
    coverId: string
    albumFormatKey: string
    comment: string
  }
}>()

const selectedCover = computed(() => COVER_OPTIONS.find(item => item.id === props.state.coverId))
const selectedAlbum = computed(() => ALBUM_OPTIONS.find(item => item.key === props.state.albumFormatKey))
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-xl font-semibold text-muted">
      Проверьте данные перед отправкой
    </h3>
    <div class="grid md:grid-cols-2 gap-4">
      <UCard>
        <p class="text-sm text-muted">
          Ученик
        </p>
        <p class="font-medium">
          {{ state.studentLastName }} {{ state.studentFirstName }}
        </p>
      </UCard>
      <UCard>
        <p class="text-sm text-muted">
          Формат альбома
        </p>
        <p class="font-medium">
          {{ selectedAlbum?.title || 'Не выбрано' }}
        </p>
        <p class="text-sm text-muted">
          {{ selectedAlbum?.priceRub.toLocaleString('ru-RU') || 0 }} ₽
        </p>
      </UCard>
    </div>
    <UCard>
      <p class="text-sm text-muted mb-2">
        Выбранная обложка
      </p>
      <img
        v-if="selectedCover"
        :src="selectedCover.image"
        :alt="selectedCover.title"
        class="rounded-md h-44 object-cover"
      >
    </UCard>
    <UCard v-if="state.comment">
      <p class="text-sm text-muted mb-2">
        Комментарий
      </p>
      <p>{{ state.comment }}</p>
    </UCard>
  </div>
</template>
