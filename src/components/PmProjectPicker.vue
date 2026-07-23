<template>
  <div class="card mb-4">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="label">大類別</label>
        <select v-model="catId" class="input text-sm">
          <option value="">全部分類</option>
          <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>
      <div>
        <label class="label">專案</label>
        <select :value="modelValue" class="input text-sm" @change="onSelect($event.target.value)">
          <option value="">請選擇專案</option>
          <option v-for="p in filteredProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { usePmProjects } from '../composables/usePmProjects'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit = defineEmits(['update:modelValue'])

const { fetchCategories, fetchProjects } = usePmProjects()
const categories = ref([])
const projects = ref([])
const catId = ref('')

const filteredProjects = computed(() =>
  catId.value ? projects.value.filter(p => p.category_id === catId.value) : projects.value
)

function onSelect(id) {
  emit('update:modelValue', id)
}

// 切換分類時，若目前選取的專案不在該分類內則清空
watch(catId, () => {
  if (props.modelValue && !filteredProjects.value.some(p => p.id === props.modelValue)) {
    emit('update:modelValue', '')
  }
})

onMounted(async () => {
  const [{ data: cats }, { data: projs }] = await Promise.all([fetchCategories(), fetchProjects()])
  categories.value = cats
  projects.value = projs
  // 預設選第一個專案，方便直接操作
  if (!props.modelValue && projs.length) emit('update:modelValue', projs[0].id)
})

defineExpose({ projects })
</script>
