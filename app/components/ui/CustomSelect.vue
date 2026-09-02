<script setup lang="ts">
import { ref, computed } from 'vue'

export interface SelectOption {
  label: string
  value: unknown
}

const props = defineProps<{
  options: SelectOption[]
  modelValue: unknown
  placeholder?: string
  bgClass?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

const isOpen = ref(false)

const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return ''
  const opt = props.options.find(o => {
    if (o.value === props.modelValue) return true
    if (
      typeof o.value === 'object' && o.value !== null && 'id' in o.value &&
      typeof props.modelValue === 'object' && props.modelValue !== null && 'id' in props.modelValue
    ) {
      return (o.value as { id: unknown }).id === (props.modelValue as { id: unknown }).id
    }
    return false
  })
  return opt ? opt.label : ''
})

function selectOption(val: unknown) {
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

function isSelected(val: unknown) {
  if (
    typeof val === 'object' && val !== null && 'id' in val &&
    typeof props.modelValue === 'object' && props.modelValue !== null && 'id' in props.modelValue
  ) {
    return (val as { id: unknown }).id === (props.modelValue as { id: unknown }).id
  }
  return val === props.modelValue
}
</script>

<template>
  <div class="relative w-full">
    <!-- Overlay para detectar clic afuera -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40"></div>

    <!-- Botón del Selector -->
    <button 
      type="button"
      @click="isOpen = !isOpen" 
      :class="[
        'w-full pl-4 pr-10 py-3 rounded-xl border transition-all flex items-center justify-between text-left focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 shadow-soft-sm cursor-pointer',
        bgClass || 'bg-surface',
        isOpen ? 'border-brand-primary' : 'border-brand-primary/20 hover:border-brand-primary/50'
      ]"
    >
      <span v-if="selectedLabel" class="flex-1 min-w-0 text-sm font-bold text-brand-secondary truncate">{{ selectedLabel }}</span>
      <span v-else class="flex-1 min-w-0 text-sm font-bold text-brand-primary/50 truncate">{{ placeholder || 'Seleccionar...' }}</span>
      
      <Icon 
        name="lucide:chevron-down" 
        class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-primary transition-transform duration-300 pointer-events-none" 
        :class="{'rotate-180': isOpen}" 
      />
    </button>

    <!-- Menú Desplegable -->
    <Transition 
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen" 
        class="absolute z-50 w-full mt-2 bg-surface border border-brand-primary/20 rounded-xl shadow-soft-lg max-h-60 overflow-y-auto custom-scrollbar overflow-x-hidden py-2 origin-top"
      >
        <div v-if="options.length === 0" class="px-4 py-3 text-sm text-brand-primary/60 italic font-medium">
          No hay opciones disponibles
        </div>
        
        <button 
          v-for="(opt, idx) in options" 
          :key="idx"
          type="button"
          @click="selectOption(opt.value)"
          class="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors cursor-pointer"
          :class="[
            isSelected(opt.value) 
              ? 'bg-brand-primary text-white' 
              : 'text-brand-secondary hover:bg-brand-primary/10 hover:text-brand-primary'
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4A5D23;
  border-radius: 10px;
}
</style>
