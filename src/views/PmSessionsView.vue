<template>
  <div class="pb-4">
    <PmSubNav />
    <div class="max-w-3xl mx-auto px-4 pt-2">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-bold text-white">🧩 階段管理</h1>
        <button class="btn-primary text-sm" :disabled="!projectId" @click="openAddSession()">+ 新增階段</button>
      </div>

      <PmProjectPicker v-model="projectId" />

      <div v-if="!projectId" class="card text-center py-10 text-slate-400">請先選擇專案</div>

      <template v-else>
        <div v-if="loading" class="text-slate-400 text-center py-8">載入中…</div>
        <div v-else-if="!sessions.length" class="card text-center py-8 text-slate-400">尚無階段，點右上角新增</div>
        <div v-else class="space-y-2">
          <PmSessionBlock
            v-for="s in sessions" :key="s.id" :session="s"
            @edit-session="openEditSession"
            @delete-session="removeSession"
            @add-detail="openAddDetail"
            @edit-detail="openEditDetail"
            @delete-detail="removeDetail"
          />
        </div>
      </template>
    </div>

    <!-- 階段 modal -->
    <Teleport to="body">
      <div v-if="showSession" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showSession = false">
        <div class="bg-slate-800 rounded-t-2xl w-full p-5 max-w-2xl mx-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ sForm.id ? '編輯' : '新增' }}階段</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showSession = false">×</button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="label">階段名稱 *</label>
              <input v-model="sForm.name" class="input" placeholder="如：動詞時態、平台評估" />
            </div>
            <div>
              <label class="label">狀態</label>
              <select v-model.number="sForm.status" class="input">
                <option v-for="s in SESSION_STATUS" :key="s.v" :value="s.v">{{ s.label }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="!sForm.name.trim() || saving" @click="saveSession">儲存</button>
            <button class="btn-secondary" @click="showSession = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 細項 modal -->
    <Teleport to="body">
      <div v-if="showDetail" class="fixed inset-0 bg-black/60 z-50 flex items-end" @click.self="showDetail = false">
        <div class="bg-slate-800 rounded-t-2xl w-full p-5 max-w-2xl mx-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="font-semibold text-white">{{ dForm.id ? '編輯' : '新增' }}細項</h2>
            <button class="text-slate-400 hover:text-white text-2xl leading-none" @click="showDetail = false">×</button>
          </div>
          <div class="space-y-3">
            <div>
              <label class="label">細項名稱</label>
              <input v-model="dForm.detail_name" class="input" placeholder="如：ooo1、錯題複習" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">開始日期</label>
                <input type="date" v-model="dForm.start_date" class="input" />
              </div>
              <div>
                <label class="label">完成日期</label>
                <input type="date" v-model="dForm.end_date" class="input" />
              </div>
            </div>
            <div>
              <label class="label">狀態</label>
              <select v-model.number="dForm.status" class="input">
                <option v-for="s in SESSION_STATUS" :key="s.v" :value="s.v">{{ s.label }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-3 mt-5">
            <button class="btn-primary flex-1" :disabled="saving" @click="saveDetail">儲存</button>
            <button class="btn-secondary" @click="showDetail = false">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import PmSubNav from '../components/PmSubNav.vue'
import PmProjectPicker from '../components/PmProjectPicker.vue'
import PmSessionBlock from '../components/PmSessionBlock.vue'
import { usePmSessions } from '../composables/usePmSessions'
import { SESSION_STATUS } from '../composables/usePmProjects'

const {
  fetchSessions, addSession, updateSession, deleteSession,
  addDetail, updateDetail, deleteDetail,
} = usePmSessions()

const projectId = ref('')
const loading = ref(false)
const saving = ref(false)
const sessions = ref([])

watch(projectId, load, { immediate: true })

async function load() {
  if (!projectId.value) { sessions.value = []; return }
  loading.value = true
  const { data } = await fetchSessions(projectId.value)
  sessions.value = data
  loading.value = false
}

// ── 階段 ──
const showSession = ref(false)
const sForm = ref({ id: null, name: '', status: 0 })
function openAddSession() {
  sForm.value = { id: null, name: '', status: 1 }
  showSession.value = true
}
function openEditSession(s) {
  sForm.value = { id: s.id, name: s.name, status: s.status }
  showSession.value = true
}
async function saveSession() {
  if (!sForm.value.name.trim()) return
  saving.value = true
  if (sForm.value.id) {
    await updateSession(sForm.value.id, { name: sForm.value.name.trim(), status: sForm.value.status })
  } else {
    await addSession(projectId.value, sForm.value.name.trim(), sessions.value.length, sForm.value.status)
  }
  saving.value = false
  showSession.value = false
  await load()
}
async function removeSession(s) {
  if (!confirm(`確定刪除階段「${s.name}」？其細項也會一併刪除。`)) return
  await deleteSession(s.id)
  await load()
}

// ── 細項 ──
const showDetail = ref(false)
const dForm = ref({ id: null, session_id: null, detail_name: '', start_date: '', end_date: '', status: 0 })
function openAddDetail(s) {
  dForm.value = { id: null, session_id: s.id, detail_name: '', start_date: '', end_date: '', status: 0 }
  showDetail.value = true
}
function openEditDetail(s, d) {
  dForm.value = {
    id: d.id, session_id: s.id, detail_name: d.detail_name || '',
    start_date: d.start_date || '', end_date: d.end_date || '', status: d.status,
  }
  showDetail.value = true
}
async function saveDetail() {
  saving.value = true
  const fields = {
    detail_name: dForm.value.detail_name || null,
    start_date: dForm.value.start_date || null,
    end_date: dForm.value.end_date || null,
    status: dForm.value.status,
  }
  if (dForm.value.id) {
    await updateDetail(dForm.value.id, fields)
  } else {
    const target = sessions.value.find(s => s.id === dForm.value.session_id)
    const order = target ? (target.pm_session_details || []).length : 0
    await addDetail(dForm.value.session_id, fields, order)
  }
  saving.value = false
  showDetail.value = false
  await load()
}
async function removeDetail(d) {
  if (!confirm('確定刪除這個細項？')) return
  await deleteDetail(d.id)
  await load()
}
</script>
