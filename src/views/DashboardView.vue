<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-4">
    <!-- 標題列 -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-bold text-white">今日計畫</h1>
        <p class="text-slate-400 text-sm">{{ todayLabel }}</p>
      </div>
      <router-link :to="`/edit/${today}`" class="btn-primary text-sm">
        {{ record ? '編輯' : '+ 新增' }}
      </router-link>
    </div>

    <!-- 連續天數 + 統計 -->
    <div class="grid grid-cols-2 gap-3 mb-5">
      <div class="card text-center">
        <div class="text-3xl font-bold text-blue-400">{{ streak }}</div>
        <div class="text-xs text-slate-400 mt-1">連續記錄天數 🔥</div>
      </div>
      <div class="card text-center">
        <div class="text-3xl font-bold" :class="rateColor">{{ completionRate }}%</div>
        <div class="text-xs text-slate-400 mt-1">今日達標率</div>
      </div>
    </div>

    <!-- 重點項目順序 -->
    <div v-if="record?.priority_order" class="card mb-4">
      <div class="label">今日重點項目順序</div>
      <div class="text-slate-100 font-medium">{{ record.priority_order }}</div>
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="text-center text-slate-400 py-10">載入中…</div>

    <!-- 無資料 -->
    <div v-else-if="!record" class="card text-center py-8 mb-4">
      <div class="text-4xl mb-3">📝</div>
      <div class="text-slate-400 mb-4">今天還沒有記錄</div>
      <router-link :to="`/edit/${today}`" class="btn-primary inline-block">開始記錄今天</router-link>
    </div>

    <!-- 活動卡片列表 -->
    <div v-else class="space-y-3 mb-5">
      <ActivityCard v-for="rec in sortedRecs" :key="rec.id" :rec="rec" />
      <div v-if="record.notes" class="card">
        <div class="label">備註</div>
        <div class="text-slate-300 text-sm whitespace-pre-wrap">{{ record.notes }}</div>
      </div>
    </div>

    <!-- 今日學習 -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-slate-300">🧠 今日學習</h2>
        <button class="text-blue-400 text-xs hover:text-blue-300" @click="openAdd('學習')">+ 新增</button>
      </div>
      <div v-if="!studyEntries.length" class="card py-4 text-center text-slate-500 text-sm">今天還沒有學習記錄</div>
      <div v-else class="space-y-2">
        <div v-for="e in studyEntries" :key="e.id" class="card py-3 flex justify-between items-start">
          <div>
            <div class="font-medium text-slate-100 text-sm">{{ e.title }}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-1.5 py-0.5 rounded-full" :class="statusClass(e.status)">{{ e.status }}</span>
              <span v-if="e.notes" class="text-xs text-slate-500">{{ e.notes }}</span>
            </div>
          </div>
          <button class="text-slate-500 hover:text-slate-300 text-xs ml-2 shrink-0" @click="openEdit(e)">編輯</button>
        </div>
      </div>
    </div>

    <!-- 今日閱讀 -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="font-semibold text-slate-300">📖 今日閱讀</h2>
        <button class="text-blue-400 text-xs hover:text-blue-300" @click="openAdd('閱讀')">+ 新增</button>
      </div>
      <div v-if="!readEntries.length" class="card py-4 text-center text-slate-500 text-sm">今天還沒有閱讀記錄</div>
      <div v-else class="space-y-2">
        <div v-for="e in readEntries" :key="e.id" class="card py-3 flex justify-between items-start">
          <div>
            <div class="font-medium text-slate-100 text-sm">{{ e.title }}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs px-1.5 py-0.5 rounded-full" :class="statusClass(e.status)">{{ e.status }}</span>
              <span v-if="e.notes" class="text-xs text-slate-500">{{ e.notes }}</span>
            </div>
          </div>
          <button class="text-slate-500 hover:text-slate-300 text-xs ml-2 shrink-0" @click="openEdit(e)">編輯</button>
        </div>
      </div>
    </div>

    <!-- 快速新增 / 編輯 Modal（內嵌於 Dashboard）-->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showModal = false">
        <div class="bg-slate-800 rounded-t-2xl w-full max-h-[80vh] overflow-y-auto p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ modalForm.id ? '編輯' : '新增' }}記錄</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showModal = false">×</button>
          </div>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">類別</label>
                <select v-model="modalForm.category" class="input">
                  <option>學習</option><option>閱讀</option>
                </select>
              </div>
              <div>
                <label class="label">狀態</label>
                <select v-model="modalForm.status" class="input">
                  <option>進行中</option><option>預覽</option><option>完成</option><option>無</option>
                </select>
              </div>
            </div>
            <div>
              <label class="label">書名／課程名稱 *</label>
              <input v-model="modalForm.title" class="input" placeholder="輸入書名或課程名稱" />
            </div>
            <div>
              <label class="label">備註</label>
              <textarea v-model="modalForm.notes" class="input resize-none text-sm" rows="2" placeholder="心得或備忘…" />
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="modalSaving || !modalForm.title" @click="saveModal">
              {{ modalSaving ? '儲存中…' : '儲存' }}
            </button>
            <button v-if="modalForm.id" class="btn-danger text-sm" @click="removeEntry(modalForm)">刪除</button>
            <button class="btn-secondary" @click="showModal = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityCard from '../components/ActivityCard.vue'
