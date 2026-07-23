<template>
  <div class="pb-4">
    <PmSubNav />
    <div class="max-w-3xl mx-auto px-4 pt-2">
      <h1 class="text-xl font-bold text-white mb-4">🎯 專案總覽<span class="text-sm font-normal text-slate-500 ml-2">（進行中專案）</span></h1>

      <div v-if="loading" class="text-slate-400 text-center py-10">載入中…</div>

      <div v-else-if="!groups.length" class="card text-center py-10 text-slate-400">
        <div class="text-3xl mb-2">📭</div>
        <div>目前沒有進行中的專案</div>
        <router-link to="/pm/manage" class="text-blue-400 text-sm mt-2 inline-block">前往維護頁新增 →</router-link>
      </div>

      <div v-else class="space-y-6">
        <div v-for="g in groups" :key="g.id">
          <div class="flex items-center gap-2 mb-2">
            <h2 class="text-slate-300 font-semibold">{{ g.name }}</h2>
            <span class="text-xs text-slate-500">{{ g.projects.length }} 個</span>
          </div>
          <div class="space-y-2">
            <PmProjectCard v-for="p in g.projects" :key="p.id" :project="p" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PmSubNav from '../components/PmSubNav.vue'
import PmProjectCard from '../components/PmProjectCard.vue'
import { usePmProjects } from '../composables/usePmProjects'

const { fetchCategories, fetchProjectsFull } = usePmProjects()
const loading = ref(true)
const groups = ref([])

onMounted(async () => {
  const [{ data: cats }, { data: projs }] = await Promise.all([fetchCategories(), fetchProjectsFull()])
  const active = projs.filter(p => Number(p.status) === 1)

  const result = []
  for (const c of cats) {
    const ps = active.filter(p => p.category_id === c.id)
    if (ps.length) result.push({ id: c.id, name: c.name, projects: ps })
  }
  const uncategorized = active.filter(p => !p.category_id)
  if (uncategorized.length) result.push({ id: '_none', name: '未分類', projects: uncategorized })

  groups.value = result
  loading.value = false
})
</script>
