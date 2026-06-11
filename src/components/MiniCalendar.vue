<template>
  <div class="select-none">
    <div class="flex items-center justify-between mb-4">
      <button class="text-slate-400 hover:text-white px-2 py-1 text-lg" @click="prev">‹</button>
      <span class="font-semibold text-slate-100">{{ year }} / {{ String(month).padStart(2, '0') }}</span>
      <button class="text-slate-400 hover:text-white px-2 py-1 text-lg" @click="next">›</button>
    </div>

    <div class="grid grid-cols-7 text-center text-xs text-slate-500 mb-1">
      <span v-for="d in weekdays" :key="d">{{ d }}</span>
    </div>

    <div class="grid grid-cols-7 text-center text-sm gap-y-1">
      <div v-for="(cell, i) in cells" :key="i">
        <button
          v-if="cell.day"
          class="w-8 h-8 mx-auto rounded-full flex flex-col items-center justify-center leading-none transition-colors relative"
          :class="cellClass(cell)"
          @click="select(cell)"
        >
          <span>{{ cell.day }}</span>
          <span v-if="cell.hasData" class="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        </button>
        <div v-else class="w-8 h-8" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  markedDates: { type: Array, default: () => [] },
  selected: { type: String, default: '' },
})
const emit = defineEmits(['select', 'monthChange'])

const today = new Date()
const year = ref(today.getFullYear())
const month = ref(today.getMonth() + 1)

const weekdays = ['一', '二', '三', '四', '五', '六', '日']

const cells = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  // Monday-based: 0=Mon .. 6=Sun
  let startDow = (first.getDay() + 6) % 7
  const daysInMonth = new Date(year.value, month.value, 0).getDate()
  const result = []
  for (let i = 0; i < startDow; i++) result.push({ day: null })
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year.value}-${String(month.value).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    result.push({ day: d, dateStr, hasData: props.markedDates.includes(dateStr) })
  }
  return result
})

function cellClass(cell) {
  const isToday = cell.dateStr === today.toISOString().slice(0, 10)
  const isSelected = cell.dateStr === props.selected
  if (isSelected) return 'bg-blue-600 text-white'
  if (isToday) return 'ring-1 ring-blue-500 text-blue-300 hover:bg-slate-700'
  return 'text-slate-300 hover:bg-slate-700'
}

function select(cell) {
  if (!cell.dateStr) return
  emit('select', cell.dateStr)
}

function prev() {
  if (month.value === 1) { year.value--; month.value = 12 }
  else month.value--
  emit('monthChange', { year: year.value, month: month.value })
}

function next() {
  if (month.value === 12) { year.value++; month.value = 1 }
  else month.value++
  emit('monthChange', { year: year.value, month: month.value })
}

emit('monthChange', { year: year.value, month: month.value })
</script>
