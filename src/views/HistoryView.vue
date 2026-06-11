<template>
  <div class="max-w-lg mx-auto px-4 pt-6 pb-4">
    <h1 class="text-xl font-bold text-white mb-5">歷史記錄</h1>

    <!-- 日曆 -->
    <div class="card mb-5">
      <MiniCalendar
        :marked-dates="markedDates"
        :selected="selectedDate"
        @select="onSelectDate"
        @month-change="onMonthChange"
      />
    </div>

    <!-- 日期範圍搜尋 -->
    <div class="card mb-5">
      <div class="label mb-2">日期範圍搜尋</div>
      <div class="flex gap-2 items-center">
        <input type="date" v-model="rangeFrom" class="input text-sm flex-1" />
        <span class="text-slate-500">～</span>
        <input type="date" v-model="rangeTo" class="input text-sm flex-1" />
        <button class="btn-primary text-sm whitespace-nowrap" @click="search">搜尋</button>
      </div>
    </div>

    <!-- 選取單日詳情 -->
    <div v-if="selectedDate && selectedRecord" class="mb-5">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-slate-200">{{ selectedDate }}</h2>
        <router-link :to="`/edit/${selectedDate}`" class="text-blue-400 text-sm hover:underline">編輯</router-link>
      </div>
      <div v-if="selectedRecord.priority_order" class="card mb-3">
        <div class="label">重點項目順序</div>
        <div class="text-slate-100">{{ selectedRecord.priority_order }}</div>
      </div>
      <div class="space-y-2">
        <ActivityCard v-for="rec in sortedSelectedRecs" :key="rec.id" :rec="rec" />
      </div>
    </div>
    <div v-else-if="selectedDate && selectedRecord === null && !calendarLoading" class="card text-center text-slate-400 mb-5 py-6">
      {{ selectedDate }} 無記錄
      <br />
      <router-link :to="`/edit/${selectedDate}`" class="text-blue-400 text-sm mt-2 inline-block">+ 新增這天的記錄</router-link>
    </div>

    <!-- 搜尋結果列表 -->
    <div v-if="searchResults.length">
      <h2 class="font-semibold text-slate-300 mb-3">搜尋結果（{{ searchResults.length }} 天）</h2>
      <div class="space-y-4">
        <div v-for="r in searchResults" :key="r.id" class="card">
          <div class="flex justify-between items-center mb-2">
            <span class="font-medium text-blue-300">{{ r.record_date }}</span>
            <router-link :to="`/edit/${r.record_date}`" class="text-slate-400 text-xs hover:text-blue-400">編輯</router-link>
          </div>
          <div v-if="r.priority_order" class="text-xs text-slate-400 mb-2">{{ r.priority_order }}</div>
          <div class="grid grid-cols-2 gap-2">
            <div v-for="rec in r.activity_records" :key="rec.id" class="text-xs flex justify-between bg-slate-700 rounded px-2 py-1">
              <span :class="rec.can_do ? 'text-slate-200' : 'text-slate-500'">{{ rec.activity_templates?.name }}</span>
              <span class="text-slate-400">{{ rec.actual_result ? rec.actual_result + ' ' + rec.unit : (rec.can_do ? '—' : '✗') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 月完成率統計 -->
    <div v-if="monthStats.length" class="card mt-5">
      <div class="label mb-3">本月各活動達成率</div>
      <div v-for="s in monthStats" :key="s.name" class="mb-2">
        <div class="flex justify-between text-xs mb-1">
          <span class="text-slate-300">{{ s.name }}</span>
          <span class="text-slate-400">{{ s.rate }}%</span>
        </div>
        <div class="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div class="h-full bg-blue-500 rounded-full" :style="{ width: s.rate + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import MiniCalendar from '../components/MiniCalendar.vue'
import ActivityCard from '../components/ActivityCard.vue'
import { useRecords } from '../composables/useRecords'

const { fetchDatesWithRecords, fetchRecord, fetchRecordsByRange } = useRecords()

const markedDates = ref([])
const selectedDate = ref('')
const selectedRecord = ref(undefined)
const calendarLoading = ref(false)
const rangeFrom = ref('')
const rangeTo = ref('')
const searchResults = ref([])
const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth() + 1)

async function onMonthChange({ year, month }) {
  currentYear.value = year
  currentMonth.value = month
  const { dates } = await fetchDatesWithRecords(year, month)
  markedDates.value = dates
  loadMonthStats(year, month)
}

async function onSelectDate(date) {
  selectedDate.value = date
  calendarLoading.value = true
  searchResults.value = []
  const { data } = await fetchRecord(date)
  selectedRecord.value = data || null
  calendarLoading.value = false
}

async function search() {
  if (!rangeFrom.value || !rangeTo.value) return
  selectedDate.value = ''
  const { data } = await fetchRecordsByRange(rangeFrom.value, rangeTo.value)
  searchResults.value = data
}

const sortedSelectedRecs = computed(() => {
  if (!selectedRecord.value?.activity_records) return []
  return [...selectedRecord.value.activity_records].sort(
    (a, b) => (a.activity_templates?.sort_order || 0) - (b.activity_templates?.sort_order || 0)
  )
})

const monthStats = ref([])
async function loadMonthStats(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const to = `${year}-${String(month).padStart(2, '0')}-${lastDay}`
  const { data } = await fetchRecordsByRange(from, to)
  if (!data || !data.length) { monthStats.value = []; return }

  const statMap = {}
  for (const r of data) {
    for (const rec of (r.activity_records || [])) {
      const name = rec.activity_templates?.name
      if (!name) continue
      if (!statMap[name]) statMap[name] = { total: 0, achieved: 0 }
      if (rec.can_do) {
        statMap[name].total++
        const actual = parseFloat(rec.actual_result)
        const low = parseFloat((rec.low_target || '').replace(/[^0-9.]/g, ''))
        if (!isNaN(actual) && !isNaN(low) && actual >= low) statMap[name].achieved++
      }
    }
  }
  monthStats.value = Object.entries(statMap)
    .filter(([, v]) => v.total > 0)
    .map(([name, v]) => ({ name, rate: Math.round((v.achieved / v.total) * 100) }))
}

onMounted(() => {
  const today = new Date().toISOString().slice(0, 10)
  rangeFrom.value = today.slice(0, 8) + '01'
  rangeTo.value = today
})
</script>
