<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SortingState } from '@tanstack/vue-table'
import type { AdminTableState } from '../../../shared/schemas'

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

type ColumnKey = 'id' | 'coverSort' | 'student' | 'photoSelection' | 'album' | 'price' | 'paymentStatus' | 'paidAt' | 'createdAt' | 'actions'

type ColumnDefinition = {
  key: ColumnKey
  label: string
  defaultVisible: boolean
  toggleable: boolean
  sortable?: boolean
  exportable?: boolean
}

const search = ref('')
const deletingId = ref<number | null>(null)
const actionError = ref('')
const exportingPdf = ref(false)
const sorting = ref<SortingState>([{ id: 'student', desc: false }])
const confirmDeleteOpen = ref(false)
const pendingDeleteId = ref<number | null>(null)
const pendingDeleteLabel = ref('')

const columnDefinitions: ColumnDefinition[] = [
  { key: 'id', label: 'ID', defaultVisible: false, toggleable: true },
  { key: 'coverSort', label: 'Обложка', defaultVisible: true, toggleable: true },
  { key: 'student', label: 'Ученик', defaultVisible: true, toggleable: false },
  { key: 'photoSelection', label: 'Фото', defaultVisible: true, toggleable: true },
  { key: 'album', label: 'Формат', defaultVisible: true, toggleable: true },
  { key: 'price', label: 'Стоимость', defaultVisible: true, toggleable: true, sortable: false },
  { key: 'paymentStatus', label: 'Оплата', defaultVisible: true, toggleable: true },
  { key: 'paidAt', label: 'Дата оплаты', defaultVisible: true, toggleable: true },
  { key: 'createdAt', label: 'Дата заявки', defaultVisible: false, toggleable: true },
  { key: 'actions', label: 'Действия', defaultVisible: true, toggleable: true, sortable: false, exportable: false }
]

const defaultVisibleColumns = Object.fromEntries(
  columnDefinitions.map(column => [column.key, column.defaultVisible])
) as Record<ColumnKey, boolean>

function buildVisibleColumns(state?: AdminTableState['visibleColumns']) {
  return {
    ...defaultVisibleColumns,
    ...state,
    student: true
  } satisfies Record<ColumnKey, boolean>
}

const { data: tableStateData } = await useFetch<AdminTableState>('/api/admin/session/table-state', {
  default: () => ({
    visibleColumns: {}
  })
})

const visibleColumns = reactive(buildVisibleColumns(tableStateData.value?.visibleColumns))

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

const visibleColumnPills = computed(() => columnDefinitions.filter(column => column.toggleable))

const visibleColumnDefinitions = computed(() => {
  return columnDefinitions.filter(column => visibleColumns[column.key])
})

const columns = computed<TableColumn<ApplicationRow>[]>(() => {
  return visibleColumnDefinitions.value.map(column => ({
    accessorKey: column.key,
    header: column.label,
    enableSorting: column.sortable ?? true
  }))
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

function formatDate(value: number | null) {
  if (!value) {
    return '—'
  }

  return new Date(value).toLocaleString('ru-RU')
}

function getPaymentStatusLabel(status: ApplicationRow['paymentStatus']) {
  return status === 'paid' ? 'Оплачено' : 'Ожидает оплаты'
}

function getComparableValue(row: ApplicationRow, key: string) {
  switch (key) {
    case 'paymentStatus':
      return row.paymentStatus === 'paid' ? 1 : 0
    case 'paidAt':
      return row.paidAt ?? 0
    default:
      return row[key as keyof ApplicationRow]
  }
}

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) {
    return 0
  }

  if (left == null) {
    return -1
  }

  if (right == null) {
    return 1
  }

  if (typeof left === 'number' && typeof right === 'number') {
    return left - right
  }

  return String(left).localeCompare(String(right), 'ru')
}

const sortedRows = computed(() => {
  const sorted = [...rows.value]

  if (!sorting.value.length) {
    return sorted
  }

  sorted.sort((leftRow, rightRow) => {
    for (const sortItem of sorting.value) {
      const compareResult = compareValues(
        getComparableValue(leftRow, sortItem.id),
        getComparableValue(rightRow, sortItem.id)
      )

      if (compareResult !== 0) {
        return sortItem.desc ? -compareResult : compareResult
      }
    }

    return 0
  })

  return sorted
})

function getCellText(row: ApplicationRow, key: ColumnKey) {
  switch (key) {
    case 'id':
      return String(row.id)
    case 'coverSort':
      return `№${row.coverId}`
    case 'student':
      return row.student
    case 'photoSelection':
      return row.photoSelection
    case 'album':
      return row.album
    case 'price':
      return row.price
    case 'paymentStatus':
      return getPaymentStatusLabel(row.paymentStatus)
    case 'paidAt':
      return formatDate(row.paidAt)
    case 'createdAt':
      return formatDate(row.createdAt)
    case 'actions':
      return 'Открыть'
  }
}

function getTableStatePayload(): AdminTableState {
  return {
    visibleColumns: {
      id: visibleColumns.id,
      coverSort: visibleColumns.coverSort,
      student: true,
      photoSelection: visibleColumns.photoSelection,
      album: visibleColumns.album,
      price: visibleColumns.price,
      paymentStatus: visibleColumns.paymentStatus,
      paidAt: visibleColumns.paidAt,
      createdAt: visibleColumns.createdAt,
      actions: visibleColumns.actions
    }
  }
}

