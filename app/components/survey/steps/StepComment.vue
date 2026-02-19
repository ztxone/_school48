<script setup lang="ts">
defineProps<{
  comment: string
}>()

const emit = defineEmits<{
  updateComment: [string]
}>()
</script>

<template>
  <div class="space-y-4">
    <p class="text-xl font-semibold text-muted">
      Укажите дополнительные пожелания к заказу (необязательно).
    </p>
    <UFormField label="Комментарий">
      <UTextarea
        class="w-full"
        :model-value="comment"
        :rows="8"
        placeholder="Например: +2 дополнительных разворота или хочу фотосессию на улице, а не в помещении."
        @update:model-value="emit('updateComment', String($event))"
      />
    </UFormField>
  </div>
</template>
