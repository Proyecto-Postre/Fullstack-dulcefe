<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  bgClass?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const showTimePicker = ref(false)
const timePickerPosition = ref('bottom')
const timePickerContainer = ref<HTMLElement | null>(null)
const amPm = ref('AM')

// Extract AM/PM from modelValue if present
watch(() => props.modelValue, (newVal) => {
  if (newVal && newVal.includes('PM')) amPm.value = 'PM'
  else if (newVal && newVal.includes('AM')) amPm.value = 'AM'
}, { immediate: true })

// Clean modelValue for input (remove AM/PM)
const cleanTime = computed(() => {
  return props.modelValue ? props.modelValue.replace(/\s*[AP]M/i, '').trim() : ''
})

const toggleTimePicker = () => {
  if (!showTimePicker.value) {
    openTimePicker()
  } else {
    showTimePicker.value = false
  }
}

const openTimePicker = () => {
  if (timePickerContainer.value) {
    const rect = timePickerContainer.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    if (spaceBelow < 250) {
      timePickerPosition.value = 'top'
    } else {
      timePickerPosition.value = 'bottom'
    }
  }
  showTimePicker.value = true
}

const closeTimePicker = (e: MouseEvent) => {
  if (timePickerContainer.value && !timePickerContainer.value.contains(e.target as Node)) {
    showTimePicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeTimePicker)
})

onUnmounted(() => {
  document.removeEventListener('click', closeTimePicker)
})

const selectHour = (h: number) => {
  const currentMin = cleanTime.value.split(':')[1] || '00'
  const newTime = `${String(h).padStart(2, '0')}:${currentMin}`
  emit('update:modelValue', `${newTime} ${amPm.value}`)
}

const selectMinute = (m: string) => {
  const currentHour = cleanTime.value.split(':')[0] || '12'
  const newTime = `${currentHour}:${m}`
  emit('update:modelValue', `${newTime} ${amPm.value}`)
}

const toggleAmPm = () => {
  amPm.value = amPm.value === 'AM' ? 'PM' : 'AM'
  if (cleanTime.value) {
    emit('update:modelValue', `${cleanTime.value} ${amPm.value}`)
  }
}

const handleTimeInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '')
  if (val.length > 4) val = val.slice(0, 4)
  
  if (val.length >= 2) {
    let hours = parseInt(val.slice(0, 2))
    if (hours > 12) hours = 12
    if (hours === 0) hours = 1
    val = String(hours).padStart(2, '0') + val.slice(2)
  }
  if (val.length >= 4) {
    let mins = parseInt(val.slice(2, 4))
    if (mins > 59) mins = 59
    val = val.slice(0, 2) + String(mins).padStart(2, '0')
  }

  let formatted = val
  if (val.length >= 3) {
    formatted = `${val.slice(0, 2)}:${val.slice(2)}`
  }
  
  emit('update:modelValue', formatted ? `${formatted} ${amPm.value}` : '')
}
</script>

<template>
  <div class="relative w-full" ref="timePickerContainer">
    <div class="flex gap-2 relative">
      <input 
        :value="cleanTime"
        @input="handleTimeInput"
        @focus="openTimePicker"
        @click="openTimePicker"
        type="text" 
        :placeholder="placeholder || 'HH:MM'"
        maxlength="5"
        :class="[
          'w-full border border-brand-primary/20 rounded-xl px-3 py-2.5 text-brand-secondary font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all placeholder:text-brand-primary/40 text-center shadow-soft-sm text-sm',
          bgClass || 'bg-surface'
        ]"
      >
      <button 
        @click.prevent="toggleAmPm"
        class="px-2 bg-surface text-brand-secondary hover:bg-brand-cream border border-brand-primary/20 rounded-xl font-bold shadow-soft-sm active:translate-y-0.5 transition-all w-14 shrink-0 text-sm cursor-pointer"
      >
        {{ amPm }}
      </button>

      <!-- Time Picker Popup -->
      <Transition name="pop">
        <div 
          v-show="showTimePicker" 
          :class="[
            'absolute z-50 left-0 w-64 bg-surface border border-brand-primary/20 rounded-xl shadow-soft-lg p-4 flex gap-4',
            timePickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          ]"
        >
          <!-- Horas -->
          <div class="flex-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
            <div class="text-[10px] font-bold text-brand-primary mb-2 text-center tracking-widest">HORA</div>
            <div class="space-y-1">
              <button 
                v-for="h in 12" 
                :key="h" 
                @click.prevent="selectHour(h)" 
                class="w-full py-1.5 text-sm text-center hover:bg-brand-primary hover:text-white rounded-md font-bold text-brand-secondary border border-transparent transition-all cursor-pointer"
              >
                {{ String(h).padStart(2, '0') }}
              </button>
            </div>
          </div>
          
          <!-- Separador -->
          <div class="w-px bg-brand-secondary/10"></div>

          <!-- Minutos -->
          <div class="flex-1 max-h-48 overflow-y-auto pl-1 custom-scrollbar">
            <div class="text-[10px] font-bold text-brand-primary mb-2 text-center tracking-widest">MINUTOS</div>
            <div class="space-y-1">
              <button 
                v-for="m in ['00', '15', '30', '45']" 
                :key="m" 
                @click.prevent="selectMinute(m)" 
                class="w-full py-1.5 text-sm text-center hover:bg-brand-primary hover:text-white rounded-md font-bold text-brand-secondary border border-transparent transition-all cursor-pointer"
              >
                {{ m }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.pop-enter-active,
.pop-leave-active {
  transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-10px);
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(74, 93, 35, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(74, 93, 35, 0.4);
}
</style>
