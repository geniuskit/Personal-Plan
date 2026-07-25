<template>
  <div class="pb-4">
    <PmSubNav />
    <div class="max-w-3xl mx-auto px-4 pt-2">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold text-white">🗂 專案維護</h1>
        <button class="btn-primary text-sm" @click="openAddProject()">+ 新增專案</button>
      </div>

      <div v-if="loading" class="text-slate-400 text-center py-8">載入中…</div>

      <div v-else class="space-y-6">
        <div v-for="grp in statusGroups" :key="grp.v">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-xs px-2 py-0.5 rounded-full" :class="grp.cls">{{ grp.label }}</span>
            <span class="text-xs text-slate-500">{{ grp.projects.length }}</span>
          </div>
          <div v-if="grp.projects.length" class="space-y-2">
            <div v-for="p in grp.projects" :key="p.id" class="card">
              <div class="flex items-start gap-2">
                <button class="text-slate-400 text-lg leading-none mt-0.5 w-5" @click="toggleReviews(p)">
                  {{ openProject === p.id ? '−' : '+' }}
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-slate-100">{{ p.name }}</span>
                    <span class="text-xs text-slate-500">{{ catName(p.category_id) }}</span>
                  </div>
                  <div class="flex items-center gap-x-3 gap-y-1 flex-wrap mt-1 text-xs text-slate-400">
                    <span>⏱ {{ formatHr(totalMinutes(p)) }}</span>
                    <span v-if="projectProgress(p).total">進度 {{ projectProgress(p).done }}/{{ projectProgress(p).total }}</span>
                    <span v-if="p.deadline_days">期限 {{ p.deadline_days }} 天</span>
                    <span v-if="p.daily_min_unit">目標 {{ p.daily_min_unit.split('\n')[0] }}</span>
                  </div>
                </div>
                <button class="text-blue-400 hover:text-blue-300 text-xs px-1" @click="openEditProject(p)">編輯</button>
                <button class="text-red-400 hover:text-red-300 text-xs px-1" @click="removeProject(p)">刪除</button>
              </div>

              <!-- 檢討 -->
              <div v-if="openProject === p.id" class="mt-3 pl-7">
                <div class="flex items-center justify-between mb-1">
                  <span class="label mb-0">📋 檢討 Review</span>
                  <button class="text-blue-400 hover:text-blue-300 text-xs" @click="openAddReview(p)">+ 新增</button>
                </div>
                <div v-if="reviewsLoading" class="text-slate-500 text-xs">載入中…</div>
                <div v-else-if="!(reviews[p.id] || []).length" class="text-slate-500 text-xs">尚無檢討紀錄</div>
                <div v-else class="space-y-1">
                  <div v-for="r in reviews[p.id]" :key="r.id" class="bg-slate-700/50 rounded-lg px-2 py-1.5 text-xs">
                    <div class="flex items-center gap-2">
                      <span class="text-slate-300">{{ r.review_date || '無日期' }}</span>
                      <span v-if="r.next_review_date" class="text-slate-500">下次 {{ r.next_review_date }}</span>
                      <button class="ml-auto text-blue-400 hover:text-blue-300" @click="openEditReview(p, r)">編輯</button>
                      <button class="text-red-400 hover:text-red-300" @click="removeReview(p, r)">刪除</button>
                    </div>
                    <div v-if="r.content" class="text-slate-300 mt-1"><span class="text-slate-500">內容：</span>{{ r.content }}</div>
                    <div v-if="r.core_result" class="text-slate-300 mt-0.5"><span class="text-slate-500">核心結果：</span>{{ r.core_result }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-slate-600 text-xs pl-1">—</div>
        </div>
      </div>
    </div>

    <!-- 專案 modal -->
    <Teleport to="body">
      <div v-if="showProject" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showProject = false">
        <div class="bg-slate-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5 max-w-2xl mx-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ pForm.id ? '編輯' : '新增' }}專案</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showProject = false">×</button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="label">專案名稱 *</label>
              <input v-model="pForm.name" class="input" placeholder="如：英文文法" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">分類</label>
                <select v-model="pForm.category_id" class="input">
                  <option :value="null">未分類</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
              </div>
              <div>
                <label class="label">狀態</label>
                <select v-model.number="pForm.status" class="input">
                  <option v-for="s in PROJECT_STATUS" :key="s.v" :value="s.v">{{ s.label }}</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">期限天數</label>
                <input type="number" v-model.number="pForm.deadline_days" class="input" min="0" />
              </div>
              <div>
                <label class="label">每日最小單位</label>
                <input v-model="pForm.daily_min_unit" class="input" placeholder=">1hr" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">專案開始日</label>
                <input type="date" v-model="pForm.start_date" class="input" />
              </div>
              <div>
                <label class="label">專案完成日</label>
                <input type="date" v-model="pForm.end_date" class="input" />
              </div>
            </div>
            <div>
              <label class="label">說明</label>
              <textarea v-model="pForm.description" class="input resize-none text-sm" rows="2" />
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="!pForm.name.trim() || saving" @click="saveProject">儲存</button>
            <button class="btn-secondary" @click="showProject = false">取消</button>
          </div>
          <div v-if="errMsg" class="text-red-400 text-sm text-center mt-2">{{ errMsg }}</div>
        </div>
      </div>
    </Teleport>

    <!-- 檢討 modal -->
    <Teleport to="body">
      <div v-if="showReview" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showReview = false">
        <div class="bg-slate-800 rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-5 max-w-2xl mx-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ rForm.id ? '編輯' : '新增' }}檢討</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showReview = false">×</button>
          </div>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Review 日期</label>
                <input type="date" v-model="rForm.review_date" class="input" />
              </div>
              <div>
                <label class="label">預計下次日期</label>
                <input type="date" v-model="rForm.next_review_date" class="input" />
              </div>
            </div>
            <div>
              <label class="label">Review 內容</label>
              <textarea v-model="rForm.content" class="input resize-none text-sm" rows="3" />
            </div>
            <div>
              <label class="label">我想達成的核心結果</label>
              <textarea v-model="rForm.core_result" class="input resize-none text-sm" rows="2" />
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="saving" @click="saveReview">儲存</button>
            <button class="btn-secondary" @click="showReview = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PmSubNav from '../components/PmSubNav.vue'
import {
  usePmProjects, PROJECT_STATUS,
  totalMinutes, projectProgress, formatHr,
} from '../composables/usePmProjects'
import { usePmReviews } from '../composables/usePmReviews'

const { fetchCategories, fetchProjectsFull, upsertProject, deleteProject } = usePmProjects()
const { fetchReviews, upsertReview, deleteReview } = usePmReviews()

const loading = ref(true)
const saving = ref(false)
const errMsg = ref('')
const categories = ref([])
const projects = ref([])

const statusGroups = computed(() => PROJECT_STATUS.map(s => ({
  ...s,
  projects: projects.value.filter(p => Number(p.status) === s.v),
})))

function catName(id) {
  return categories.value.find(c => c.id === id)?.name || '未分類'
}

async function load() {
  const [{ data: cats }, { data: projs }] = await Promise.all([fetchCategories(), fetchProjectsFull()])
  categories.value = cats
  projects.value = projs
  loading.value = false
}

// ── 專案 ──
const showProject = ref(false)
const emptyProject = () => ({
  id: null, category_id: categories.value[0]?.id || null, name: '',
  deadline_days: null, daily_min_unit: '', description: '',
  start_date: '', end_date: '', status: 0,
})
const pForm = ref(emptyProject())
function openAddProject() { pForm.value = emptyProject(); errMsg.value = ''; showProject.value = true }
function openEditProject(p) {
  pForm.value = {
    id: p.id, category_id: p.category_id, name: p.name,
    deadline_days: p.deadline_days, daily_min_unit: p.daily_min_unit || '',
    description: p.description || '', start_date: p.start_date || '', end_date: p.end_date || '',
    status: p.status,
  }
  errMsg.value = ''; showProject.value = true
}
async function saveProject() {
  if (!pForm.value.name.trim()) return
  saving.value = true; errMsg.value = ''
  const payload = {
    ...pForm.value,
    name: pForm.value.name.trim(),
    deadline_days: pForm.value.deadline_days || null,
    daily_min_unit: pForm.value.daily_min_unit || null,
    description: pForm.value.description || null,
    start_date: pForm.value.start_date || null,
    end_date: pForm.value.end_date || null,
  }
  const { error } = await upsertProject(payload)
  saving.value = false
  if (error) { errMsg.value = '儲存失敗：' + error.message; return }
  showProject.value = false
  await load()
}
async function removeProject(p) {
  if (!confirm(`確定刪除專案「${p.name}」？其歷程、階段、檢討都會一併刪除。`)) return
  await deleteProject(p.id)
  await load()
}

// ── 檢討 ──
const openProject = ref(null)
const reviews = ref({})
const reviewsLoading = ref(false)
async function toggleReviews(p) {
  if (openProject.value === p.id) { openProject.value = null; return }
  openProject.value = p.id
  if (!reviews.value[p.id]) {
    reviewsLoading.value = true
    const { data } = await fetchReviews(p.id)
    reviews.value = { ...reviews.value, [p.id]: data }
    reviewsLoading.value = false
  }
}

const showReview = ref(false)
const rForm = ref({ id: null, project_id: null, review_date: '', next_review_date: '', content: '', core_result: '' })
function openAddReview(p) {
  rForm.value = { id: null, project_id: p.id, review_date: '', next_review_date: '', content: '', core_result: '' }
  showReview.value = true
}
function openEditReview(p, r) {
  rForm.value = {
    id: r.id, project_id: p.id, review_date: r.review_date || '', next_review_date: r.next_review_date || '',
    content: r.content || '', core_result: r.core_result || '',
  }
  showReview.value = true
}
async function saveReview() {
  saving.value = true
  const payload = {
    id: rForm.value.id, project_id: rForm.value.project_id,
    review_date: rForm.value.review_date || null,
    next_review_date: rForm.value.next_review_date || null,
    content: rForm.value.content || null,
    core_result: rForm.value.core_result || null,
  }
  await upsertReview(payload)
  saving.value = false
  showReview.value = false
  const { data } = await fetchReviews(rForm.value.project_id)
  reviews.value = { ...reviews.value, [rForm.value.project_id]: data }
}
async function removeReview(p, r) {
  if (!confirm('確定刪除這筆檢討？')) return
  await deleteReview(r.id)
  reviews.value = { ...reviews.value, [p.id]: (reviews.value[p.id] || []).filter(x => x.id !== r.id) }
}

onMounted(load)
</script>
