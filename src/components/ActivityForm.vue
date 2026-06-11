<template>
  <div class="card space-y-3">
    <div class="flex items-center justify-between">
      <span class="font-semibold text-slate-100">{{ activity.name }}</span>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-400">今天能做嗎？</span>
        <button
          type="button"
          class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
          :class="modelValue.can_do ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-400'"
          @click="toggle('can_do', !modelValue.can_do)"
        >
          {{ modelValue.can_do ? '能 ✓' : '不能' }}
        </button>
      </div>
    </div>

    <template v-if="modelValue.can_do">
      <div class="grid grid-cols-3 gap-2">
        <div>
          <label class="label">高標</label>
          <input class="input text-sm text-green-400" :value="modelValue.high_target" @input="update('high_target', $event.target.value)" placeholder="如 >1hr" />
        </div>
        <div>
          <label class="label">中標</label>
          <input class="input text-sm text-yellow-400" :value="modelValue.mid_target" @input="update('mid_target', $event.target.value)" placeholder="如 1hr" />
        </div>
        <div>
          <label class="label">低標</label>
          <input class="input text-sm text-red-400" :value="modelValue.low_target" @input="update('low_target', $event.target.value)" placeholder="如 30m" />
        </div>
      </div>

      <div class="flex gap-2">
        <div class="flex-1">
          <label class="label">實際達成</label>
          <input class="input text-sm" :value="modelValue.actual_result" @input="update('actual_result', $event.target.value)" placeholder="如 1.5" />
        </div>
        <div class="w-24">
          <label class="label">單位</label>
          <select class="input text-sm" :value="modelValue.unit" @change="update('unit', $event.target.value)">
            <option>hr</option>
            <option>min</option>
            <option>次</option>
            <option>km</option>
            <option>組</option>
          </select>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  activity: Object,
  modelValue: Object,
})
const emit = defineEmits(['update:modelValue'])

function update(key, val) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
function toggle(key, val) {
  emit('update:modelValue', { ...props.modelValue, [key]: val })
}
</script>
