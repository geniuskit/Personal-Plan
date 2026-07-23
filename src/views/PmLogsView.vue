<template>
  <div class="pb-4">
    <PmSubNav />
    <div class="max-w-3xl mx-auto px-4 pt-2">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-bold text-white">📝 歷程管理</h1>
        <button class="btn-primary text-sm" :disabled="!projectId" @click="openAdd()">+ 新增歷程</button>
      </div>

      <PmProjectPicker v-model="projectId" />

      <div v-if="!projectId" class="card text-center py-10 text-slate-400">請先選擇專案</div>

      <template v-else>
        <div v-if="loading" class="text-slate-400 text-center py-8">載入中…</div>

        <div v-else>
          <!-- 彙總 -->
          <div class="grid grid-cols-3 gap-2 mb-3">
            <div class="card text-center py-3">
              <div class="text-lg font-bold text-blue-300">{{ formatHr(sumMin) }}</div>
              <div class="text-xs text-slate-500">總時數</div>
            </div>
            <div class="card text-center py-3">
              <div class="text-lg font-bold text-emerald-300">{{ sumItems }}</div>
              <div class="text-xs text-slate-500">總項目數</div>
            </div>
            <div class="card text-center py-3">
              <div class="text-lg font-bold text-slate-200">{{ groups.length }}</div>
              <div class="text-xs text-slate-500">學習天數</div>
            </div>
          </div>

          <div v-if="!groups.length" class="card text-center py-8 text-slate-400">尚無歷程，點右上角新增</div>

          <!-- 依天數合併顯示（可展開逐筆編輯） -->
          <div v-else class="space-y-2">
            <div v-for="g in groups" :key="g.day_number ?? '_'" class="card">
              <div class="flex items-center gap-2 cursor-pointer" @click="toggle(g)">
                <span class="text-slate-400 w-4">{{ isOpen(g) ? '−' : '+' }}</span>
                <span class="text-blue-300 font-medium whitespace-nowrap">第 {{ g.day_number ?? '—' }} 天</span>
                <span class="text-xs text-slate-400 truncate">{{ g.dates.join(', ') || '無日期' }}</span>
                <span class="ml-auto text-sm text-slate-200 whitespace-nowrap">
                  {{ formatHr(g.totalMin) }}<span v-if="g.totalItems" class="text-slate-400"> · {{ g.totalItems }}項</span>
                </span>
              </div>
              <div v-if="g.contents.length && !isOpen(g)" class="text-xs text-slate-400 mt-1 pl-6 truncate">
                {{ g.contents.join('；') }}
              </div>

              <!-- 展開：逐筆 -->
              <div v-if="isOpen(g)" class="mt-2 pl-6 space-y-1">
                <div
                  v-for="e in g.entries" :key="e.id"
                  class="flex items-center gap-2 bg-slate-700/50 rounded-lg px-2 py-1.5 text-sm"
                >
                  <span class="text-slate-400 text-xs whitespace-nowrap">{{ e.log_date || '無日期' }}</span>
                  <span class="text-slate-300 text-xs whitespace-nowrap">{{ formatHr(e.duration_min || 0) }}</span>
                  <span v-if="e.item_count" class="text-slate-400 text-xs">{{ e.item_count }}項</span>
                  <span class="text-slate-200 flex-1 truncate">{{ e.content || '—' }}</span>
                  <button class="text-blue-400 hover:text-blue-300 text-xs px-1" @click="openEdit(e)">編輯</button>
                  <button class="text-red-400 hover:text-red-300 text-xs px-1" @click="remove(e)">刪除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 新增／編輯 modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showModal = false">
        <div class="bg-slate-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5 max-w-2xl mx-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ form.id ? '編輯' : '新增' }}歷程</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showModal = false">×</button>
          </div>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">第幾天</label>
                <input type="number" v-model.number="form.day_number" class="input" min="1" />
              </div>
              <div>
                <label class="label">日期</label>
                <input type="date" v-model="form.log_date" class="input" />
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="label">時數</label>
                <div class="flex gap-2">
                  <input type="number" v-model.number="form.duration_value" class="input" min="0" step="any" placeholder="數值" />
                  <select v-model="form.duration_unit" class="input w-20">
                    <option value="min">分</option>
                    <option value="hr">時</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="label">項目數</label>
                <input type="number" v-model.number="form.item_count" class="input" min="0" />
              </div>
            </div>
            <div>
              <label class="label">內容</label>
              <textarea v-model="form.content" class="input resize-none text-sm" rows="2" placeholder="今天做了什麼…" />
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="saving" @click="save">{{ saving ? '儲存中…' : '儲存' }}</button>
            <button class="btn-secondary" @click="showModal = false">取消</button>
          </div>
          <div v-if="errMsg" class="text-red-400 text-sm text-center mt-2">{{ errMsg }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PmSubNav from '../components/PmSubNav.vue'
import PmProjectPicker from '../components/PmProjectPicker.vue'
import { usePmLogs, groupLogsByDay } from '../composables/usePmLogs'
import { formatHr, todayStr } from '../composables/usePmProjects'

const { fetchLogs, maxDayNumber, upsertLog, deleteLog } = usePmLogs()

const projectId = ref('')
const loading = ref(false)
const logs = ref([])
const openDays = ref([])

const showModal = ref(false)
const saving = ref(false)
const errMsg = ref('')
const emptyForm = () => ({
  id: null, project_id: projectId.value, day_number: 1, log_date: todayStr(),
  duration_value: null, duration_unit: 'min', item_count: null, content: '',
})
const form = ref(emptyForm())

const groups = computed(() => groupLogsByDay(logs.value))
const sumMin = computed(() => logs.value.reduce((s, l) => s + (l.duration_min || 0), 0))
const sumItems = computed(() => logs.value.reduce((s, l) => s + (l.item_count || 0), 0))

watch(projectId, load, { immediate: true })

async function load() {
  if (!projectId.value) { logs.value = []; return }
  loading.value = true
  const { data } = await fetchLogs(projectId.value)
  logs.value = data
  openDays.value = []
  loading.value = false
}

const keyOf = (g) => (g.day_number ?? '_')
const isOpen = (g) => openDays.value.includes(keyOf(g))
function toggle(g) {
  const k = keyOf(g)
  const i = openDays.value.indexOf(k)
  if (i === -1) openDays.value.push(k)
  else openDays.value.splice(i, 1)
}

async function openAdd() {
  const max = await maxDayNumber(projectId.value)
  form.value = { ...emptyForm(), day_number: max || 1 }
  errMsg.value = ''
  showModal.value = true
}

function openEdit(e) {
  form.value = {
    id: e.id, project_id: e.project_id, day_number: e.day_number, log_date: e.log_date,
    duration_value: e.duration_min ?? null, duration_unit: 'min',
    item_count: e.item_count ?? null, content: e.content || '',
  }
  errMsg.value = ''
  showModal.value = true
}

async function save() {
  saving.value = true
  errMsg.value = ''
  const v = form.value.duration_value
  const duration_min = (v == null || v === '')
    ? null
    : Math.round(form.value.duration_unit === 'hr' ? v * 60 : v)
  const payload = {
    id: form.value.id,
    project_id: projectId.value,
    day_number: form.value.day_number ?? null,
    log_date: form.value.log_date || null,
    duration_min,
    item_count: (form.value.item_count === '' ? null : form.value.item_count) ?? null,
    content: form.value.content || null,
  }
  const { error } = await upsertLog(payload)
  saving.value = false
  if (error) { errMsg.value = '儲存失敗：' + error.message; return }
  showModal.value = false
  await load()
}

async function remove(e) {
  if (!confirm('確定刪除這筆歷程？')) return
  await deleteLog(e.id)
  await load()
}
</script>
