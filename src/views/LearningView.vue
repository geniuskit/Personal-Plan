<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-4">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold text-white">📚 學習日誌</h1>
      <button class="btn-primary text-sm" @click="openAdd()">+ 新增</button>
    </div>

    <!-- 日期範圍搜尋 -->
    <div class="card mb-4">
      <div class="label mb-2">日期範圍</div>
      <div class="flex gap-2 items-center">
        <input type="date" v-model="rangeFrom" class="input text-sm flex-1" />
        <span class="text-slate-500">～</span>
        <input type="date" v-model="rangeTo" class="input text-sm flex-1" />
        <button class="btn-primary text-sm whitespace-nowrap" @click="search">搜尋</button>
      </div>
    </div>

    <!-- 篩選列 -->
    <div class="flex gap-2 mb-4 items-center flex-wrap">
      <div class="flex gap-1">
        <button
          v-for="c in ['全部','學習','閱讀']" :key="c"
          class="px-3 py-1 rounded-full text-sm transition-colors"
          :class="filterCat === c ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'"
          @click="filterCat = c"
        >{{ c }}</button>
      </div>
      <select v-model="filterStatus" class="input text-sm w-32">
        <option v-for="s in ['全部','進行中','預覽','完成','無']" :key="s">{{ s }}</option>
      </select>
      <span class="text-slate-500 text-xs ml-auto">{{ filtered.length }} 筆</span>
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="text-slate-400 text-center py-10">載入中…</div>

    <!-- 空狀態 -->
    <div v-else-if="!filtered.length" class="card text-center py-10 text-slate-400">
      <div class="text-3xl mb-2">📖</div>
      <div>沒有符合條件的記錄</div>
    </div>

    <!-- 桌面表格 -->
    <div v-else class="hidden md:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="text-slate-400 border-b border-slate-700 text-left">
            <th class="pb-2 pr-4">日期</th>
            <th class="pb-2 pr-4">書名／課程</th>
            <th class="pb-2 pr-4">類別</th>
            <th class="pb-2 pr-4">狀態</th>
            <th class="pb-2 pr-4">備註</th>
            <th class="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="entry in filtered" :key="entry.id"
            class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
          >
            <td class="py-3 pr-4 text-slate-400 text-xs whitespace-nowrap">{{ entry.entry_date }}</td>
            <td class="py-3 pr-4 font-medium text-slate-100">{{ entry.title }}</td>
            <td class="py-3 pr-4">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="catClass(entry.category)">{{ entry.category }}</span>
            </td>
            <td class="py-3 pr-4">
              <span class="text-xs px-2 py-0.5 rounded-full" :class="statusClass(entry.status)">{{ entry.status }}</span>
            </td>
            <td class="py-3 pr-4 text-slate-500 text-xs max-w-xs truncate">{{ entry.notes || '—' }}</td>
            <td class="py-3">
              <div class="flex gap-2">
                <button class="text-blue-400 hover:text-blue-300 text-xs" @click="openEdit(entry)">編輯</button>
                <button class="text-red-400 hover:text-red-300 text-xs" @click="remove(entry)">刪除</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 手機卡片 -->
    <div v-if="!loading && filtered.length" class="md:hidden space-y-2">
      <div v-for="entry in filtered" :key="entry.id" class="card">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-medium text-slate-100 text-sm">{{ entry.title }}</div>
            <div class="flex items-center gap-2 mt-1">
              <span class="text-xs text-slate-500">{{ entry.entry_date }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded-full" :class="catClass(entry.category)">{{ entry.category }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded-full" :class="statusClass(entry.status)">{{ entry.status }}</span>
            </div>
            <div v-if="entry.notes" class="text-xs text-slate-500 mt-1">{{ entry.notes }}</div>
          </div>
          <div class="flex gap-2 ml-2">
            <button class="text-blue-400 text-xs" @click="openEdit(entry)">編輯</button>
            <button class="text-red-400 text-xs" @click="remove(entry)">刪除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Sheet Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showModal = false">
        <div class="bg-slate-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ form.id ? '編輯' : '新增' }}記錄</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showModal = false">×</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="label">日期</label>
              <input type="date" v-model="form.entry_date" class="input" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">類別</label>
                <select v-model="form.category" class="input">
                  <option>學習</option>
                  <option>閱讀</option>
                </select>
              </div>
              <div>
                <label class="label">狀態</label>
                <select v-model="form.status" class="input">
                  <option>進行中</option>
                  <option>預覽</option>
                  <option>完成</option>
                  <option>無</option>
                </select>
              </div>
            </div>
            <div>
              <label class="label">書名／課程名稱 *</label>
              <input v-model="form.title" class="input" placeholder="輸入書名或課程名稱" />
            </div>
            <div>
              <label class="label">備註</label>
              <textarea v-model="form.notes" class="input resize-none text-sm" rows="2" placeholder="心得或備忘…" />
            </div>
          </div>

          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="saving || !form.title" @click="save">
              {{ saving ? '儲存中…' : '儲存' }}
            </button>
            <button class="btn-secondary" @click="showModal = false">取消</button>
          </div>
          <div v-if="errMsg" class="text-red-400 text-sm text-center mt-2">{{ errMsg }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useLearning } from '../composables/useLearning'

const { fetchEntriesByRange, upsertEntry, deleteEntry } = useLearning()

const today = new Date().toISOString().slice(0, 10)
const rangeFrom = ref(today.slice(0, 8) + '01')
const rangeTo = ref(today)
const filterCat = ref('全部')
const filterStatus = ref('全部')
const loading = ref(false)
const entries = ref([])
const showModal = ref(false)
const saving = ref(false)
const errMsg = ref('')

const emptyForm = (cat = '學習') => ({
  id: null, entry_date: today, title: '', category: cat, status: '進行中', notes: ''
})
const form = ref(emptyForm())

const filtered = computed(() => entries.value.filter(e => {
  const cOk = filterCat.value === '全部' || e.category === filterCat.value
  const sOk = filterStatus.value === '全部' || e.status === filterStatus.value
  return cOk && sOk
}))

function catClass(cat) {
  return cat === '學習' ? 'bg-purple-900 text-purple-300' : 'bg-blue-900 text-blue-300'
}

function statusClass(status) {
  return {
    '進行中': 'bg-green-900 text-green-300',
    '預覽':   'bg-yellow-900 text-yellow-300',
    '完成':   'bg-slate-700 text-slate-300',
    '無':     'bg-slate-800 text-slate-500',
  }[status] || 'bg-slate-700 text-slate-400'
}

function openAdd(cat = '學習') {
  form.value = emptyForm(cat)
  errMsg.value = ''
  showModal.value = true
}

function openEdit(entry) {
  form.value = { ...entry }
  errMsg.value = ''
  showModal.value = true
}

async function save() {
  if (!form.value.title.trim()) return
  saving.value = true
  errMsg.value = ''
  const { data, error } = await upsertEntry({ ...form.value })
  saving.value = false
  if (error) { errMsg.value = '儲存失敗：' + error.message; return }
  // 更新本地列表
  if (form.value.id) {
    const idx = entries.value.findIndex(e => e.id === data.id)
    if (idx !== -1) entries.value[idx] = data
  } else {
    entries.value.unshift(data)
  }
  showModal.value = false
}

async function remove(entry) {
  if (!confirm(`確定刪除「${entry.title}」？`)) return
  await deleteEntry(entry.id)
  entries.value = entries.value.filter(e => e.id !== entry.id)
}

async function search() {
  loading.value = true
  const { data } = await fetchEntriesByRange(rangeFrom.value, rangeTo.value)
  entries.value = data
  loading.value = false
}

// 暴露給 Dashboard 使用
defineExpose({ openAdd })

onMounted(search)
</script>
