<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from '~/stores/auth'
import { useSupabaseClient } from '#imports'
import { useCartStore } from '~/stores/cart'

const authStore = useAuthStore()
const supabase = useSupabaseClient()
const cartStore = useCartStore()

// Redirigir si no está logueado
if (import.meta.client && !authStore.isLoggedIn) {
  navigateTo('/cuenta', { replace: true })
}

const activeTab = ref<'history' | 'addresses' | 'points'>('history')
const showAddressModal = ref(false)

const newAddress = ref({
  id: '',
  label: '',
  address_line: '',
  reference: ''
})
const isSavingAddress = ref(false)
const isDeletingAddress = ref<string | null>(null)

const openNewAddressModal = () => {
  newAddress.value = { id: '', label: '', address_line: '', reference: '' }
  showAddressModal.value = true
}

const openEditAddressModal = (address: any) => {
  // Intentar extraer la referencia si existe en el formato " (Ref: ...)"
  let addressLine = address.address_line
  let reference = ''
  const refMatch = addressLine.match(/ \(Ref: (.*?)\)$/)
  if (refMatch) {
    reference = refMatch[1]
    addressLine = addressLine.replace(refMatch[0], '')
  }

  newAddress.value = {
    id: address.id,
    label: address.label,
    address_line: addressLine,
    reference: reference
  }
  showAddressModal.value = true
}

const handleDeleteAddress = async (id: string) => {
  if (!confirm('¿Estás seguro de que deseas eliminar esta dirección?')) return
  
  isDeletingAddress.value = id
  const result = await authStore.deleteAddress(id)
  isDeletingAddress.value = null
  
  if (!result?.success) {
    alert('Error al eliminar la dirección: ' + result?.error)
  }
}

const handleSaveAddress = async () => {
  if (!newAddress.value.label || !newAddress.value.address_line) return
  
  isSavingAddress.value = true
  
  if (newAddress.value.id) {
    // Lógica de actualización (requiere un método updateAddress en el store)
    // Por ahora, eliminamos y recreamos para simplificar
    await authStore.deleteAddress(newAddress.value.id)
  }
  
  const result = await authStore.saveAddress(newAddress.value)
  isSavingAddress.value = false
  
  if (result?.success) {
    showAddressModal.value = false
    newAddress.value = { id: '', label: '', address_line: '', reference: '' }
  } else {
    alert('Error al guardar la dirección: ' + result?.error)
  }
}

const logout = async () => {
  await supabase.auth.signOut()
  authStore.setUser(null)
  navigateTo('/')
}

const orders = ref<any[]>([])
const isLoadingOrders = ref(true)

