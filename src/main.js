import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import './style.css'

import DashboardView from './views/DashboardView.vue'
import EditView from './views/EditView.vue'
import HistoryView from './views/HistoryView.vue'
import SettingsView from './views/SettingsView.vue'
import LearningView from './views/LearningView.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: DashboardView },
    { path: '/edit/:date', component: EditView },
    { path: '/history', component: HistoryView },
    { path: '/learning', component: LearningView },
    { path: '/settings', component: SettingsView },
  ],
})

createApp(App).use(router).mount('#app')
