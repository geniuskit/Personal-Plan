<template>
  <div class="pb-4">
    <PmSubNav />
    <div class="max-w-lg mx-auto px-4 pt-2">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-bold text-white">🏷 分類管理</h1>
        <button class="btn-primary text-sm" @click="showAdd = true">+ 新增</button>
      </div>

      <div v-if="loading" class="text-slate-400 text-sm text-center py-6">載入中…</div>

      <div v-else class="space-y-2">
        <div
          v-for="(c, idx) in categories" :key="c.id"
          class="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2"
        >
          <div class="flex flex-col gap-0.5 mr-1">
            <button :disabled="idx === 0" class="text-slate-500 hover:text-white disabled:opacity-30 text-xs leading-none" @click="move(idx, -1)">▲</button>
            <button :disabled="idx === categories.length - 1" class="text-slate-500 hover:text-white disabled:opacity-30 text-xs leading-none" @click="move(idx, 1)">▼</button>
          </div>
          <template v-if="editId === c.id">
            <input v-model="editName" class="input text-sm flex-1" @keydown.enter="saveEdit(c)" @keydown.esc="editId = null" />
            <button class="text-green-400 hover:text-green-300 text-sm" @click="saveEdit(c)">✓</button>
            <button class="text-slate-500 hover:text-white text-sm" @click="editId = null">✗</button>
          </template>
          <template v-else>
            <span class="flex-1 text-slate-100">{{ c.name }}</span>
            <button class="text-blue-400 hover:text-blue-300 text-sm px-1" @click="startEdit(c)">編輯</button>
            <button class="text-red-400 hover:text-red-300 text-sm px-1" @click="remove(c)">刪除</button>
          </template>
        </div>
        <div v-if="!categories.length" class="text-slate-500 text-sm text-center py-6">尚無分類</div>
      </div>

      <p class="text-xs text-slate-500 mt-4">刪除分類不會刪除其專案，僅將其專案改為「未分類」。</p>
    </div>

    <!-- 新增 modal -->
    <div v-if="showAdd" class="fixed inset-0 bg-black/60 flex items-end justify-center z-50 px-4 pb-6" @click.self="showAdd = false">
      <div class="bg-slate-800 rounded-xl p-5 w-full max-w-sm">
        <h3 class="font-semibold text-white mb-4">新增分類</h3>
        <input v-model="newName" class="input mb-4" placeholder="如：語言、投資…" @keydown.enter="add" />
        <div class="flex gap-3">
          <button class="btn-primary flex-1" :disabled="!newName.trim()" @click="add">新增</button>
          <button class="btn-secondary" @click="showAdd = false">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PmSubNav from '../components/PmSubNav.vue'
import { usePmProjects } from '../composables/usePmProjects'

const { fetchCategories, addCategory, updateCategory, deleteCategory, reorderCategories } = usePmProjects()
const loading = ref(true)
const categories = ref([])
const showAdd = ref(false)
const newName = ref('')
const editId = ref(null)
const editName = ref('')

async function load() {
  const { data } = await fetchCategories()
  categories.value = data
  loading.value = false
}

async function add() {
  if (!newName.value.trim()) return
  const { data } = await addCategory(newName.value.trim(), categories.value.length)
  if (data) categories.value.push(data)
  newName.value = ''
  showAdd.value = false
}

function startEdit(c) {
  editId.value = c.id
  editName.value = c.name
}
async function saveEdit(c) {
  const name = editName.value.trim()
  if (name) {
    await updateCategory(c.id, { name })
    c.name = name
  }
  editId.value = null
}

async function remove(c) {
  if (!confirm(`確定刪除分類「${c.name}」？其專案會變成未分類。`)) return
  await deleteCategory(c.id)
  categories.value = categories.value.filter(x => x.id !== c.id)
}

async function move(idx, dir) {
  const j = idx + dir
  if (j < 0 || j >= categories.value.length) return
  const arr = categories.value
  ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
  await reorderCategories(arr.map(c => c.id))
}

onMounted(load)
</script>