const fetchOrders = async () => {
  if (!authStore.user) return
  isLoadingOrders.value = true
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          quantity,
          price_at_time,
          products (
            id,
            name,
            image_url
          )
        )
      `)
      .eq('profile_id', authStore.user.id)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    orders.value = data || []
  } catch (err) {
    console.error('Error fetching orders:', err)
  } finally {
    isLoadingOrders.value = false
  }
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    fetchOrders()
  }
})

const reorder = (order: any) => {
  // Limpiar carrito actual
  cartStore.clearCart()
  
  // Añadir items del pedido anterior
  order.order_items.forEach((item: any) => {
    if (item.products) {
      cartStore.addToCart({
        id: item.products.id,
        name: item.products.name,
        price: item.price_at_time,
        image_url: item.products.image_url
      }, item.quantity)
    }
  })
  
  // Ir al checkout
  navigateTo('/checkout')
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-PE', { 
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}

const getStatusColor = (status: string) => {
  switch(status) {
    case 'completed': return 'bg-[#84cc16]/20 text-[#4A5D23]'
    case 'pending': return 'bg-yellow-500/20 text-yellow-700'
    case 'cancelled': return 'bg-red-500/20 text-red-700'
    default: return 'bg-gray-500/20 text-gray-700'
  }
}

const getStatusText = (status: string) => {
  switch(status) {
    case 'completed': return 'Completado'
    case 'pending': return 'Pendiente'
    case 'cancelled': return 'Cancelado'
    default: return status
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] py-12 px-6">
    <div class="max-w-5xl mx-auto">
      
      <!-- Header Simple -->
      <div class="flex items-center justify-between mb-10">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="w-10 h-10 flex items-center justify-center rounded-full border border-[#4A5D23]/20 bg-white text-[#2A321B] hover:bg-[#F4F1E1] transition-colors shadow-sm">
            <Icon name="lucide:arrow-left" class="w-5 h-5" />
          </NuxtLink>
          <h1 class="text-3xl font-playfair font-black text-[#2A321B]">Mi Perfil</h1>
        </div>
        <button 
          @click="logout"
          class="flex items-center gap-2 text-[#991B1B] font-bold hover:text-[#7a1515] transition-colors"
        >
          <Icon name="lucide:log-out" class="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <!-- Sidebar (Navegación) -->
        <div class="lg:col-span-4 space-y-6">
          
          <!-- Tarjeta de Usuario -->
          <div class="bg-white border border-[#4A5D23]/10 rounded-[2rem] p-6 shadow-md">
            <div class="w-16 h-16 bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <Icon name="lucide:user" class="w-8 h-8 text-[#4A5D23]" />
            </div>
            <h2 class="text-xl font-black font-playfair mb-1">{{ authStore.user?.user_metadata?.full_name || 'Usuario' }}</h2>
            <p class="text-sm text-[#4A5D23] font-medium">{{ authStore.user?.email }}</p>
            
            <div class="mt-6 pt-6 border-t border-[#4A5D23]/10">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm uppercase tracking-wider">Puntos Dulce Fe</span>
                <span class="text-2xl font-black text-[#84cc16]">{{ authStore.profile?.points || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Menú -->
          <div class="bg-white border border-[#4A5D23]/10 rounded-[2rem] p-4 shadow-md flex flex-col gap-2">
            <button 
              @click="activeTab = 'history'"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left',
                activeTab === 'history' ? 'bg-[#4A5D23] text-white' : 'hover:bg-[#F4F1E1] text-[#2A321B]'
              ]"
            >
              <Icon name="lucide:history" class="w-5 h-5" />
              Historial de Pedidos
            </button>
            <button 
              @click="activeTab = 'addresses'"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left',
                activeTab === 'addresses' ? 'bg-[#4A5D23] text-white' : 'hover:bg-[#F4F1E1] text-[#2A321B]'
              ]"
            >
              <Icon name="lucide:map-pin" class="w-5 h-5" />
              Mis Direcciones
            </button>
            <button 
              @click="activeTab = 'points'"
              :class="[
                'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left',
                activeTab === 'points' ? 'bg-[#4A5D23] text-white' : 'hover:bg-[#F4F1E1] text-[#2A321B]'
              ]"
            >
              <Icon name="lucide:star" class="w-5 h-5" />
              Programa de Lealtad
            </button>
          </div>
        </div>

        <!-- Contenido Principal -->
        <div class="lg:col-span-8">
          <div class="bg-white border border-[#4A5D23]/10 rounded-[2rem] p-8 shadow-md min-h-[400px]">
            
            <!-- Tab: Historial -->
            <div v-if="activeTab === 'history'" class="animate-pop">
              <h2 class="text-2xl font-playfair font-bold mb-6">Tus Pedidos Anteriores</h2>
              
              <div v-if="isLoadingOrders" class="flex justify-center py-12">
                <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-[#4A5D23]" />
              </div>
              
              <div v-else-if="orders.length === 0" class="text-center py-12">
                <Icon name="lucide:shopping-bag" class="w-16 h-16 text-[#4A5D23]/20 mx-auto mb-4" />
                <p class="text-[#4A5D23] font-medium">Aún no tienes pedidos en tu historial.</p>
                <NuxtLink to="/menu" class="inline-block mt-4 text-[#84cc16] font-bold hover:underline">Ir a comprar</NuxtLink>
              </div>
              
              <!-- Lista de pedidos -->
              <div v-else class="space-y-6">
                <div 
                  v-for="order in orders" 
                  :key="order.id"
                  class="border border-[#4A5D23]/20 rounded-2xl p-5 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <div class="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-[#4A5D23]/10">
                    <div>
                      <p class="text-xs font-bold text-[#4A5D23] uppercase tracking-wider mb-1">{{ formatDate(order.created_at) }}</p>
                      <div class="flex items-center gap-2">
                        <span class="font-black text-lg">S/ {{ Number(order.total_amount).toFixed(2) }}</span>
                        <span :class="['px-2 py-0.5 rounded-md text-xs font-bold', getStatusColor(order.status)]">
                          {{ getStatusText(order.status) }}
                        </span>
                      </div>
                    </div>
                    <button 
                      @click="reorder(order)"
                      class="bg-[#4A5D23] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#3C4A1C] transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                    >
                      <Icon name="lucide:refresh-cw" class="w-4 h-4" />
                      Volver a pedir
                    </button>
                  </div>
                  
                  <div class="space-y-3">
                    <div v-for="item in order.order_items" :key="item.products?.id" class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-[#F4F1E1] border border-[#4A5D23]/10 overflow-hidden shrink-0">
                        <img v-if="item.products?.image_url" :src="item.products.image_url" class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]/50">
                          <Icon name="lucide:croissant" class="w-5 h-5" />
                        </div>
                      </div>
                      <div class="flex-1">
                        <p class="font-bold text-sm">{{ item.products?.name || 'Producto eliminado' }}</p>
                        <p class="text-xs text-[#4A5D23] font-medium">{{ item.quantity }}x S/ {{ Number(item.price_at_time).toFixed(2) }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Direcciones -->
            <div v-if="activeTab === 'addresses'" class="animate-pop">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-playfair font-bold">Mis Direcciones</h2>
                <button @click="openNewAddressModal" class="bg-[#4A5D23] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#3C4A1C] transition-colors shadow-sm hover:shadow-md flex items-center gap-2">
                  <Icon name="lucide:plus" class="w-4 h-4" />
                  Nueva Dirección
                </button>
              </div>
              
              <div v-if="authStore.addresses.length === 0" class="text-center py-12 border border-dashed border-[#4A5D23]/30 rounded-2xl bg-[#F4F1E1]/30">
                <Icon name="lucide:map" class="w-12 h-12 text-[#4A5D23]/20 mx-auto mb-4" />
                <p class="text-[#4A5D23] font-medium">No tienes direcciones guardadas.</p>
              </div>
              
              <div v-else class="flex flex-col gap-4">
                <div 
                  v-for="address in authStore.addresses" 
                  :key="address.id"
                  class="border border-[#4A5D23]/20 rounded-2xl p-5 bg-white shadow-sm flex items-start gap-4 relative group"
                >
                  <div class="w-10 h-10 rounded-full bg-[#F4F1E1] flex items-center justify-center text-[#4A5D23] shrink-0">
                    <Icon name="lucide:map-pin" class="w-5 h-5" />
                  </div>
                  <div class="flex-1 pr-12">
                    <h3 class="font-bold text-[#2A321B] mb-1">{{ address.label }}</h3>
                    <p class="text-sm text-[#4A5D23] leading-relaxed">{{ address.address_line }}</p>
                  </div>
                  
                  <!-- Acciones (Editar/Eliminar) -->
                  <div class="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      @click="openEditAddressModal(address)"
                      class="w-8 h-8 rounded-full bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center hover:bg-[#4A5D23] hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Icon name="lucide:pencil" class="w-4 h-4" />
                    </button>
                    <button 
                      @click="handleDeleteAddress(address.id)"
                      :disabled="isDeletingAddress === address.id"
                      class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Icon v-if="isDeletingAddress === address.id" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                      <Icon v-else name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Puntos -->
            <div v-if="activeTab === 'points'" class="animate-pop">
              <h2 class="text-2xl font-playfair font-bold mb-6">Programa de Lealtad</h2>
              
              <div class="bg-[#F4F1E1]/50 border border-[#4A5D23]/20 rounded-2xl p-6 text-center shadow-sm">
                <Icon name="lucide:award" class="w-16 h-16 text-[#84cc16] mx-auto mb-4" />
                <h3 class="text-xl font-bold mb-2">¡Tienes {{ authStore.profile?.points || 0 }} Puntos Dulce Fe!</h3>
                <p class="text-sm text-[#4A5D23] max-w-md mx-auto">
                  Acumulas 1 punto por cada S/ 1.00 de compra. Podrás canjear tus puntos por descuentos exclusivos, envíos gratis o postres sorpresa de regalo en tus próximos pedidos.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Modal de Nueva Dirección -->
    <div v-if="showAddressModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-3xl p-8 max-w-xl w-full shadow-xl animate-pop relative">
        <button @click="showAddressModal = false" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-[#F4F1E1] text-[#2A321B] hover:bg-[#e6e2cc] transition-colors">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
        <h3 class="text-2xl font-playfair font-bold mb-6">{{ newAddress.id ? 'Editar Dirección' : 'Nueva Dirección' }}</h3>
        <div class="space-y-5">
          <div>
            <label class="block text-sm font-bold mb-2">Nombre de la dirección (Ej. Casa, Trabajo)</label>
            <input v-model="newAddress.label" type="text" class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4A5D23] transition-colors" placeholder="Mi Casa">
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Dirección completa</label>
            <textarea v-model="newAddress.address_line" rows="3" class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4A5D23] transition-colors resize-none" placeholder="Av. Los Pinos 123, Dpto 402, Distrito, Ciudad..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-bold mb-2">Referencia</label>
            <input v-model="newAddress.reference" type="text" class="w-full bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl px-4 py-3 focus:outline-none focus:border-[#4A5D23] transition-colors" placeholder="Frente al parque">
          </div>
          <button 
            @click="handleSaveAddress" 
            :disabled="isSavingAddress || !newAddress.label || !newAddress.address_line"
            class="w-full bg-[#4A5D23] text-white font-bold py-4 rounded-xl mt-2 hover:bg-[#3C4A1C] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Icon v-if="isSavingAddress" name="lucide:loader-2" class="w-5 h-5 animate-spin" />
            {{ isSavingAddress ? 'Guardando...' : 'Guardar Dirección' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
