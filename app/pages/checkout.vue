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

const generateWhatsAppLink = async () => {
  if (!isFormValid.value) return

  const supabase = useSupabaseClient()
  const authStore = useAuthStore()
  const isSaving = ref(false)

  try {
    isSaving.value = true
    
    // Construir notas finales con los datos que no tienen columna en la BD
    let finalNotes = formData.value.notes.trim()
    
    if (checkoutMode.value === 'direct') {
      if (formData.value.address.trim()) {
        finalNotes = finalNotes ? `Dirección: ${formData.value.address.trim()}\n\nNotas: ${finalNotes}` : `Dirección: ${formData.value.address.trim()}`
      }
      if (formData.value.phone.trim()) {
        finalNotes = `Teléfono: ${formData.value.phone.trim()}\n${finalNotes}`
      }
    }
    
    if (!authStore.isLoggedIn) {
      finalNotes = `Nombre: ${formData.value.name.trim()}\n${finalNotes}`
    }

    // 1. Guardar en Base de Datos (Logueado o Invitado)
    const orderPayload: any = {
      total_amount: cartStore.cartTotal,
      status: 'pending',
      delivery_date: formData.value.deliveryDate || null,
      delivery_time: formData.value.deliveryTime || null,
      notes: finalNotes || null
    }

    if (authStore.isLoggedIn && authStore.user) {
      orderPayload.profile_id = authStore.user.id
      
      // Actualizar el teléfono en el perfil si se proporcionó uno
      if (formData.value.phone.trim()) {
        await supabase
          .from('profiles')
          .update({ phone: formData.value.phone.trim() })
          .eq('id', authStore.user.id)
      }
    }

    // Insertar Order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
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
    }

    // 2. Generar mensaje de WhatsApp
    let message = `¡Hola Dulce Fe! Quiero hacer un pedido:\n\n`
    message += `*Datos del Cliente:*\n`
    message += `Nombre: ${formData.value.name.trim()}\n`
    
    if (checkoutMode.value === 'direct') {
      if (formData.value.phone.trim()) message += `Teléfono alternativo: ${formData.value.phone.trim()}\n`
      message += `Dirección: ${formData.value.address.trim()}\n`
      if (formData.value.deliveryDate) message += `Fecha: ${formData.value.deliveryDate}\n`
      if (formData.value.deliveryTime) message += `Hora: ${formData.value.deliveryTime}\n`
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
    
  } catch (error: any) {
    console.error('Error al procesar el pedido:', error)
    alert(`Hubo un problema al procesar tu pedido: ${error.message || JSON.stringify(error)}. Por favor, intenta de nuevo o contáctanos directamente.`)
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
        <NuxtLink to="/" class="w-10 h-10 flex items-center justify-center rounded-full border border-[#4A5D23]/20 bg-white text-[#2A321B] hover:bg-[#F4F1E1] transition-colors shadow-sm active:translate-y-0.5 active:shadow-none">
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <h1 class="text-3xl font-playfair font-black text-[#2A321B]">Finalizar Pedido</h1>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Formulario (Izquierda) -->
        <div class="lg:col-span-6 space-y-6">
          
          <!-- Selector de Modo -->
          <div class="bg-white border border-[#4A5D23]/20 rounded-2xl p-2 flex gap-2 shadow-sm">
            <button 
              @click="checkoutMode = 'direct'"
              :class="[
                'flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2',
                checkoutMode === 'direct' 
                  ? 'bg-[#4A5D23] text-white border border-[#4A5D23]/20 shadow-sm' 
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
                  ? 'bg-[#4A5D23] text-white border border-[#4A5D23]/20 shadow-sm' 
                  : 'bg-transparent text-[#4A5D23] hover:bg-[#F4F1E1]'
              ]"
            >
              <Icon name="lucide:message-circle" class="w-5 h-5" />
              Coordinar por Chat
            </button>
          </div>

          <div class="bg-white/90 backdrop-blur-md border border-[#4A5D23]/10 rounded-[2rem] p-8 shadow-md">
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
                  class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
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
                    class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
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
                    class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 resize-none"
                  ></textarea>
                </div>

                <!-- Fecha y Hora -->
                <div class="grid grid-cols-2 gap-4 animate-pop" style="animation-delay: 100ms;">
                  <!-- Selector de Fecha -->
                  <div class="space-y-2">
                    <label for="date" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Fecha</label>
                    <CustomDatePicker v-model="formData.deliveryDate" bgClass="bg-[#F4F1E1]" />
                  </div>

                  <!-- Selector de Hora -->
                  <div class="space-y-2">
                    <label for="time" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Hora Aprox.</label>
                    <CustomTimePicker v-model="formData.deliveryTime" bgClass="bg-[#F4F1E1]" />
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
                    class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 resize-none"
                  ></textarea>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Resumen (Derecha) -->
        <div class="lg:col-span-6">
          <div class="bg-[#2A321B] border border-[#4A5D23]/20 rounded-[2rem] p-8 shadow-md text-white sticky top-24">
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
