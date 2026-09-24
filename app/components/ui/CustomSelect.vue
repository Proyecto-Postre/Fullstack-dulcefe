<script setup lang="ts">
import { ref, computed } from 'vue'

export interface SelectOption {
  label: string | null
  value: unknown
  sublabel?: string
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    modelValue: unknown
    placeholder?: string
    bgClass?: string
    buttonClass?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    placeholder: 'Seleccionar...',
    disabled: false,
    size: 'md'
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: unknown): void
  (e: 'change', val: unknown): void
}>()

const isOpen = ref(false)

const selectedOption = computed(() => {
  if (props.modelValue === null || props.modelValue === undefined || props.modelValue === '') return null
  return props.options.find(o => {
    if (o.value === props.modelValue) return true
    if (
      typeof o.value === 'object' && o.value !== null && 'id' in o.value &&
      typeof props.modelValue === 'object' && props.modelValue !== null && 'id' in props.modelValue
    ) {
      return (o.value as { id: unknown }).id === (props.modelValue as { id: unknown }).id
    }
    return false
  }) || null
})

const selectedLabel = computed(() => {
  return selectedOption.value ? (selectedOption.value.label || '') : ''
})

function selectOption(val: unknown) {
  if (props.disabled) return
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
  <div class="relative w-full" :class="{ 'z-50': isOpen }">
    <!-- Overlay para detectar clic afuera -->
    <div v-if="isOpen" @click="isOpen = false" class="fixed inset-0 z-40"></div>

    <!-- Botón del Selector -->
    <button 
      type="button"
      :disabled="disabled"
      @click="!disabled && (isOpen = !isOpen)" 
      :class="[
        'w-full border transition-all flex items-center justify-between text-left focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 shadow-soft-sm relative',
        size === 'sm' ? 'pl-3 pr-8 py-2 rounded-xl text-xs' : 'pl-3.5 sm:pl-4 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm',
        bgClass || 'bg-surface',
        disabled 
          ? 'opacity-50 cursor-not-allowed border-brand-primary/10' 
          : (isOpen ? 'border-brand-primary ring-2 ring-brand-primary/10 cursor-pointer' : 'border-brand-primary/20 hover:border-brand-primary/50 cursor-pointer'),
        buttonClass
      ]"
    >
      <span v-if="selectedLabel" class="flex-1 min-w-0 font-bold text-brand-secondary break-words leading-tight">
        {{ selectedLabel }}
      </span>
      <span v-else class="flex-1 min-w-0 font-medium text-brand-primary/50 break-words leading-tight">
        {{ placeholder }}
      </span>
      
      <Icon 
        name="lucide:chevron-down" 
        :class="[
          'absolute top-1/2 -translate-y-1/2 text-brand-primary transition-transform duration-300 pointer-events-none shrink-0',
          size === 'sm' ? 'right-2.5 w-3.5 h-3.5' : 'right-3 sm:right-4 w-4 h-4',
          { 'rotate-180': isOpen }
        ]" 
      />
    </button>

    <!-- Menú Desplegable Popover -->
    <Transition 
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div 
        v-if="isOpen && !disabled" 
        class="absolute z-50 w-full mt-1.5 bg-white border border-brand-primary/20 rounded-xl shadow-2xl max-h-56 overflow-y-auto custom-scrollbar overflow-x-hidden py-1 origin-top"
      >
        <div v-if="options.length === 0" class="px-3.5 py-2.5 text-xs text-brand-primary/60 italic font-medium">
          No hay opciones disponibles
        </div>
        
        <button 
          v-for="(opt, idx) in options" 
          :key="idx"
          type="button"
          :disabled="opt.disabled"
          @click="!opt.disabled && selectOption(opt.value)"
          :class="[
            'w-full text-left px-3.5 py-2 text-xs font-bold transition-colors flex items-center justify-between gap-2 border-b border-brand-primary/5 last:border-b-0',
            opt.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
            isSelected(opt.value) 
              ? 'bg-brand-primary text-white' 
              : 'text-brand-secondary bg-white hover:bg-brand-cream/60 hover:text-brand-primary'
          ]"
        >
          <div class="flex-1 min-w-0">
            <div class="break-words leading-snug">{{ opt.label }}</div>
            <div 
              v-if="opt.sublabel" 
              class="text-[10px] font-medium break-words leading-tight mt-0.5"
              :class="isSelected(opt.value) ? 'text-white/80' : 'text-brand-primary/70'"
            >
              {{ opt.sublabel }}
            </div>
          </div>
          
          <Icon 
            v-if="isSelected(opt.value)" 
            name="lucide:check" 
            class="w-3.5 h-3.5 shrink-0 text-white" 
          />
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4A5D23;
  border-radius: 10px;
}
</style>
