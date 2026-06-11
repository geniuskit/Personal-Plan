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
    <div v-else-if="!record" class="card text-center py-8">
      <div class="text-4xl mb-3">📝</div>
      <div class="text-slate-400 mb-4">今天還沒有記錄</div>
      <router-link :to="`/edit/${today}`" class="btn-primary inline-block">開始記錄今天</router-link>
    </div>

    <!-- 活動卡片列表 -->
    <div v-else class="space-y-3">
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityCard from '../components/ActivityCard.vue'
import { useRecords } from '../composables/useRecords'
import { getAchieveLevel } from '../lib/parseTarget'

const { fetchRecord, fetchStreakAndStats } = useRecords()

const today = new Date().toISOString().slice(0, 10)
const todayLabel = computed(() => {
  const d = new Date()
  const wd = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} 星期${wd}`
})

const loading = ref(true)
const record = ref(null)
const streak = ref(0)

onMounted(async () => {
  const [r, s] = await Promise.all([fetchRecord(today), fetchStreakAndStats()])
  record.value = r.data
  streak.value = s.streak
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
</script>
