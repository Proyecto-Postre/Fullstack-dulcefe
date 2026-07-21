<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  options: Array<{ label: string; value: any }>
  modelValue: any
  placeholder?: string
  bgClass?: string // Allow passing custom background like 'bg-white' or 'bg-[#F4F1E1]'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
  (e: 'change', val: any): void
}>()

const isOpen = ref(false)

const selectedLabel = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return ''
  const opt = props.options.find(o => o.value === props.modelValue || (o.value?.id && props.modelValue?.id && o.value.id === props.modelValue.id))
  return opt ? opt.label : ''
})

function selectOption(val: any) {
  emit('update:modelValue', val)
  emit('change', val)
  isOpen.value = false
}

function isSelected(val: any) {
  if (val?.id && props.modelValue?.id) {
    return val.id === props.modelValue.id
  }
  return val === props.modelValue
}
</script>

<template>
  <div class="relative w-full">
    <!-- Overlay to detect click outside -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40"></div>

    <!-- Select Button -->
    <button 
      type="button"
      @click="isOpen = !isOpen" 
      :class="[
        'w-full pl-4 pr-10 py-3 rounded-xl border-2 transition-all flex items-center justify-between text-left focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10',
        bgClass || 'bg-[#F4F1E1]',
        isOpen ? 'border-[#4A5D23]' : 'border-[#4A5D23]/20 hover:border-[#4A5D23]/50'
      ]"
    >
      <span v-if="selectedLabel" class="text-sm font-bold text-[#2A321B] truncate">{{ selectedLabel }}</span>
      <span v-else class="text-sm font-bold text-[#4A5D23]/50 truncate">{{ placeholder || 'Seleccionar...' }}</span>
      
      <Icon 
        name="lucide:chevron-down" 
        class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5D23] transition-transform duration-300 pointer-events-none" 
        :class="{'rotate-180': isOpen}" 
      />
    </button>

    <!-- Dropdown Menu -->
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
        class="absolute z-50 w-full mt-2 bg-white border-2 border-[#4A5D23] rounded-xl shadow-[4px_4px_0px_#4A5D23] max-h-60 overflow-y-auto custom-scrollbar overflow-x-hidden py-2 origin-top"
      >
        <div v-if="options.length === 0" class="px-4 py-3 text-sm text-[#4A5D23]/60 italic font-medium">
          No hay opciones disponibles
        </div>
        
        <button 
          v-for="(opt, idx) in options" 
          :key="idx"
          type="button"
          @click="selectOption(opt.value)"
          class="w-full text-left px-4 py-2.5 text-sm font-bold transition-colors"
          :class="[
            isSelected(opt.value) 
              ? 'bg-[#4A5D23] text-[#F4F1E1]' 
              : 'text-[#2A321B] hover:bg-[#4A5D23]/10 hover:text-[#4A5D23]'
          ]"
        >
          {{ opt.label }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Scrollbar super delgada para el dropdown */
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
