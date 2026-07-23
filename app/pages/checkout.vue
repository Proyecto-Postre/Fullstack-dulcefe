<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()

const checkoutMode = ref<'direct' | 'chat'>('direct')
const editingItemId = ref<string | null>(null)

const formData = ref({
  name: '',
  phone: '',
  address: '',
  deliveryDate: '',
  deliveryTime: '',
  notes: ''
})

onMounted(() => {
  if (authStore.isLoggedIn && authStore.user) {
    formData.value.name = authStore.user.user_metadata?.full_name || ''
    formData.value.phone = authStore.profile?.phone || ''
  }
})

// Número de WhatsApp del negocio (Reemplazar con el real)
const WHATSAPP_NUMBER = '51998265700' 

// Redirigir al inicio si el carrito está vacío
if (import.meta.client && cartStore.items.length === 0) {
  navigateTo('/')
}

watch(() => cartStore.items.length, (newLength) => {
  if (newLength === 0) {
    navigateTo('/')
  }
})

const isFormValid = computed(() => {
  if (checkoutMode.value === 'chat') {
    return formData.value.name.trim() !== ''
  } else {
    return formData.value.name.trim() !== '' && formData.value.address.trim() !== ''
  }
})

// --- Lógica del Calendario Personalizado ---
const showDatePicker = ref(false)
const datePickerPosition = ref<'bottom' | 'top'>('bottom')
const datePickerContainer = ref<HTMLElement | null>(null)

const currentDate = ref(new Date())
const currentMonth = ref(currentDate.value.getMonth())
const currentYear = ref(currentDate.value.getFullYear())

const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const daysInMonth = computed(() => new Date(currentYear.value, currentMonth.value + 1, 0).getDate())
const firstDayOfMonth = computed(() => new Date(currentYear.value, currentMonth.value, 1).getDay())

const openDatePicker = (e: Event) => {
  if (!showDatePicker.value) {
    const target = e.target as HTMLElement
    // Si el target es el botón o el icono, usamos el input como referencia para calcular el espacio
    const inputRect = target.closest('.relative')?.querySelector('input')?.getBoundingClientRect() || target.getBoundingClientRect()
    const spaceBelow = window.innerHeight - inputRect.bottom
    
    datePickerPosition.value = spaceBelow < 350 ? 'top' : 'bottom'
    showDatePicker.value = true
    showTimePicker.value = false // Cerrar el otro
  }
}

const toggleDatePicker = (e: Event) => {
  if (showDatePicker.value) {
    showDatePicker.value = false
  } else {
    openDatePicker(e)
  }
}

// --- Lógica del Selector de Hora Personalizado ---
const showTimePicker = ref(false)
const timePickerPosition = ref<'bottom' | 'top'>('bottom')
const timePickerContainer = ref<HTMLElement | null>(null)
const amPm = ref<'AM' | 'PM'>('AM')

const openTimePicker = (e: Event) => {
  if (!showTimePicker.value) {
    const target = e.target as HTMLElement
    const inputRect = target.closest('.relative')?.querySelector('input')?.getBoundingClientRect() || target.getBoundingClientRect()
    const spaceBelow = window.innerHeight - inputRect.bottom
    
    timePickerPosition.value = spaceBelow < 300 ? 'top' : 'bottom'
    showTimePicker.value = true
    showDatePicker.value = false // Cerrar el otro
  }
}

const toggleTimePicker = (e: Event) => {
  if (showTimePicker.value) {
    showTimePicker.value = false
  } else {
    openTimePicker(e)
  }
}

const selectHour = (h: number) => {
  const currentMins = formData.value.deliveryTime.split(':')[1] || '00'
  formData.value.deliveryTime = `${String(h).padStart(2, '0')}:${currentMins}`
}

const selectMinute = (m: string) => {
  const currentHour = formData.value.deliveryTime.split(':')[0] || '12'
  formData.value.deliveryTime = `${currentHour}:${m}`
  showTimePicker.value = false
}

