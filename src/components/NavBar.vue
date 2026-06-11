<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex z-50">
    <router-link
      v-for="item in items"
      :key="item.to"
      :to="item.to"
      class="flex-1 flex flex-col items-center py-3 gap-1 text-xs transition-colors"
      :class="isActive(item) ? 'text-blue-400' : 'text-slate-400'"
    >
      <span class="text-xl leading-none">{{ item.icon }}</span>
      <span>{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const items = [
  { to: '/', icon: '📋', label: '今日' },
  { to: `/edit/${today()}`, icon: '✏️', label: '記錄' },
  { to: '/history', icon: '📅', label: '歷史' },
  { to: '/learning', icon: '📚', label: '書單' },
  { to: '/settings', icon: '⚙️', label: '設定' },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

function isActive(item) {
  if (item.to.startsWith('/edit/')) return route.path.startsWith('/edit/')
  return route.path === item.to
}
</script>
