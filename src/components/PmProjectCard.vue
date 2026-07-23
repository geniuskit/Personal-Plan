<template>
  <div class="card">
    <!-- 標題列 -->
    <div class="flex items-start gap-2">
      <button class="text-slate-400 hover:text-white text-lg leading-none mt-0.5 w-5" @click="toggle">
        {{ expanded ? '−' : '+' }}
      </button>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-medium text-slate-100">{{ project.name }}</span>
          <span v-if="prog.total" class="text-xs text-slate-400">
            進度 {{ prog.done }}/{{ prog.total }}
          </span>
        </div>
        <!-- 進度條 -->
        <div v-if="prog.total" class="h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full" :style="{ width: pct + '%' }"></div>
        </div>
        <!-- 次要資訊 -->
        <div class="flex items-center gap-x-3 gap-y-1 flex-wrap mt-2 text-xs">
          <span class="text-slate-300">⏱ {{ hr }}</span>
          <span v-if="items" class="text-slate-300">📦 {{ items }} 項</span>
          <span v-if="project.daily_min_unit" class="text-slate-500">目標 {{ project.daily_min_unit.split('\n')[0] }}</span>
          <span v-if="idle != null" :class="idle >= 3 ? 'text-red-400' : 'text-slate-500'">
            🌱 長草 {{ idle }} 天
          </span>
        </div>
      </div>
    </div>

    <!-- 展開內容 -->
    <div v-if="expanded" class="mt-3 pl-7 space-y-3">
      <!-- 階段進度 -->
      <div v-if="sessions.length">
        <div class="label mb-1">階段</div>
        <div class="space-y-1">
          <div v-for="s in sessions" :key="s.id" class="flex items-center gap-2 text-sm">
            <span class="text-xs px-1.5 py-0.5 rounded-full" :class="statusMeta(SESSION_STATUS, s.status).cls">
              {{ statusMeta(SESSION_STATUS, s.status).label }}
            </span>
            <span class="text-slate-200 flex-1 truncate">{{ s.name }}</span>
            <span class="text-xs text-slate-400">{{ sp(s).done }}/{{ sp(s).total }}</span>
          </div>
        </div>
      </div>

      <!-- 最近 5 個天數歷程（同天數合併） -->
      <div>
        <div class="label mb-1">最近歷程</div>
        <div v-if="logsLoading" class="text-slate-500 text-xs">載入中…</div>
        <div v-else-if="!recentGroups.length" class="text-slate-500 text-xs">尚無歷程</div>
        <div v-else class="space-y-1">
          <div v-for="g in recentGroups" :key="g.day_number ?? '_'" class="text-xs bg-slate-700/50 rounded-lg px-2 py-1.5">
            <div class="flex items-center gap-2">
              <span class="text-blue-300 font-medium">第 {{ g.day_number ?? '—' }} 天</span>
              <span class="text-slate-400">{{ g.dates.join(', ') || '無日期' }}</span>
              <span class="ml-auto text-slate-300">{{ fmt(g.totalMin) }}<span v-if="g.totalItems"> · {{ g.totalItems }}項</span></span>
            </div>
            <div v-if="g.contents.length" class="text-slate-400 mt-0.5">{{ g.contents.join('；') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  SESSION_STATUS, statusMeta, projectProgress, sessionProgress,
  totalMinutes, totalItems, idleDays, formatHr,
} from '../composables/usePmProjects'
import { usePmLogs, groupLogsByDay } from '../composables/usePmLogs'

const props = defineProps({ project: { type: Object, required: true } })
const { fetchLogs } = usePmLogs()

const expanded = ref(false)
const logsLoading = ref(false)
const recentGroups = ref([])

const prog = computed(() => projectProgress(props.project))
const pct = computed(() => prog.value.total ? Math.round(prog.value.done / prog.value.total * 100) : 0)
const hr = computed(() => formatHr(totalMinutes(props.project)))
const items = computed(() => totalItems(props.project))
const idle = computed(() => idleDays(props.project))
const sessions = computed(() =>
  [...(props.project.pm_sessions || [])].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
)

const sp = (s) => sessionProgress(s)
const fmt = (m) => formatHr(m)

async function toggle() {
  expanded.value = !expanded.value
  if (expanded.value && !recentGroups.value.length) {
    logsLoading.value = true
    const { data } = await fetchLogs(props.project.id)
    recentGroups.value = groupLogsByDay(data).slice(0, 5)
    logsLoading.value = false
  }
}
</script>
