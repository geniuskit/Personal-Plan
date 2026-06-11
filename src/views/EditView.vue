<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-4">
    <div class="flex items-center gap-3 mb-6">
      <router-link to="/" class="text-slate-400 hover:text-white text-xl">←</router-link>
      <div class="flex-1">
        <h1 class="text-xl font-bold text-white">{{ isNew ? '新增記錄' : '編輯記錄' }}</h1>
        <input type="date" v-model="date" class="input text-sm mt-1" :max="maxDate" />
      </div>
    </div>

    <div v-if="loading" class="text-center text-slate-400 py-10">載入中…</div>

    <template v-else>
      <!-- 重點項目順序 -->
      <div class="card mb-4">
        <label class="label">重點項目順序（如：工作&gt;有氧&gt;學習&gt;閱讀）</label>
        <input v-model="priorityOrder" class="input" placeholder="工作>有氧>學習>閱讀" />
      </div>

      <!-- 活動表單 -->
      <div class="space-y-3 mb-4">
        <ActivityForm
          v-for="act in activities"
          :key="act.id"
          :activity="act"
          v-model="forms[act.id]"
        />
      </div>

      <!-- 備註 -->
      <div class="card mb-4">
        <label class="label">備註</label>
        <textarea v-model="notes" class="input resize-none" rows="3" placeholder="今天的心得或備忘…" />
      </div>

      <!-- 操作按鈕 -->
      <div class="flex gap-3">
        <button class="btn-primary flex-1" :disabled="saving" @click="save">
          {{ saving ? '儲存中…' : '儲存' }}
        </button>
        <button v-if="!isNew" class="btn-danger" @click="confirmDelete">刪除</button>
      </div>

      <div v-if="errorMsg" class="mt-3 text-red-400 text-sm text-center">{{ errorMsg }}</div>
      <div v-if="successMsg" class="mt-3 text-green-400 text-sm text-center">{{ successMsg }}</div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ActivityForm from '../components/ActivityForm.vue'
import { useActivities } from '../composables/useActivities'
import { useRecords } from '../composables/useRecords'

const route = useRoute()
const router = useRouter()
const { activities, fetchActivities } = useActivities()
const { fetchRecord, upsertRecord, upsertActivityRecord, deleteRecord } = useRecords()

const date = ref(route.params.date || new Date().toISOString().slice(0, 10))
const maxDate = new Date().toISOString().slice(0, 10)
const priorityOrder = ref('')
const notes = ref('')
const forms = reactive({})
const loading = ref(true)
const saving = ref(false)
const isNew = ref(true)
const errorMsg = ref('')
const successMsg = ref('')

function initForms() {
  activities.value.forEach(act => {
    if (!forms[act.id]) {
      forms[act.id] = {
        can_do: null,
        high_target: '',
        mid_target: '',
        low_target: '',
        actual_result: '',
        unit: act.default_unit || 'hr',
      }
    }
  })
}

async function loadRecord() {
  loading.value = true
  await fetchActivities()
  initForms()
  const { data } = await fetchRecord(date.value)
  if (data) {
    isNew.value = false
    priorityOrder.value = data.priority_order || ''
    notes.value = data.notes || ''
    data.activity_records?.forEach(rec => {
      forms[rec.activity_id] = {
        can_do: rec.can_do,
        high_target: rec.high_target || '',
        mid_target: rec.mid_target || '',
        low_target: rec.low_target || '',
        actual_result: rec.actual_result || '',
        unit: rec.unit || 'hr',
      }
    })
  } else {
    isNew.value = true
  }
  loading.value = false
}

onMounted(loadRecord)
watch(date, loadRecord)

async function save() {
  saving.value = true
  errorMsg.value = ''
  successMsg.value = ''

  const { data: daily, error: e1 } = await upsertRecord(date.value, {
    priority_order: priorityOrder.value,
    notes: notes.value,
  })

  if (e1) { errorMsg.value = '儲存失敗：' + e1.message; saving.value = false; return }

  for (const act of activities.value) {
    const f = forms[act.id]
    if (f.can_do === null) continue
    await upsertActivityRecord(daily.id, act.id, {
      can_do: f.can_do,
      high_target: f.high_target,
      mid_target: f.mid_target,
      low_target: f.low_target,
      actual_result: f.actual_result,
      unit: f.unit,
    })
  }

  saving.value = false
  successMsg.value = '已儲存 ✓'
  isNew.value = false
  setTimeout(() => router.push('/'), 800)
}

async function confirmDelete() {
  if (!confirm(`確定刪除 ${date.value} 的全部記錄？`)) return
  await deleteRecord(date.value)
  router.push('/')
}
</script>