async function persistTableState() {
  if (!import.meta.client) {
    return
  }

  try {
    await $fetch('/api/admin/session/table-state', {
      method: 'PATCH',
      body: getTableStatePayload()
    })
  } catch (error) {
    console.error('Failed to save admin table state', error)
  }
}

function toggleColumn(key: ColumnKey) {
  if (key === 'student') {
    return
  }

  visibleColumns[key] = !visibleColumns[key]

  if (!visibleColumns[key] && sorting.value.some(item => item.id === key)) {
    sorting.value = [{ id: 'student', desc: false }]
  }

  void persistTableState()
}

async function exportPdf() {
  if (!import.meta.client || !rows.value.length) {
    return
  }

  exportingPdf.value = true
  actionError.value = ''

  try {
    const [pdfMakeModule, pdfFontsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts')
    ])

    const pdfMake = (pdfMakeModule.default || pdfMakeModule) as {
      addVirtualFileSystem?: (vfs: Record<string, string>) => void
      createPdf: (docDefinition: Record<string, unknown>) => { download: (fileName: string) => void }
    }
    const vfs = (pdfFontsModule.default || pdfFontsModule) as Record<string, string>

    pdfMake.addVirtualFileSystem?.(vfs)

    const exportColumns = visibleColumnDefinitions.value.filter(column => column.exportable !== false)
    const tableBody = [
      exportColumns.map(column => ({ text: column.label, style: 'tableHeader' })),
      ...sortedRows.value.map(row => exportColumns.map(column => getCellText(row, column.key)))
    ]

    const now = new Date()
    const timestamp = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-')

    pdfMake.createPdf({
      pageOrientation: exportColumns.length > 6 ? 'landscape' : 'portrait',
      pageMargins: [24, 24, 24, 24],
      content: [
        { text: 'Заявки учеников 4Б класса (Школа №48)', style: 'title' },
        {
          text: `Всего записей: ${sortedRows.value.length}${search.value ? ` | Поиск: ${search.value}` : ''}`,
          style: 'subtitle',
          margin: [0, 0, 0, 12]
        },
        {
          table: {
            headerRows: 1,
            widths: exportColumns.map(() => 'auto'),
            body: tableBody
          },
          layout: 'lightHorizontalLines'
        }
      ],
      styles: {
        title: {
          fontSize: 16,
          bold: true
        },
        subtitle: {
          fontSize: 10,
          color: '#6b7280'
        },
        tableHeader: {
          bold: true,
          fillColor: '#f3f4f6'
        }
      },
      defaultStyle: {
        fontSize: 9
      }
    }).download(`applications-${timestamp}.pdf`)
  } catch (error) {
    console.error(error)
    actionError.value = 'Не удалось сформировать PDF'
  } finally {
    exportingPdf.value = false
  }
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
    const maybeError = error as { data?: { message?: string } }
    actionError.value = maybeError.data?.message || 'Не удалось удалить заявку'
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
      <h1 class="text-2xl font-semibold"> Заявки учеников 4Б класса (Школа №48) </h1>
      <UButton
        color="neutral"
        variant="ghost"
        @click="logout"> Выйти </UButton>
    </div>
    <div class="flex flex-wrap gap-3">
      <UInput
        v-model="search"
        placeholder="Поиск по фамилии/имени"
        class="max-w-sm" />
      <UButton
        color="neutral"
        variant="soft"
        :loading="pending"
        @click="refresh()"> Обновить </UButton>
      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide-file-down"
        :loading="exportingPdf"
        :disabled="!rows.length"
        @click="exportPdf"> Экспорт в PDF </UButton>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-sm text-muted">Колонки:</span>
      <UButton
        v-for="column in visibleColumnPills"
        :key="column.key"
        color="neutral"
        size="sm"
        class="rounded-full"
        :variant="visibleColumns[column.key] ? 'solid' : 'soft'"
        @click="toggleColumn(column.key)">
        {{ column.label }}
      </UButton>
    </div>
    <UAlert
      v-if="actionError"
      color="error"
      variant="subtle"
      :title="actionError" />
    <UTable
      v-model:sorting="sorting"
      :data="rows"
      :columns="columns"
      class="admin-table"
      :loading="pending"
      sticky
      empty="Заявок пока нет"
      :ui="{
        td: 'p-2'
      }">
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
          size="xs"
          :disabled="!column.getCanSort()"> Стоимость </UButton>
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
          :disabled="!column.getCanSort()"> Действия </UButton>
      </template>
      <template #paymentStatus-cell="{ row }">
        <UBadge
          :color="row.original.paymentStatus === 'paid' ? 'success' : 'warning'"
          variant="soft">
          {{ getPaymentStatusLabel(row.original.paymentStatus) }}
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
        <span :class="row.original.paidAt ? '' : 'text-muted'">
          {{ formatDate(row.original.paidAt) }}
        </span>
      </template>
      <template #createdAt-cell="{ row }">
        {{ formatDate(row.original.createdAt) }}
      </template>
      <template #coverSort-cell="{ row }">
        <div class="flex items-center gap-2">
          <!-- <img
            :src="`/Обложка_${row.original.coverId}.jpeg`"
            :alt="`Обложка ${row.original.coverId}`"
            class="h-8 w-8 rounded object-cover border border-default"> -->
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
<style scoped>
.admin-table :deep(thead th),
.admin-table :deep(tbody td) {
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
}

.admin-table :deep(tbody td) {
  vertical-align: top;
}
</style>
