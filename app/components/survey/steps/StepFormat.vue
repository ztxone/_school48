<script setup lang="ts">
import { ALBUM_OPTIONS } from '~~/shared/album-options'

defineProps<{
  albumFormatKey: string
}>()

const emit = defineEmits<{
  updateFormat: [string]
}>()
</script>

<template>
  <div class="space-y-4">
    <p class="text-xl font-semibold text-muted">
      Выберите формат альбома и стоимость.
    </p>
    <div class="grid gap-3">
      <button
        v-for="option in ALBUM_OPTIONS"
        :key="option.key"
        type="button"
        class="rounded-lg border p-4 text-left transition"
        :class="albumFormatKey === option.key ? 'border-primary ring-1 ring-primary' : 'border-default hover:border-primary/50'"
        @click="emit('updateFormat', option.key)"
      >
        <div class="flex items-center justify-between gap-2">
          <p class="font-medium">
            {{ option.title }}
          </p>
          <UBadge
            color="primary"
            variant="soft"
          >
            {{ option.priceRub.toLocaleString('ru-RU') }} ₽
          </UBadge>
        </div>
        <p class="mt-1 text-sm text-muted">
          {{ option.description }}
        </p>
      </button>
    </div>
    <p class="font-bold text-lg text-error">
      Внимание!
    </p>
    <div class="prose bg-amber-100 p-4">
      <p>Концепция моих альбомов заключается в том, что это именно «школьный» альбом и делается он именно для самого ребенка, в отличие от «семейного» альбома для мамы, где на фотографиях только ваш ребенок.</p>
      <p> В моих альбомах нет «чужих» детей, есть только друзья и одноклассники, с которыми ребенок провёл (а возможно и еще проведёт) вместе кучу времени, может даже многие годы. Если вам нужен полностью индивидуальный альбом - все обсуждается до первой съемки и стоимость соответственно рассчитывается индивидуально.</p>
      <ul class="list-disc list-inside">
        <li> весь класс выбирает один дизайн для фотокниги и единый формат (количество разворотов)</li>
        <li> при заказе книг сюжеты могут меняться по согласованию с заказчиком или исходя из погодных условий </li>
        <li> основная портретная съемка проходит в один день </li>
        <li> количество съемочных дней зависит от количества разворотов в фотокниге </li>
        <li> по желанию можно добавить дополнительные развороты в альбом, стоимость индивидуального разворота 700 рублей </li>
        <li> используемые в фотокниге индивидуальные портреты (обложка+виньетка) в электронном виде отдаются бесплатно </li>
      </ul>
    </div>
  </div>
</template>