import { useRecords } from '../composables/useRecords'
import { useLearning } from '../composables/useLearning'
import { getAchieveLevel } from '../lib/parseTarget'

const { fetchRecord, fetchStreakAndStats } = useRecords()
const { fetchEntriesByDate, upsertEntry, deleteEntry } = useLearning()

const today = new Date().toISOString().slice(0, 10)
const todayLabel = computed(() => {
  const d = new Date()
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 星期${wd}`
})

const loading = ref(true)
const record = ref(null)
const streak = ref(0)
const todayEntries = ref([])
const showModal = ref(false)
const modalSaving = ref(false)

const emptyModalForm = (cat) => ({
  id: null, entry_date: today, title: '', category: cat || '學習', status: '進行中', notes: ''
})
const modalForm = ref(emptyModalForm())

onMounted(async () => {
  const [r, s, l] = await Promise.all([
    fetchRecord(today),
    fetchStreakAndStats(),
    fetchEntriesByDate(today),
  ])
  record.value = r.data
  streak.value = s.streak
  todayEntries.value = l.data
  loading.value = false
})

const sortedRecs = computed(() => {
  if (!record.value?.activity_records) return []
  return [...record.value.activity_records].sort(
    (a, b) => (a.activity_templates?.sort_order || 0) - (b.activity_templates?.sort_order || 0)
  )
})

const completionRate = computed(() => {
  const recs = sortedRecs.value.filter(r => r.can_do)
  if (!recs.length) return 0
  const done = recs.filter(r => { const l = getAchieveLevel(r); return l && l !== 'miss' })
  return Math.round((done.length / recs.length) * 100)
})

const rateColor = computed(() => {
  if (completionRate.value >= 80) return 'text-green-400'
  if (completionRate.value >= 50) return 'text-yellow-400'
  return 'text-red-400'
})

const studyEntries = computed(() => todayEntries.value.filter(e => e.category === '學習'))
const readEntries = computed(() => todayEntries.value.filter(e => e.category === '閱讀'))

function statusClass(status) {
  return {
    '進行中': 'bg-green-900 text-green-300',
    '預覽':   'bg-yellow-900 text-yellow-300',
    '完成':   'bg-slate-700 text-slate-300',
    '無':     'bg-slate-800 text-slate-500',
  }[status] || 'bg-slate-700 text-slate-400'
}

function openAdd(cat) {
  modalForm.value = emptyModalForm(cat)
  showModal.value = true
}

function openEdit(entry) {
  modalForm.value = { ...entry }
  showModal.value = true
}

async function saveModal() {
  if (!modalForm.value.title.trim()) return
  modalSaving.value = true
  const { data, error } = await upsertEntry({ ...modalForm.value })
  modalSaving.value = false
  if (error) return
  if (modalForm.value.id) {
    const idx = todayEntries.value.findIndex(e => e.id === data.id)
    if (idx !== -1) todayEntries.value[idx] = data
  } else {
    todayEntries.value.push(data)
  }
  showModal.value = false
}

async function removeEntry(entry) {
  if (!confirm(`確定刪除「${entry.title}」？`)) return
  await deleteEntry(entry.id)
  todayEntries.value = todayEntries.value.filter(e => e.id !== entry.id)
  showModal.value = false
}
</script>
