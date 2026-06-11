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
      <ActivityCard
        v-for="rec in sortedRecs"
        :key="rec.id"
        :rec="rec"
      />
      <div v-if="record.notes" class="card">
        <div class="label">備註</div>
        <div class="text-slate-300 text-sm whitespace-pre-wrap">{{ record.notes }}</div>
      </div>
    </div>

    <!-- 📚 進行中書單專區 -->
    <div class="mb-4">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-slate-300 flex items-center gap-1">
          📚 進行中
        </h2>
        <router-link to="/learning" class="text-blue-400 text-xs hover:underline">管理書單 →</router-link>
      </div>

      <div v-if="loadingLearning" class="text-slate-500 text-sm text-center py-3">載入中…</div>

      <div v-else-if="!activeItems.length" class="card text-center py-5">
        <div class="text-slate-500 text-sm mb-2">沒有進行中的項目</div>
        <router-link to="/learning" class="text-blue-400 text-xs hover:underline">+ 新增書單或課程</router-link>
      </div>

      <div v-else class="space-y-2">
        <!-- 依類別分組 -->
        <template v-for="(group, cat) in groupedItems" :key="cat">
          <div class="text-xs text-slate-500 mt-3 mb-1 first:mt-0">{{ cat }}</div>
          <div
            v-for="item in group"
            :key="item.id"
            class="card py-3"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1 pr-2">
                <a v-if="item.url" :href="item.url" target="_blank" class="font-medium text-slate-100 hover:text-blue-400 text-sm">{{ item.title }}</a>
                <div v-else class="font-medium text-slate-100 text-sm">{{ item.title }}</div>
              </div>
              <span v-if="item.total_units" class="text-xs text-blue-400 whitespace-nowrap">
                {{ progressPct(item) }}%
              </span>
            </div>
            <template v-if="item.total_units">
              <div class="text-xs text-slate-500 mt-1 mb-1">{{ item.current_unit || 0 }} / {{ item.total_units }}</div>
              <div class="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div class="h-full bg-blue-500 rounded-full transition-all" :style="{ width: progressPct(item) + '%' }"></div>
              </div>
            </template>
            <div v-if="item.notes" class="text-xs text-slate-500 mt-1">{{ item.notes }}</div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityCard from '../components/ActivityCard.vue'
import { useRecords } from '../composables/useRecords'
import { useLearning } from '../composables/useLearning'
import { getAchieveLevel } from '../lib/parseTarget'

const { fetchRecord, fetchStreakAndStats } = useRecords()
const { fetchActiveItems } = useLearning()

const today = new Date().toISOString().slice(0, 10)
const todayLabel = computed(() => {
  const d = new Date()
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 星期${wd}`
})

const loading = ref(true)
const loadingLearning = ref(true)
const record = ref(null)
const streak = ref(0)
const activeItems = ref([])

onMounted(async () => {
  const [r, s, l] = await Promise.all([
    fetchRecord(today),
    fetchStreakAndStats(),
    fetchActiveItems(),
  ])
  record.value = r.data
  streak.value = s.streak
  activeItems.value = l.data
  loading.value = false
  loadingLearning.value = false
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
  const done = recs.filter(r => {
    const level = getAchieveLevel(r)
    return level && level !== 'miss'
  })
  return Math.round((done.length / recs.length) * 100)
})

const rateColor = computed(() => {
  if (completionRate.value >= 80) return 'text-green-400'
  if (completionRate.value >= 50) return 'text-yellow-400'
  return 'text-red-400'
})

const groupedItems = computed(() => {
  const map = {}
  for (const item of activeItems.value) {
    if (!map[item.category]) map[item.category] = []
    map[item.category].push(item)
  }
  return map
})

function progressPct(item) {
  if (!item.total_units || !item.current_unit) return 0
  return Math.min(100, Math.round((item.current_unit / item.total_units) * 100))
}
</script>