// --- Cierre al hacer clic fuera ---
const closePopupsOutside = (e: MouseEvent) => {
  const target = e.target as Node
  if (showDatePicker.value && datePickerContainer.value && !datePickerContainer.value.contains(target)) {
    showDatePicker.value = false
  }
  if (showTimePicker.value && timePickerContainer.value && !timePickerContainer.value.contains(target)) {
    showTimePicker.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closePopupsOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closePopupsOutside)
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

const selectDate = (day: number) => {
  const d = String(day).padStart(2, '0')
  const m = String(currentMonth.value + 1).padStart(2, '0')
  formData.value.deliveryDate = `${d}/${m}/${currentYear.value}`
  showDatePicker.value = false
}

const handleDateInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '')
  if (val.length > 8) val = val.slice(0, 8)
  
  if (val.length >= 5) {
    formData.value.deliveryDate = `${val.slice(0, 2)}/${val.slice(2, 4)}/${val.slice(4)}`
  } else if (val.length >= 3) {
    formData.value.deliveryDate = `${val.slice(0, 2)}/${val.slice(2)}`
  } else {
    formData.value.deliveryDate = val
  }
}

// (Eliminado código duplicado)

const handleTimeInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  let val = target.value.replace(/\D/g, '')
  if (val.length > 4) val = val.slice(0, 4)
  
  // Validar formato 12 horas
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

  if (val.length >= 3) {
    formData.value.deliveryTime = `${val.slice(0, 2)}:${val.slice(2)}`
  } else {
    formData.value.deliveryTime = val
  }
}

