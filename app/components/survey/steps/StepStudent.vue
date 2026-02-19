<script setup lang="ts">
type Student = {
  id: number
  firstName: string
  lastName: string
}

const props = defineProps<{
  students: Student[]
  firstName: string
  lastName: string
}>()

const emit = defineEmits<{
  selectStudent: [Student]
  updateFirstName: [string]
  updateLastName: [string]
}>()

const search = ref('')

const filteredStudents = computed(() => {
  const query = search.value.trim().toLowerCase()
  return props.students
    .filter(item => `${item.lastName} ${item.firstName}`.toLowerCase().includes(query))
    .slice(0, 8)
})
</script>
<template>
  <div class="space-y-4">
    <p class="text-xl font-semibold text-muted "> Заполните настоящие ФИО ученика. </p>
    <!-- <div class="flex flex-wrap gap-2">
      <UButton
        v-for="student in filteredStudents"
        :key="student.id"
        size="xs"
        color="neutral"
        variant="soft"
        @click="emit('selectStudent', student)">
        {{ student.lastName }} {{ student.firstName }}
      </UButton>
    </div> -->
    <div class="grid md:grid-cols-2 gap-4">
      <UFormField
        label="Фамилия"
        required>
        <UInput
          :model-value="lastName"
          placeholder="Фамилия"
          @update:model-value="emit('updateLastName', String($event))" />
      </UFormField>
      <UFormField
        label="Имя"
        required>
        <UInput
          :model-value="firstName"
          placeholder="Имя"
          @update:model-value="emit('updateFirstName', String($event))" />
      </UFormField>
    </div>
  </div>
</template>
