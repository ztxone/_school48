<script setup lang="ts">
import { COVER_OPTIONS } from '~~/shared/covers'

defineProps<{
  coverId: string
}>()

const emit = defineEmits<{
  updateCover: [string]
}>()
</script>

<template>
  <div class="space-y-4">
    <p class="text-xl font-semibold text-muted">
      Выберите обложку из 12 доступных вариантов.
    </p>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <button
        v-for="cover in COVER_OPTIONS"
        :key="cover.id"
        type="button"
        class="rounded-lg border p-2 text-left transition"
        :class="coverId === cover.id ? 'border-primary ring-1 ring-primary' : 'border-default hover:border-primary/50'"
        @click="emit('updateCover', cover.id)"
      >
        <img
          :src="cover.image"
          :alt="cover.title"
          class="rounded-md object-cover h-28 w-full"
        >
        <p class="mt-2 text-sm font-medium">
          {{ cover.title }}
        </p>
      </button>
    </div>
  </div>
</template>
