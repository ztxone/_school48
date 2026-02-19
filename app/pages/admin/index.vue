<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'

definePageMeta({
  middleware: 'admin-auth'
})

type ApplicationItem = {
  id: number
  studentFirstName: string
  studentLastName: string
  albumFormatTitle: string
  totalPriceRub: number
  paymentStatus: 'pending' | 'paid'
  createdAt: number
}

type ApplicationRow = {
  id: number
  student: string
  album: string
  price: string
  paymentStatus: 'pending' | 'paid'
  createdAt: number
  actions: number
}

const search = ref('')
const deletingId = ref<number | null>(null)
const actionError = ref('')
const sorting = ref<SortingState>([{ id: 'createdAt', desc: true }])
const confirmDeleteOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)
const pendingDeleteLabel = ref('')

const { data, refresh, pending } = await useFetch<{ items: ApplicationItem[] }>('/api/admin/applications', {
  query: computed(() => ({ q: search.value || undefined }))
})

const rows = computed<ApplicationRow[]>(() => {
  return (data.value?.items || []).map(item => ({
    id: item.id,
    student: `${item.studentLastName} ${item.studentFirstName}`,
    album: item.albumFormatTitle,
    price: `${item.totalPriceRub.toLocaleString('ru-RU')} ₽`,
    paymentStatus: item.paymentStatus,
    createdAt: item.createdAt,
    actions: item.id
  }))
})

const columns: TableColumn<ApplicationRow>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'student', header: 'Ученик' },
  { accessorKey: 'album', header: 'Формат' },
  { accessorKey: 'price', header: 'Стоимость', enableSorting: false },
  { accessorKey: 'paymentStatus', header: 'Оплата' },
  { accessorKey: 'createdAt', header: 'Дата' },
  { accessorKey: 'actions', header: 'Действия' }
]

function getSortIcon(column: { getIsSorted: () => false | 'asc' | 'desc' }) {
  const sort = column.getIsSorted()
  if (sort === 'asc') {
    return 'i-lucide-arrow-up'
  }
  if (sort === 'desc') {
    return 'i-lucide-arrow-down'
  }
  return 'i-lucide-arrow-up-down'
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await navigateTo('/admin/login')
}

async function removeApplication(id: number) {
  const selected = rows.value.find(item => item.id === id)
  if (!selected) {
    return
  }

  pendingDeleteId.value = id
  pendingDeleteLabel.value = selected.student
  confirmDeleteOpen.value = true
}

async function confirmRemoveApplication() {
  if (!pendingDeleteId.value) {
    return
  }

  const id = pendingDeleteId.value
  deletingId.value = id
  actionError.value = ''
  confirmDeleteOpen.value = false

  try {
    await $fetch(`/api/admin/applications/${id}`, {
      method: 'DELETE'
    })
    await refresh()
  } catch (error: unknown) {
    const maybeError = error as { data?: { statusMessage?: string } }
    actionError.value = maybeError.data?.statusMessage || 'Не удалось удалить заявку'
  } finally {
    deletingId.value = null
    pendingDeleteId.value = null
    pendingDeleteLabel.value = ''
  }
}
</script>
<template>
  <UContainer class="py-8 space-y-6 bg-white/95">
    <div class="flex items-center justify-between gap-4">
      <h1 class="text-2xl font-semibold"> Заявки учеников </h1>
      <UButton
        color="neutral"
        variant="ghost"
        @click="logout"> Выйти </UButton>
    </div>
    <div class="flex gap-3">
      <UInput
        v-model="search"
        placeholder="Поиск по фамилии/имени"
        class="max-w-sm" />
      <UButton
        color="neutral"
        variant="soft"
        :loading="pending"
        @click="refresh()"> Обновить </UButton>
    </div>
    <UAlert
      v-if="actionError"
      color="error"
      variant="subtle"
      :title="actionError" />
    <UTable
      :data="rows"
      :columns="columns"
      v-model:sorting="sorting"
      :loading="pending"
      sticky
      empty="Заявок пока нет">
      <template #id-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> ID </UButton>
      </template>
      <template #student-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Ученик </UButton>
      </template>
      <template #album-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Формат </UButton>
      </template>
      <template #price-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"> Стоимость </UButton>
      </template>
      <template #paymentStatus-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Оплата </UButton>
      </template>
      <template #createdAt-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Дата </UButton>
      </template>
      <template #actions-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Действия </UButton>
      </template>
      <template #paymentStatus-cell="{ row }">
        <UBadge
          :color="row.original.paymentStatus === 'paid' ? 'success' : 'warning'"
          variant="soft">
          {{ row.original.paymentStatus === 'paid' ? 'Оплачено' : 'Ожидает оплаты' }}
        </UBadge>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex items-center gap-2">
          <UButton
            :to="`/admin/applications/${row.original.id}`"
            size="xs"> Открыть </UButton>
          <UButton
            square
            color="error"
            variant="soft"
            size="xs"
            icon="i-lucide-trash"
            :loading="deletingId === row.original.id"
            :disabled="deletingId !== null"
            @click="removeApplication(row.original.id)" />
        </div>
      </template>
      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleString('ru-RU') }}
      </template>
    </UTable>

    <UModal
      v-model:open="confirmDeleteOpen"
      title="Подтверждение удаления"
      :description="`Удалить заявку ученика: ${pendingDeleteLabel}?`">
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="soft"
            @click="confirmDeleteOpen = false">
            Отмена
          </UButton>
          <UButton
            color="error"
            :loading="deletingId !== null"
            @click="confirmRemoveApplication">
            Удалить
          </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
