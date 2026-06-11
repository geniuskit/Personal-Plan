<template>
  <div class="card">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span
          class="text-xs font-medium px-2 py-0.5 rounded-full"
          :class="rec.can_do ? 'bg-green-900 text-green-300' : 'bg-slate-700 text-slate-400'"
        >
          {{ rec.can_do ? '能' : '不能' }}
        </span>
        <span class="font-semibold text-slate-100">{{ rec.activity_templates?.name }}</span>
      </div>
      <span v-if="rec.actual_result" class="text-sm font-bold" :class="achieveColor">
        {{ rec.actual_result }} {{ rec.unit }}
      </span>
    </div>

    <div v-if="rec.can_do" class="grid grid-cols-3 gap-2 text-xs mb-3">
      <div class="text-center">
        <div class="label">高標</div>
        <div class="text-green-400 font-medium">{{ rec.high_target || '—' }}</div>
      </div>
      <div class="text-center">
        <div class="label">中標</div>
        <div class="text-yellow-400 font-medium">{{ rec.mid_target || '—' }}</div>
      </div>
      <div class="text-center">
        <div class="label">低標</div>
        <div class="text-red-400 font-medium">{{ rec.low_target || '—' }}</div>
      </div>
    </div>

    <div v-if="rec.can_do && rec.actual_result" class="mt-1">
      <div class="flex justify-between text-xs text-slate-400 mb-1">
        <span>達成進度</span>
        <span :class="achieveColor">{{ achieveLabel }}</span>
      </div>
      <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" :class="barColor" :style="{ width: barWidth }"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ rec: Object })

function parseVal(s) {
  if (!s) return null
  return parseFloat(s.replace(/[^0-9.]/g, '')) || null
}

const actual = computed(() => parseVal(props.rec.actual_result))
const high = computed(() => parseVal(props.rec.high_target))
const mid = computed(() => parseVal(props.rec.mid_target))
const low = computed(() => parseVal(props.rec.low_target))

const achieveLevel = computed(() => {
  if (actual.value === null) return null
  if (high.value && actual.value >= high.value) return 'high'
  if (mid.value && actual.value >= mid.value) return 'mid'
  if (low.value && actual.value >= low.value) return 'low'
  return 'miss'
})

const achieveColor = computed(() => ({
  high: 'text-green-400',
  mid: 'text-yellow-400',
  low: 'text-orange-400',
  miss: 'text-red-400',
})[achieveLevel.value] || 'text-slate-300')

const barColor = computed(() => ({
  high: 'bg-green-500',
  mid: 'bg-yellow-500',
  low: 'bg-orange-500',
  miss: 'bg-red-500',
})[achieveLevel.value] || 'bg-slate-500')

const achieveLabel = computed(() => ({
  high: '達高標 🎯',
  mid: '達中標 ✅',
  low: '達低標 ✔',
  miss: '未達標 ✗',
})[achieveLevel.value] || '')

const barWidth = computed(() => {
  if (actual.value === null) return '0%'
  const ref = high.value || mid.value || low.value
  if (!ref) return '100%'
  return Math.min(100, Math.round((actual.value / ref) * 100)) + '%'
})
</script>
