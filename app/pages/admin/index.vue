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
  coverId: string
  coverPhoto: string | null
  vignettePhoto: string | null
  albumFormatTitle: string
  totalPriceRub: number
  paymentStatus: 'pending' | 'paid'
  paidAt: number | null
  createdAt: number
}

type ApplicationRow = {
  id: number
  student: string
  coverId: string
  coverSort: number
  photoSelection: string
  album: string
  price: string
  paymentStatus: 'pending' | 'paid'
  paidAt: number | null
  createdAt: number
  actions: number
}

const search = ref('')
const deletingId = ref<number | null>(null)
const actionError = ref('')
const sorting = ref<SortingState>([{ id: 'student', desc: false }])
const confirmDeleteOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)
const pendingDeleteLabel = ref('')
const visibleOptionalColumns = reactive({
  id: false,
  createdAt: false
})

const { data, refresh, pending } = await useFetch<{ items: ApplicationItem[] }>('/api/admin/applications', {
  query: computed(() => ({ q: search.value || undefined }))
})

const rows = computed<ApplicationRow[]>(() => {
  return (data.value?.items || []).map(item => ({
    id: item.id,
    student: `${item.studentLastName} ${item.studentFirstName}`,
    coverId: item.coverId,
    coverSort: Number.parseInt(item.coverId, 10) || 0,
    photoSelection: item.coverPhoto && item.vignettePhoto
      ? `обложка: ${item.coverPhoto}, виньетка: ${item.vignettePhoto}`
      : '—',
    album: item.albumFormatTitle,
    price: `${item.totalPriceRub.toLocaleString('ru-RU')} ₽`,
    paymentStatus: item.paymentStatus,
    paidAt: item.paidAt,
    createdAt: item.createdAt,
    actions: item.id
  }))
})

const columns = computed<TableColumn<ApplicationRow>[]>(() => {
  const baseColumns: TableColumn<ApplicationRow>[] = [
    { accessorKey: 'coverSort', header: 'Обложка' },
    { accessorKey: 'student', header: 'Ученик' },
    { accessorKey: 'photoSelection', header: 'Фото' },
    { accessorKey: 'album', header: 'Формат' },
    { accessorKey: 'price', header: 'Стоимость', enableSorting: false },
    { accessorKey: 'paymentStatus', header: 'Оплата' },
    { accessorKey: 'paidAt', header: 'Дата оплаты' },
    { accessorKey: 'actions', header: 'Действия' }
  ]

  if (visibleOptionalColumns.id) {
    baseColumns.unshift({ accessorKey: 'id', header: 'ID' })
  }

  if (visibleOptionalColumns.createdAt) {
    baseColumns.splice(baseColumns.length - 1, 0, { accessorKey: 'createdAt', header: 'Дата заявки' })
  }

  return baseColumns
})

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
  <UContainer class="min-w-full py-8 space-y-6 bg-white/95">
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
    <div class="flex flex-wrap gap-2">
      <UButton
        color="neutral"
        size="sm"
        :variant="visibleOptionalColumns.id ? 'solid' : 'soft'"
        @click="visibleOptionalColumns.id = !visibleOptionalColumns.id"
      >
        {{ visibleOptionalColumns.id ? 'Скрыть ID' : 'Показать ID' }}
      </UButton>
      <UButton
        color="neutral"
        size="sm"
        :variant="visibleOptionalColumns.createdAt ? 'solid' : 'soft'"
        @click="visibleOptionalColumns.createdAt = !visibleOptionalColumns.createdAt"
      >
        {{ visibleOptionalColumns.createdAt ? 'Скрыть дату заявки' : 'Показать дату заявки' }}
      </UButton>
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
      <template #photoSelection-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Фото </UButton>
      </template>
      <template #coverSort-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Обложка </UButton>
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
      <template #paidAt-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Дата оплаты </UButton>
      </template>
      <template #createdAt-header="{ column }">
        <UButton
          variant="ghost"
          color="neutral"
          size="xs"
          :icon="getSortIcon(column)"
          @click="column.toggleSorting(column.getIsSorted() === 'asc')"> Дата заявки </UButton>
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
      <template #id-cell="{ row }">
        {{ row.original.id }}
      </template>
      <template #paidAt-cell="{ row }">
        <span v-if="row.original.paidAt">
          {{ new Date(row.original.paidAt).toLocaleString('ru-RU') }}
        </span>
        <span v-else class="text-muted"> — </span>
      </template>
      <template #createdAt-cell="{ row }">
        {{ new Date(row.original.createdAt).toLocaleString('ru-RU') }}
      </template>
      <template #coverSort-cell="{ row }">
        <div class="flex items-center gap-2">
          <img
            :src="`/Обложка_${row.original.coverId}.jpeg`"
            :alt="`Обложка ${row.original.coverId}`"
            class="h-10 w-8 rounded object-cover border border-default">
          <span>№{{ row.original.coverId }}</span>
        </div>
      </template>
      <template #photoSelection-cell="{ row }">
        <span class="text-sm">
          {{ row.original.photoSelection }}
        </span>
      </template>
    </UTable>
    <UModal v-model:open="confirmDeleteOpen" title="Подтверждение удаления" :description="`Удалить заявку ученика: ${pendingDeleteLabel}?`">
      <template #footer>
        <div class="flex justify-end gap-2">
          <UButton
            color="neutral"
            variant="soft"
            @click="confirmDeleteOpen = false"> Отмена </UButton>
          <UButton
            color="error"
            :loading="deletingId !== null"
            @click="confirmRemoveApplication"> Удалить </UButton>
        </div>
      </template>
    </UModal>
  </UContainer>
</template>
