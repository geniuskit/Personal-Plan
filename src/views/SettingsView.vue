<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-4">
    <h1 class="text-xl font-bold text-white mb-5">設定</h1>

    <!-- 連線狀態 -->
    <div class="card mb-5 flex items-center gap-3">
      <div class="w-2 h-2 rounded-full" :class="connected ? 'bg-green-400' : 'bg-red-400'"></div>
      <div>
        <div class="text-sm font-medium text-slate-200">Supabase 連線</div>
        <div class="text-xs text-slate-400">{{ connected ? '已連線' : '未連線（請設定 .env）' }}</div>
      </div>
    </div>

    <!-- 活動項目管理 -->
    <div class="card mb-5">
      <div class="flex justify-between items-center mb-4">
        <h2 class="font-semibold text-slate-200">活動項目</h2>
        <button class="btn-primary text-sm" @click="showAdd = true">+ 新增</button>
      </div>

      <div v-if="loading" class="text-slate-400 text-sm text-center py-4">載入中…</div>

      <div v-else class="space-y-2">
        <div
          v-for="(act, idx) in activities"
          :key="act.id"
          class="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2"
        >
          <div class="flex flex-col gap-0.5 mr-1">
            <button :disabled="idx === 0" class="text-slate-500 hover:text-white disabled:opacity-30 text-xs leading-none" @click="moveUp(idx)">▲</button>
            <button :disabled="idx === activities.length - 1" class="text-slate-500 hover:text-white disabled:opacity-30 text-xs leading-none" @click="moveDown(idx)">▼</button>
          </div>
          <template v-if="editId === act.id">
            <input v-model="editName" class="input text-sm flex-1" @keydown.enter="saveEdit(act)" @keydown.esc="editId = null" />
            <select v-model="editUnit" class="input text-sm w-20">
              <option>hr</option><option>min</option><option>次</option><option>km</option><option>組</option>
            </select>
            <button class="text-green-400 hover:text-green-300 text-sm" @click="saveEdit(act)">✓</button>
            <button class="text-slate-500 hover:text-white text-sm" @click="editId = null">✗</button>
          </template>
          <template v-else>
            <span class="flex-1 text-slate-100">{{ act.name }}</span>
            <span class="text-xs text-slate-400">{{ act.default_unit }}</span>
            <button class="text-blue-400 hover:text-blue-300 text-sm px-1" @click="startEdit(act)">編輯</button>
            <button class="text-red-400 hover:text-red-300 text-sm px-1" @click="remove(act)">刪除</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 新增活動 modal -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-6" @click.self="showAdd = false">
      <div class="bg-slate-800 rounded-xl p-5 w-full max-w-sm">
        <h3 class="font-semibold text-white mb-4">新增活動項目</h3>
        <div class="mb-3">
          <label class="label">名稱</label>
          <input v-model="newName" class="input" placeholder="如：跑步" autofocus />
        </div>
        <div class="mb-4">
          <label class="label">預設單位</label>
          <select v-model="newUnit" class="input">
            <option>hr</option><option>min</option><option>次</option><option>km</option><option>組</option>
          </select>
        </div>
        <div class="flex gap-3">
          <button class="btn-primary flex-1" @click="add">新增</button>
          <button class="btn-secondary" @click="showAdd = false">取消</button>
        </div>
      </div>
    </div>

    <!-- 關於 -->
    <div class="card text-xs text-slate-500">
      <div class="mb-1 font-medium text-slate-400">使用說明</div>
      <ol class="list-decimal list-inside space-y-1 leading-relaxed">
        <li>在 Supabase 建立專案並執行 SQL schema</li>
        <li>複製 <code class="bg-slate-700 px-1 rounded">.env.example</code> 為 <code class="bg-slate-700 px-1 rounded">.env</code>，填入你的 URL 與 Key</li>
        <li>於 GitHub repo → Settings → Secrets 加入同名環境變數，push 後自動部署</li>
      </ol>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useActivities } from '../composables/useActivities'
import { supabase } from '../lib/supabase'

const { activities, loaded, fetchActivities, addActivity, updateActivity, deleteActivity, reorderActivities } = useActivities()
const loading = ref(true)
const connected = ref(false)

const showAdd = ref(false)
const newName = ref('')
const newUnit = ref('hr')
const editId = ref(null)
const editName = ref('')
const editUnit = ref('hr')

onMounted(async () => {
  await fetchActivities()
  loading.value = false
  try {
    const { error } = await supabase.from('activity_templates').select('id').limit(1)
    connected.value = !error
  } catch { connected.value = false }
})

async function add() {
  if (!newName.value.trim()) return
  await addActivity(newName.value.trim(), newUnit.value)
  newName.value = ''
  showAdd.value = false
}

function startEdit(act) {
  editId.value = act.id
  editName.value = act.name
  editUnit.value = act.default_unit
}

async function saveEdit(act) {
  await updateActivity(act.id, { name: editName.value, default_unit: editUnit.value })
  editId.value = null
}

async function remove(act) {
  if (!confirm(`確定刪除「${act.name}」？相關歷史記錄也會消失。`)) return
  await deleteActivity(act.id)
}

async function moveUp(idx) {
  if (idx === 0) return
  const ids = activities.value.map(a => a.id)
  ;[ids[idx - 1], ids[idx]] = [ids[idx], ids[idx - 1]]
  await reorderActivities(ids)
}

async function moveDown(idx) {
  if (idx === activities.value.length - 1) return
  const ids = activities.value.map(a => a.id)
  ;[ids[idx], ids[idx + 1]] = [ids[idx + 1], ids[idx]]
  await reorderActivities(ids)
}
</script>
