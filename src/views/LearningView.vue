<template>
  <div class="max-w-2xl mx-auto px-4 pt-6 pb-4">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold text-white">📚 學習書單</h1>
      <button class="btn-primary text-sm" @click="openAdd">+ 新增</button>
    </div>

    <!-- 狀態 tabs -->
    <div class="flex gap-2 mb-3 overflow-x-auto pb-1">
      <button
        v-for="s in statusTabs"
        :key="s"
        class="px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors"
        :class="filterStatus === s ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'"
        @click="filterStatus = s"
      >{{ s }}</button>
    </div>

    <!-- 類別篩選 -->
    <div class="flex gap-2 mb-4 items-center">
      <select v-model="filterCategory" class="input text-sm w-36">
        <option v-for="c in categoryOpts" :key="c">{{ c }}</option>
      </select>
      <span class="text-slate-500 text-sm">共 {{ filtered.length }} 筆</span>
    </div>

    <!-- 載入中 -->
    <div v-if="loading" class="text-slate-400 text-center py-10">載入中…</div>

    <!-- 空狀態 -->
    <div v-else-if="!filtered.length" class="card text-center py-10 text-slate-400">
      <div class="text-4xl mb-3">📖</div>
      <div>還沒有{{ filterStatus === '全部' ? '' : filterStatus }}的項目</div>
    </div>

    <!-- 表格（桌面）/ 卡片列表（手機） -->
    <div v-else>
      <!-- 桌面表格 -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-slate-400 border-b border-slate-700 text-left">
              <th class="pb-2 pr-4">書名／課程</th>
              <th class="pb-2 pr-4">分類</th>
              <th class="pb-2 pr-4">狀態</th>
              <th class="pb-2 pr-4">進度</th>
              <th class="pb-2 pr-4">開始</th>
              <th class="pb-2 pr-4">完成</th>
              <th class="pb-2 pr-4">評分</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in filtered"
              :key="item.id"
              class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
            >
              <td class="py-3 pr-4">
                <div class="font-medium text-slate-100">
                  <a v-if="item.url" :href="item.url" target="_blank" class="hover:text-blue-400">{{ item.title }}</a>
                  <span v-else>{{ item.title }}</span>
                </div>
                <div v-if="item.notes" class="text-xs text-slate-500 truncate max-w-xs">{{ item.notes }}</div>
              </td>
              <td class="py-3 pr-4 text-slate-400 text-xs">{{ item.category }}</td>
              <td class="py-3 pr-4">
                <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="statusClass(item.status)">{{ item.status }}</span>
              </td>
              <td class="py-3 pr-4 w-24">
                <template v-if="item.total_units">
                  <div class="text-xs text-slate-400 mb-1">{{ item.current_unit || 0 }} / {{ item.total_units }}</div>
                  <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div class="h-full bg-blue-500 rounded-full" :style="{ width: progressPct(item) + '%' }"></div>
                  </div>
                </template>
                <span v-else class="text-slate-600">—</span>
              </td>
              <td class="py-3 pr-4 text-slate-400 text-xs">{{ item.start_date || '—' }}</td>
              <td class="py-3 pr-4 text-slate-400 text-xs">{{ item.end_date || '—' }}</td>
              <td class="py-3 pr-4 text-yellow-400 text-xs">{{ item.rating ? '★'.repeat(item.rating) : '—' }}</td>
              <td class="py-3">
                <div class="flex gap-2">
                  <button class="text-blue-400 hover:text-blue-300 text-xs" @click="openEdit(item)">編輯</button>
                  <button class="text-red-400 hover:text-red-300 text-xs" @click="remove(item)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 手機卡片列表 -->
      <div class="md:hidden space-y-3">
        <div v-for="item in filtered" :key="item.id" class="card">
          <div class="flex justify-between items-start mb-2">
            <div class="flex-1 pr-2">
              <a v-if="item.url" :href="item.url" target="_blank" class="font-semibold text-slate-100 hover:text-blue-400">{{ item.title }}</a>
              <div v-else class="font-semibold text-slate-100">{{ item.title }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs text-slate-500">{{ item.category }}</span>
                <span class="px-2 py-0.5 rounded-full text-xs font-medium" :class="statusClass(item.status)">{{ item.status }}</span>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="text-blue-400 text-xs" @click="openEdit(item)">編輯</button>
              <button class="text-red-400 text-xs" @click="remove(item)">刪除</button>
            </div>
          </div>

          <template v-if="item.total_units">
            <div class="flex justify-between text-xs text-slate-400 mb-1">
              <span>進度：{{ item.current_unit || 0 }} / {{ item.total_units }}</span>
              <span>{{ progressPct(item) }}%</span>
            </div>
            <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
              <div class="h-full bg-blue-500 rounded-full" :style="{ width: progressPct(item) + '%' }"></div>
            </div>
          </template>

          <div class="flex gap-4 text-xs text-slate-500">
            <span v-if="item.start_date">開始：{{ item.start_date }}</span>
            <span v-if="item.end_date">完成：{{ item.end_date }}</span>
            <span v-if="item.rating" class="text-yellow-400">{{ '★'.repeat(item.rating) }}</span>
          </div>
          <div v-if="item.notes" class="text-xs text-slate-500 mt-1">{{ item.notes }}</div>
        </div>
      </div>
    </div>

    <!-- 新增/編輯 Bottom Sheet -->
    <Teleport to="body">
      <div v-if="showModal" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showModal = false">
        <div class="bg-slate-800 rounded-t-2xl w-full max-h-[90vh] overflow-y-auto p-5">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ form.id ? '編輯' : '新增' }}項目</h2>
            <button class="text-slate-400 hover:text-white text-xl" @click="showModal = false">×</button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="label">書名／課程名稱 *</label>
              <input v-model="form.title" class="input" placeholder="書名或課程名稱" />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">分類</label>
                <select v-model="form.category" class="input">
                  <option v-for="c in ['書籍','課程','影片','文章']" :key="c">{{ c }}</option>
                </select>
              </div>
              <div>
                <label class="label">狀態</label>
                <select v-model="form.status" class="input">
                  <option v-for="s in ['預覽','進行中','完成','無']" :key="s">{{ s }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">開始日期</label>
                <input type="date" v-model="form.start_date" class="input text-sm" />
              </div>
              <div>
                <label class="label">完成日期</label>
                <input type="date" v-model="form.end_date" class="input text-sm" />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">總頁數／集數</label>
                <input type="number" v-model.number="form.total_units" class="input text-sm" placeholder="選填" min="0" />
              </div>
              <div>
                <label class="label">目前進度</label>
                <input type="number" v-model.number="form.current_unit" class="input text-sm" placeholder="第幾頁/集" min="0" />
              </div>
            </div>

            <div v-if="form.status === '完成'">
              <label class="label">評分</label>
              <div class="flex gap-2">
                <button
                  v-for="n in 5" :key="n"
                  class="text-2xl transition-transform hover:scale-110"
                  :class="(form.rating || 0) >= n ? 'text-yellow-400' : 'text-slate-600'"
                  @click="form.rating = form.rating === n ? null : n"
                >★</button>
              </div>
            </div>

            <div>
              <label class="label">相關連結（URL）</label>
              <input v-model="form.url" class="input text-sm" placeholder="https://..." />
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

const { items, fetchLearningItems, upsertLearningItem, deleteLearningItem } = useLearning()

const statusTabs = ['全部', '進行中', '預覽', '完成', '無']
const categoryOpts = ['全部', '書籍', '課程', '影片', '文章']
const filterStatus = ref('全部')
const filterCategory = ref('全部')
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const errMsg = ref('')

const emptyForm = () => ({
  id: null, title: '', category: '書籍', status: '預覽',
  start_date: '', end_date: '', total_units: null, current_unit: null,
  rating: null, notes: '', url: '',
})
const form = ref(emptyForm())

const filtered = computed(() => items.value.filter(item => {
  const sOk = filterStatus.value === '全部' || item.status === filterStatus.value
  const cOk = filterCategory.value === '全部' || item.category === filterCategory.value
  return sOk && cOk
}))

function progressPct(item) {
  if (!item.total_units || !item.current_unit) return 0
  return Math.min(100, Math.round((item.current_unit / item.total_units) * 100))
}

function statusClass(status) {
  return {
    '進行中': 'bg-green-900 text-green-300',
    '預覽':   'bg-blue-900 text-blue-300',
    '完成':   'bg-slate-700 text-slate-300',
    '無':     'bg-slate-800 text-slate-500',
  }[status] || 'bg-slate-700 text-slate-400'
}

function openAdd() {
  form.value = emptyForm()
  errMsg.value = ''
  showModal.value = true
}

function openEdit(item) {
  form.value = { ...item }
  errMsg.value = ''
  showModal.value = true
}

async function save() {
  if (!form.value.title.trim()) return
  saving.value = true
  errMsg.value = ''
  const { error } = await upsertLearningItem({ ...form.value })
  saving.value = false
  if (error) { errMsg.value = '儲存失敗：' + error.message; return }
  showModal.value = false
}

async function remove(item) {
  if (!confirm(`確定刪除「${item.title}」？`)) return
  await deleteLearningItem(item.id)
}

onMounted(async () => {
  await fetchLearningItems()
  loading.value = false
})
</script>
