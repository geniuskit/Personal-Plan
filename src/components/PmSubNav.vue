<template>
  <div class="max-w-3xl mx-auto px-4 pt-4">
    <div class="flex items-center gap-1 overflow-x-auto pb-2 -mx-1 px-1">
      <router-link
        v-for="t in tabs" :key="t.to"
        :to="t.to"
        class="pm-tab"
        :class="{ 'pm-tab--active': isActive(t) }"
      >{{ t.label }}</router-link>
      <a href="#/" class="pm-tab pm-tab--ghost">📋 每日計畫</a>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const tabs = [
  { to: '/pm',            label: '🎯 主頁', exact: true },
  { to: '/pm/logs',       label: '📝 歷程' },
  { to: '/pm/sessions',   label: '🧩 階段' },
  { to: '/pm/manage',     label: '🗂 維護' },
  { to: '/pm/categories', label: '🏷 分類' },
]

function isActive(t) {
  return t.exact ? route.path === t.to : route.path.startsWith(t.to)
}
</script>

<style scoped>
.pm-tab {
  padding: 0.375rem 0.85rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  white-space: nowrap;
  color: #305874;
  background: rgba(255, 255, 255, 0.55);
  border: 1px solid rgba(3, 105, 161, 0.18);
  transition: background-color 0.15s, color 0.15s, border-color 0.15s;
}
/* hover 呈現與「選中」相同：淡藍底、白色粗體字（稍淺於 active） */
.pm-tab:hover {
  background: #38bdf8;
  border-color: transparent;
  color: #ffffff;
  font-weight: 600;
}
/* 選中狀態：較深的藍底、白色粗體字 */
.pm-tab--active {
  background: #2563eb;
  border-color: transparent;
  color: #ffffff;
  font-weight: 600;
}
.pm-tab--active:hover {
  background: #1d4ed8;
  color: #ffffff;
}
.pm-tab--ghost {
  color: #4f7691;
}
</style>
