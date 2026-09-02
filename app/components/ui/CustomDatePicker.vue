<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  bgClass?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const showDatePicker = ref(false)
const datePickerPosition = ref('bottom')
const datePickerContainer = ref<HTMLElement | null>(null)

const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value, 1).getDay()
})

const toggleDatePicker = () => {
  if (!showDatePicker.value) {
    openDatePicker()
  } else {
    showDatePicker.value = false
  }
}

const openDatePicker = () => {
  if (datePickerContainer.value) {
    const rect = datePickerContainer.value.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    if (spaceBelow < 300) {
      datePickerPosition.value = 'top'
    } else {
      datePickerPosition.value = 'bottom'
    }
  }
  showDatePicker.value = true
}

const closeDatePicker = (e: MouseEvent) => {
  if (datePickerContainer.value && !datePickerContainer.value.contains(e.target as Node)) {
    showDatePicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeDatePicker)
})

onUnmounted(() => {
  document.removeEventListener('click', closeDatePicker)
})

const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

const isPastDate = (day: number) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dateToCheck = new Date(currentYear.value, currentMonth.value, day)
  return dateToCheck < today
}

const selectDate = (day: number) => {
  if (isPastDate(day)) return
  const d = String(day).padStart(2, '0')
  const m = String(currentMonth.value + 1).padStart(2, '0')
  emit('update:modelValue', `${d}/${m}/${currentYear.value}`)
  showDatePicker.value = false
}

const handleDateInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '')
  if (val.length > 8) val = val.slice(0, 8)
  
  let formatted = val
  if (val.length >= 5) {
    formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
  } else if (val.length >= 3) {
    formatted = `${val.slice(0, 2)}/${val.slice(2)}`
  }
  
  emit('update:modelValue', formatted)
}
</script>

<template>
  <div class="relative w-full" ref="datePickerContainer">
    <div class="relative">
      <input 
        :value="modelValue"
        @input="handleDateInput"
        @focus="openDatePicker"
        @click="openDatePicker"
        type="text" 
        :placeholder="placeholder || 'DD/MM/AAAA'"
        maxlength="10"
        :class="[
          'w-full border border-brand-primary/20 rounded-xl px-3 py-2.5 text-brand-secondary font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/10 focus:border-brand-primary transition-all placeholder:text-brand-primary/40 shadow-soft-sm text-sm',
          bgClass || 'bg-surface'
        ]"
      >
      <button 
        @click.prevent="toggleDatePicker"
        class="absolute right-3 top-1/2 -translate-y-1/2 text-brand-secondary hover:text-brand-primary hover:bg-brand-cream p-1.5 rounded-lg transition-colors cursor-pointer"
      >
        <Icon name="lucide:calendar-days" class="w-5 h-5" />
      </button>

      <!-- Calendario Popup -->
      <Transition name="pop">
        <div 
          v-show="showDatePicker" 
          :class="[
            'absolute z-50 left-0 w-64 bg-surface border border-brand-primary/20 rounded-xl shadow-soft-lg p-4',
            datePickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          ]"
        >
          <div class="flex items-center justify-between mb-4">
            <button @click.prevent="prevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-cream border border-transparent hover:border-brand-secondary/20 transition-all text-brand-primary cursor-pointer">
              <Icon name="lucide:chevron-left" class="w-4 h-4" />
            </button>
            <span class="font-bold text-brand-secondary">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
            <button @click.prevent="nextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-cream border border-transparent hover:border-brand-secondary/20 transition-all text-brand-primary cursor-pointer">
              <Icon name="lucide:chevron-right" class="w-4 h-4" />
            </button>
          </div>
          
          <div class="grid grid-cols-7 gap-1 text-center mb-2">
            <span v-for="day in ['D', 'L', 'M', 'M', 'J', 'V', 'S']" :key="day" class="text-xs font-bold text-brand-primary">{{ day }}</span>
          </div>
          
          <div class="grid grid-cols-7 gap-1">
            <div v-for="empty in firstDayOfMonth" :key="'empty-'+empty"></div>
            <button 
              v-for="day in daysInMonth" 
              :key="day"
              @click.prevent="!isPastDate(day) && selectDate(day)"
              :disabled="isPastDate(day)"
              :class="[
                'w-7 h-7 flex items-center justify-center rounded-md text-sm font-bold transition-all',
                isPastDate(day)
                  ? 'text-brand-secondary/30 cursor-not-allowed'
                  : 'text-brand-secondary hover:bg-brand-primary hover:text-white cursor-pointer'
              ]"
            >
              {{ day }}
            </button>
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
</style>
