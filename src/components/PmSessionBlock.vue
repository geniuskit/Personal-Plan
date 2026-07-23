<template>
  <div class="card">
    <!-- 階段標題列 -->
    <div class="flex items-center gap-2">
      <span class="text-xs px-1.5 py-0.5 rounded-full" :class="statusMeta(SESSION_STATUS, session.status).cls">
        {{ statusMeta(SESSION_STATUS, session.status).label }}
      </span>
      <span class="font-medium text-slate-100 flex-1 truncate">{{ session.name }}</span>
      <span class="text-xs text-slate-400">{{ prog.done }}/{{ prog.total }}</span>
      <button class="text-blue-400 hover:text-blue-300 text-xs px-1" @click="$emit('edit-session', session)">編輯</button>
      <button class="text-red-400 hover:text-red-300 text-xs px-1" @click="$emit('delete-session', session)">刪除</button>
    </div>

    <!-- 細項 -->
    <div class="mt-3 space-y-1">
      <div
        v-for="d in details" :key="d.id"
        class="flex items-center gap-2 bg-slate-700/50 rounded-lg px-2 py-1.5 text-sm"
      >
        <span class="text-xs px-1.5 py-0.5 rounded-full" :class="statusMeta(SESSION_STATUS, d.status).cls">
          {{ statusMeta(SESSION_STATUS, d.status).label }}
        </span>
        <span class="text-slate-200 flex-1 truncate">{{ d.detail_name || '（未命名細項）' }}</span>
        <span v-if="d.start_date || d.end_date" class="text-xs text-slate-500 whitespace-nowrap">
          {{ d.start_date || '—' }} ~ {{ d.end_date || '—' }}
        </span>
        <button class="text-blue-400 hover:text-blue-300 text-xs px-1" @click="$emit('edit-detail', session, d)">編輯</button>
        <button class="text-red-400 hover:text-red-300 text-xs px-1" @click="$emit('delete-detail', d)">刪除</button>
      </div>
      <button class="text-blue-400 hover:text-blue-300 text-xs mt-1" @click="$emit('add-detail', session)">
        + 新增細項
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { SESSION_STATUS, statusMeta, sessionProgress } from '../composables/usePmProjects'

const props = defineProps({ session: { type: Object, required: true } })
defineEmits(['edit-session', 'delete-session', 'add-detail', 'edit-detail', 'delete-detail'])

const details = computed(() =>
  [...(props.session.pm_session_details || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
)
const prog = computed(() => sessionProgress(props.session))
</script>
