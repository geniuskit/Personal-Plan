<template>
  <div class="min-h-screen bg-slate-900 pb-20">
    <router-view />
    <NavBar />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
</script>