const generateWhatsAppLink = async () => {
  if (!isFormValid.value) return

  const supabase = useSupabaseClient()
  const authStore = useAuthStore()
  const isSaving = ref(false)

  try {
    isSaving.value = true
    
    // 1. Guardar en Base de Datos si el usuario está logueado
    if (authStore.isLoggedIn && authStore.user) {
      // Insertar Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          profile_id: authStore.user.id,
          total_amount: cartStore.cartTotal,
          status: 'pending',
          delivery_date: formData.value.deliveryDate || null,
          delivery_time: formData.value.deliveryTime ? `${formData.value.deliveryTime} ${amPm.value}` : null,
          notes: formData.value.notes.trim() || null
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Insertar Order Items
      if (orderData) {
        const orderItems = cartStore.items.map(item => ({
          order_id: orderData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price_at_time: item.price
        }))

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems)

        if (itemsError) throw itemsError
        
        // Sumar puntos al usuario (1 punto por cada sol)
        const pointsEarned = Math.floor(cartStore.cartTotal)
        await supabase.rpc('increment_points', { 
          user_id: authStore.user.id, 
          points_to_add: pointsEarned 
        })
      }
    }

    // 2. Generar mensaje de WhatsApp
    let message = `¡Hola Dulce Fe! Quiero hacer un pedido:\n\n`
    message += `*Datos del Cliente:*\n`
    message += `Nombre: ${formData.value.name.trim()}\n`
    
    if (checkoutMode.value === 'direct') {
      if (formData.value.phone.trim()) message += `Teléfono alternativo: ${formData.value.phone.trim()}\n`
      message += `Dirección: ${formData.value.address.trim()}\n`
      if (formData.value.deliveryDate) message += `Fecha: ${formData.value.deliveryDate}\n`
      if (formData.value.deliveryTime) message += `Hora: ${formData.value.deliveryTime} ${amPm.value}\n`
      if (formData.value.notes.trim()) message += `Notas: ${formData.value.notes.trim()}\n`
    } else {
      message += `(Detalles de entrega a coordinar por chat)\n`
    }
    
    message += `\n*Pedido:*\n`
    cartStore.items.forEach(item => {
      message += `- ${item.quantity}x ${item.name} (S/ ${(item.price * item.quantity).toFixed(2)})\n`
    })
    
    message += `\n*Total a Pagar:* S/ ${cartStore.cartTotal.toFixed(2)}`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`

    // Abrir WhatsApp en una nueva pestaña
    window.open(whatsappUrl, '_blank')

    // Limpiar el carrito después de enviar el pedido
    cartStore.clearCart()
    navigateTo('/')
    
  } catch (error) {
    console.error('Error al procesar el pedido:', error)
    alert('Hubo un problema al procesar tu pedido. Por favor, intenta de nuevo o contáctanos directamente.')
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] py-12 px-6">
    <div class="max-w-5xl mx-auto">
      
      <!-- Header Simple -->
      <div class="flex items-center gap-4 mb-10">
        <NuxtLink to="/" class="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#2A321B] bg-white text-[#2A321B] hover:bg-[#F4F1E1] transition-colors shadow-[2px_2px_0px_#2A321B] active:translate-y-0.5 active:shadow-none">
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-3xl font-playfair font-black text-[#2A321B]">Finalizar Pedido</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Formulario (Izquierda) -->
        <div class="lg:col-span-6 space-y-6">
          
          <!-- Selector de Modo -->
          <div class="bg-white border-2 border-[#2A321B] rounded-2xl p-2 flex gap-2 shadow-[4px_4px_0px_#4A5D23]">
            <button 
              @click="checkoutMode = 'direct'"
              :class="[
                'flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                checkoutMode === 'direct' 
                  ? 'bg-[#4A5D23] text-white border-2 border-[#2A321B] shadow-[2px_2px_0px_#2A321B]' 
                  : 'bg-transparent text-[#4A5D23] hover:bg-[#F4F1E1]'
              ]"
            >
              <Icon name="lucide:zap" class="w-5 h-5" />
              Compra Directa
            </button>
            <button 
              @click="checkoutMode = 'chat'"
              :class="[
                'flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                checkoutMode === 'chat' 
                  ? 'bg-[#4A5D23] text-white border-2 border-[#2A321B] shadow-[2px_2px_0px_#2A321B]' 
                  : 'bg-transparent text-[#4A5D23] hover:bg-[#F4F1E1]'
              ]"
            >
              <Icon name="lucide:message-circle" class="w-5 h-5" />
              Coordinar por Chat
            </button>
          </div>

          <div class="bg-white border-2 border-[#2A321B] rounded-[2rem] p-8 shadow-[6px_6px_0px_#4A5D23]">
            <h2 class="text-xl font-playfair font-bold text-[#2A321B] mb-6 flex items-center gap-3">
              <Icon name="lucide:map-pin" class="w-6 h-6 text-[#4A5D23]" />
              Datos de Entrega
            </h2>
            
            <p v-if="checkoutMode === 'chat'" class="text-sm text-[#4A5D23] font-medium mb-6 leading-relaxed">
              Solo necesitamos tu nombre. La dirección exacta y la fecha de entrega las coordinaremos directamente contigo por WhatsApp para darte un servicio más personalizado.
            </p>
            <p v-else class="text-sm text-[#4A5D23] font-medium mb-6 leading-relaxed">
              Completa todos tus datos para que podamos procesar y enviar tu pedido de inmediato sin hacerte preguntas adicionales.
            </p>

            <div class="space-y-5">
              <!-- Nombre (Siempre visible) -->
              <div class="space-y-2">
                <label for="name" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Nombre Completo *</label>
                <input 
                  id="name"
                  v-model="formData.name"
                  type="text" 
                  placeholder="Ej. María Pérez"
                  class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
                >
              </div>

              <!-- Campos Detallados -->
              <template v-if="checkoutMode === 'direct'">
                <!-- Teléfono -->
                <div class="space-y-2 animate-pop">
                  <label for="phone" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Teléfono (Opcional)</label>
                  <input 
                    id="phone"
                    v-model="formData.phone"
                    type="tel" 
                    placeholder="Si es diferente al de WhatsApp"
                    class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
                  >
                </div>

                <!-- Dirección -->
                <div class="space-y-2 animate-pop" style="animation-delay: 50ms;">
                  <label for="address" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Dirección Exacta *</label>
                  <textarea 
                    id="address"
                    v-model="formData.address"
                    rows="2"
                    placeholder="Calle, número, distrito, referencias..."
                    class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 resize-none"
                  ></textarea>
                </div>

                <!-- Fecha y Hora -->
                <div class="grid grid-cols-2 gap-4 animate-pop" style="animation-delay: 100ms;">
                  <!-- Selector de Fecha -->
                  <div class="space-y-2" ref="datePickerContainer">
                    <label for="date" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Fecha</label>
                    <div class="relative">
                      <input 
                        id="date"
                        v-model="formData.deliveryDate"
                        @input="handleDateInput"
                        @focus="openDatePicker"
                        @click="openDatePicker"
                        type="text" 
                        placeholder="DD/MM/AAAA"
                        maxlength="10"
                        class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
                      >
                      <button 
                        @click.prevent="toggleDatePicker"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-[#2A321B] hover:text-[#4A5D23] transition-colors"
                      >
                        <Icon name="lucide:calendar-days" class="w-5 h-5" />
                      </button>

                      <!-- Calendario Popup Neo-Brutalista -->
                      <Transition name="pop">
                        <div 
                          v-show="showDatePicker" 
                          :class="[
                            'absolute z-50 left-0 w-64 bg-white border-2 border-[#2A321B] rounded-xl shadow-[4px_4px_0px_#2A321B] p-4',
                            datePickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                          ]"
                        >
                          <div class="flex items-center justify-between mb-4">
                            <button @click.prevent="prevMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F1E1] border border-transparent hover:border-[#2A321B] transition-all">
                              <Icon name="lucide:chevron-left" class="w-4 h-4" />
                            </button>
                            <span class="font-bold text-[#2A321B]">{{ monthNames[currentMonth] }} {{ currentYear }}</span>
                            <button @click.prevent="nextMonth" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#F4F1E1] border border-transparent hover:border-[#2A321B] transition-all">
                              <Icon name="lucide:chevron-right" class="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div class="grid grid-cols-7 gap-1 text-center mb-2">
                            <span v-for="day in ['D', 'L', 'M', 'M', 'J', 'V', 'S']" :key="day" class="text-xs font-bold text-[#4A5D23]">{{ day }}</span>
                          </div>
                          
                          <div class="grid grid-cols-7 gap-1">
                            <div v-for="empty in firstDayOfMonth" :key="'empty-'+empty"></div>
                            <button 
                              v-for="day in daysInMonth" 
                              :key="day"
                              @click.prevent="selectDate(day)"
                              class="w-7 h-7 flex items-center justify-center rounded-md text-sm font-medium text-[#2A321B] hover:bg-[#84cc16] hover:border-2 hover:border-[#2A321B] transition-all"
                            >
                              {{ day }}
                            </button>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>

                  <!-- Selector de Hora -->
                  <div class="space-y-2" ref="timePickerContainer">
                    <label for="time" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Hora Aprox.</label>
                    <div class="flex gap-2 relative">
                      <input 
                        id="time"
                        v-model="formData.deliveryTime"
                        @input="handleTimeInput"
                        @focus="openTimePicker"
                        @click="openTimePicker"
                        type="text" 
                        placeholder="HH:MM"
                        maxlength="5"
                        class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 text-center"
                      >
                      <button 
                        @click.prevent="amPm = amPm === 'AM' ? 'PM' : 'AM'"
                        class="px-3 bg-[#F4F1E1] text-[#2A321B] hover:bg-[#e5e5e5] border-2 border-[#2A321B] rounded-xl font-bold shadow-[2px_2px_0px_#2A321B] active:translate-y-0.5 active:shadow-none transition-all w-16 shrink-0"
                      >
                        {{ amPm }}
                      </button>

                      <!-- Time Picker Popup -->
                      <Transition name="pop">
                        <div 
                          v-show="showTimePicker" 
                          :class="[
                            'absolute z-50 left-0 w-64 bg-white border-2 border-[#2A321B] rounded-xl shadow-[4px_4px_0px_#2A321B] p-4 flex gap-4',
                            timePickerPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
                          ]"
                        >
                          <!-- Horas -->
                          <div class="flex-1 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                            <div class="text-[10px] font-bold text-[#4A5D23] mb-2 text-center tracking-widest">HORA</div>
                            <div class="space-y-1">
                              <button 
                                v-for="h in 12" 
                                :key="h" 
                                @click.prevent="selectHour(h)" 
                                class="w-full py-1.5 text-sm text-center hover:bg-[#84cc16] rounded-md font-medium text-[#2A321B] border border-transparent hover:border-[#2A321B] transition-all"
                              >
                                {{ String(h).padStart(2, '0') }}
                              </button>
                            </div>
                          </div>
                          
                          <!-- Separador -->
                          <div class="w-px bg-[#2A321B]/10"></div>

                          <!-- Minutos -->
                          <div class="flex-1 max-h-48 overflow-y-auto pl-1 custom-scrollbar">
                            <div class="text-[10px] font-bold text-[#4A5D23] mb-2 text-center tracking-widest">MINUTOS</div>
                            <div class="space-y-1">
                              <button 
                                v-for="m in ['00', '15', '30', '45']" 
                                :key="m" 
                                @click.prevent="selectMinute(m)" 
                                class="w-full py-1.5 text-sm text-center hover:bg-[#84cc16] rounded-md font-medium text-[#2A321B] border border-transparent hover:border-[#2A321B] transition-all"
                              >
                                {{ m }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </Transition>
                    </div>
                  </div>
                </div>

                <!-- Notas -->
                <div class="space-y-2 animate-pop" style="animation-delay: 150ms;">
                  <label for="notes" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Preferencias / Notas</label>
                  <textarea 
                    id="notes"
                    v-model="formData.notes"
                    rows="2"
                    placeholder="Ej. Sin pasas, poco dulce, dedicatoria..."
                    class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 resize-none"
                  ></textarea>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Resumen (Derecha) -->
        <div class="lg:col-span-6">
          <div class="bg-[#2A321B] border-2 border-[#2A321B] rounded-[2rem] p-8 shadow-[6px_6px_0px_#4A5D23] text-white sticky top-24">
            <h2 class="text-xl font-playfair font-bold mb-6 flex items-center gap-3 text-[#F4F1E1]">
              <Icon name="lucide:receipt" class="w-6 h-6 text-[#a3e635]" />
              Resumen
            </h2>

            <div class="space-y-4 mb-8 max-h-[40vh] overflow-y-auto custom-scrollbar pr-2">
              <div 
                v-for="item in cartStore.items" 
                :key="item.product_id"
                class="flex items-center gap-4 bg-white/10 rounded-xl p-3 border border-white/20"
              >
                <div class="w-12 h-12 rounded-lg bg-[#F4F1E1] overflow-hidden shrink-0">
                  <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                  <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]">
                    <Icon name="lucide:croissant" class="w-5 h-5" />
                  </div>
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-sm leading-tight text-[#F4F1E1]">{{ item.name }}</h3>
                  
                  <!-- Modo Edición -->
                  <div v-if="editingItemId === item.product_id" class="flex flex-wrap items-center gap-2 mt-2 animate-pop">
                    <div class="flex items-center gap-1 bg-white/10 border border-white/20 rounded-lg p-1">
                      <button 
                        @click="cartStore.updateQuantity(item.product_id, item.quantity - 1)"
                        :disabled="item.quantity <= 1"
                        class="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 transition-colors"
                      >
                        <Icon name="lucide:minus" class="w-3 h-3" />
                      </button>
                      <span class="text-xs font-bold text-white min-w-[1.5rem] text-center">{{ item.quantity }}</span>
                      <button 
                        @click="cartStore.updateQuantity(item.product_id, item.quantity + 1)"
                        class="w-6 h-6 flex items-center justify-center rounded bg-white/10 text-white hover:bg-white/20 transition-colors"
                      >
                        <Icon name="lucide:plus" class="w-3 h-3" />
                      </button>
                    </div>
                    
                    <button 
                      @click="cartStore.removeFromCart(item.product_id)"
                      class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#991B1B]/20 text-[#ff8a8a] border border-[#991B1B]/30 hover:bg-[#991B1B]/40 transition-colors"
                    >
                      <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                    
                    <button 
                      @click="editingItemId = null"
                      class="w-7 h-7 flex items-center justify-center rounded-lg bg-[#a3e635]/20 text-[#a3e635] border border-[#a3e635]/30 hover:bg-[#a3e635]/40 transition-colors"
                    >
                      <Icon name="lucide:check" class="w-4 h-4" />
                    </button>
                    
                    <div class="font-bold text-[#a3e635] whitespace-nowrap ml-auto">
                      S/ {{ (item.price * item.quantity).toFixed(2) }}
                    </div>
                  </div>

                  <!-- Vista Normal -->
                  <div v-else class="flex items-center justify-between mt-1">
                    <p class="text-xs text-white/60 flex items-center gap-2">
                      Cant: {{ item.quantity }}
                      <button @click="editingItemId = item.product_id" class="text-white/40 hover:text-white transition-colors flex items-center justify-center w-5 h-5 rounded hover:bg-white/10">
                        <Icon name="lucide:pencil" class="w-3 h-3" />
                      </button>
                    </p>
                    <div class="font-bold text-[#a3e635]">
                      S/ {{ (item.price * item.quantity).toFixed(2) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="border-t-2 border-white/20 pt-6 mb-8">
              <div class="flex justify-between items-center">
                <span class="font-bold text-white/80 uppercase tracking-widest text-sm">Total a Pagar</span>
                <span class="text-3xl font-black text-[#a3e635]">S/ {{ cartStore.cartTotal.toFixed(2) }}</span>
              </div>
            </div>

            <button 
              @click="generateWhatsAppLink"
              :disabled="!isFormValid || cartStore.items.length === 0"
              class="w-full bg-[#84cc16] text-[#2A321B] font-bold py-4 rounded-xl shadow-[4px_4px_0px_#F4F1E1] hover:bg-[#65a30d] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
            >
              <Icon name="lucide:message-circle" class="w-6 h-6" />
              Enviar por WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
