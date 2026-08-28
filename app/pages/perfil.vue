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
  navigateTo('/login', { replace: true })
}

interface AddressItem {
  id: string
  label: string
  address_line: string
}

interface OrderItem {
  id: string
  created_at: string
  status: string
  total_amount: number
  order_items?: Array<{
    id: string
    quantity: number
    unit_price: number
    products?: {
      name: string
      image_url?: string | null
    } | null
  }>
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

const openEditAddressModal = (address: AddressItem) => {
  let addressLine = address.address_line || ''
  let reference = ''
  const refMatch = addressLine.match(/ \(Ref: (.*?)\)$/)
  if (refMatch && refMatch[1] && refMatch[0]) {
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
    await authStore.updateAddress(newAddress.value.id, {
      label: newAddress.value.label,
      address_line: newAddress.value.address_line,
      reference: newAddress.value.reference
    })
  } else {
    await authStore.addAddress({
      label: newAddress.value.label,
      address_line: newAddress.value.address_line,
      reference: newAddress.value.reference
    })
  }
  
  isSavingAddress.value = false
  showAddressModal.value = false
}

// Historial de Pedidos
const orders = ref<OrderItem[]>([])
const isLoadingOrders = ref(false)
const selectedOrder = ref<OrderItem | null>(null)
const showOrderDetailsModal = ref(false)

const fetchOrders = async () => {
  if (!authStore.user) return
  isLoadingOrders.value = true
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      created_at,
      status,
      total_amount,
      order_items (
        id,
        quantity,
        unit_price,
        products (
          name,
          image_url
        )
      )
    `)
    .eq('profile_id', authStore.user.id)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching orders:', error)
  } else {
    orders.value = (data as unknown as OrderItem[]) || []
  }
  isLoadingOrders.value = false
}

const openOrderDetails = (order: OrderItem) => {
  selectedOrder.value = order
  showOrderDetailsModal.value = true
}

const logout = async () => {
  await supabase.auth.signOut()
  cartStore.clearCart()
  navigateTo('/login')
}

onMounted(() => {
  if (authStore.isLoggedIn) {
    authStore.fetchAddresses()
    fetchOrders()
  }
})

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-status-success/20 text-brand-secondary border-status-success/30'
    case 'in_delivery': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'preparing': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'cancelled': return 'bg-red-100 text-status-danger border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Entregado'
    case 'in_delivery': return 'En camino'
    case 'preparing': return 'En preparación'
    case 'pending': return 'Pendiente'
    case 'cancelled': return 'Cancelado'
    default: return status
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto py-10 px-6">
    
    <!-- Encabezado de Perfil -->
    <div class="flex items-center justify-between mb-8">
      <div class="flex items-center gap-4">
        <NuxtLink to="/" class="w-10 h-10 flex items-center justify-center rounded-full border border-brand-primary/20 bg-surface text-brand-secondary hover:bg-brand-cream transition-colors shadow-soft-sm">
          <Icon name="lucide:arrow-left" class="w-5 h-5" />
        </NuxtLink>
        <div>
          <h1 class="text-3xl font-playfair font-black text-brand-secondary">Mi Cuenta</h1>
          <p class="text-xs text-brand-primary font-medium mt-0.5">Gestiona tus pedidos, direcciones y puntos acumulados</p>
        </div>
      </div>
      <button 
        @click="logout"
        class="flex items-center gap-2 text-status-danger font-bold hover:opacity-80 transition-opacity text-sm cursor-pointer"
      >
        <Icon name="lucide:log-out" class="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      <!-- Sidebar (Navegación) -->
      <div class="lg:col-span-4 space-y-6">
        
        <!-- Tarjeta de Usuario -->
        <div class="bg-surface border border-brand-primary/10 rounded-[2rem] p-6 shadow-soft-md">
          <div class="w-16 h-16 bg-brand-cream border border-brand-primary/20 rounded-full flex items-center justify-center mb-4 shadow-soft-sm">
            <Icon name="lucide:user" class="w-8 h-8 text-brand-primary" />
          </div>
          <h2 class="text-xl font-black font-playfair mb-1 text-brand-secondary">{{ authStore.user?.user_metadata?.full_name || 'Cliente Dulce Fe' }}</h2>
          <p class="text-sm text-brand-primary font-medium truncate">{{ authStore.user?.email }}</p>
          
          <div class="mt-6 pt-6 border-t border-brand-primary/10">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm uppercase tracking-wider text-brand-secondary">Puntos Dulce Fe</span>
              <span class="text-2xl font-black text-brand-primary">{{ authStore.profile?.points || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Menú de Pestañas -->
        <div class="bg-surface border border-brand-primary/10 rounded-[2rem] p-4 shadow-soft-md flex flex-col gap-2">
          <button 
            @click="activeTab = 'history'"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer text-sm',
              activeTab === 'history' ? 'bg-brand-primary text-white' : 'hover:bg-brand-cream text-brand-secondary'
            ]"
          >
            <Icon name="lucide:history" class="w-4 h-4" />
            Historial de Pedidos
          </button>
          <button 
            @click="activeTab = 'addresses'"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer text-sm',
              activeTab === 'addresses' ? 'bg-brand-primary text-white' : 'hover:bg-brand-cream text-brand-secondary'
            ]"
          >
            <Icon name="lucide:map-pin" class="w-4 h-4" />
            Mis Direcciones
          </button>
          <button 
            @click="activeTab = 'points'"
            :class="[
              'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer text-sm',
              activeTab === 'points' ? 'bg-brand-primary text-white' : 'hover:bg-brand-cream text-brand-secondary'
            ]"
          >
            <Icon name="lucide:star" class="w-4 h-4" />
            Programa de Lealtad
          </button>
        </div>

      </div>

      <!-- Contenido Principal -->
      <div class="lg:col-span-8">
        <div class="bg-surface border border-brand-primary/10 rounded-[2rem] p-8 shadow-soft-md min-h-[400px]">
          
          <!-- Tab: Historial -->
          <div v-if="activeTab === 'history'" class="animate-pop">
            <h2 class="text-2xl font-playfair font-bold mb-6 text-brand-secondary">Historial de Pedidos</h2>
            
            <div v-if="isLoadingOrders" class="flex justify-center py-12">
              <Icon name="lucide:loader-2" class="w-8 h-8 text-brand-primary animate-spin" />
            </div>

            <div v-else-if="orders.length === 0" class="text-center py-12 text-brand-primary">
              <Icon name="lucide:shopping-bag" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p class="font-bold text-sm">Aún no has realizado ningún pedido.</p>
              <NuxtLink to="/menu" class="inline-block mt-4 text-xs font-bold text-white bg-brand-primary px-6 py-2.5 rounded-full hover:bg-brand-secondary transition-all">
                Ir a la Carta
              </NuxtLink>
            </div>

            <div v-else class="space-y-4">
              <div 
                v-for="order in orders" 
                :key="order.id"
                @click="openOrderDetails(order)"
                class="border border-brand-primary/10 rounded-2xl p-5 hover:border-brand-primary/40 transition-all cursor-pointer bg-brand-cream/30 hover:bg-brand-cream/60 flex items-center justify-between"
              >
                <div>
                  <div class="flex items-center gap-3 mb-1">
                    <span class="font-bold text-sm text-brand-secondary">Pedido #{{ order.id.slice(0, 8) }}</span>
                    <span :class="['text-[11px] font-bold px-2.5 py-0.5 rounded-full border', getStatusBadge(order.status)]">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </div>
                  <p class="text-xs text-brand-primary/80">
                    {{ new Date(order.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-xs text-brand-primary block">Total</span>
                  <span class="text-lg font-black font-inter text-brand-secondary">S/ {{ Number(order.total_amount).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Direcciones -->
          <div v-if="activeTab === 'addresses'" class="animate-pop">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-playfair font-bold text-brand-secondary">Mis Direcciones</h2>
              <button 
                @click="openNewAddressModal"
                class="flex items-center gap-1.5 text-xs font-bold bg-brand-primary text-white px-4 py-2 rounded-full hover:bg-brand-secondary transition-all cursor-pointer shadow-soft-sm"
              >
                <Icon name="lucide:plus" class="w-4 h-4" />
                Nueva Dirección
              </button>
            </div>

            <div v-if="authStore.addresses.length === 0" class="text-center py-12 text-brand-primary">
              <Icon name="lucide:map-pin" class="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p class="font-bold text-sm">No tienes direcciones guardadas.</p>
            </div>

            <div v-else class="space-y-4">
              <div 
                v-for="address in authStore.addresses" 
                :key="address.id"
                class="border border-brand-primary/10 rounded-2xl p-5 flex items-start gap-4 relative group bg-brand-cream/30"
              >
                <div class="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-brand-primary shrink-0 shadow-soft-sm">
                  <Icon name="lucide:home" class="w-5 h-5" />
                </div>
                <div class="flex-1 pr-12">
                  <h3 class="font-bold text-brand-secondary mb-1 text-sm">{{ address.label }}</h3>
                  <p class="text-xs text-brand-primary/90 leading-relaxed">{{ address.address_line }}</p>
                </div>
                
                <div class="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    @click="openEditAddressModal(address)"
                    class="w-8 h-8 rounded-full bg-surface text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-colors cursor-pointer shadow-soft-sm"
                    title="Editar"
                  >
                    <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
                  </button>
                  <button 
                    @click="handleDeleteAddress(address.id)"
                    :disabled="isDeletingAddress === address.id"
                    class="w-8 h-8 rounded-full bg-red-50 text-status-danger flex items-center justify-center hover:bg-status-danger hover:text-white transition-colors disabled:opacity-50 cursor-pointer shadow-soft-sm"
                    title="Eliminar"
                  >
                    <Icon v-if="isDeletingAddress === address.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                    <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Puntos -->
          <div v-if="activeTab === 'points'" class="animate-pop">
            <h2 class="text-2xl font-playfair font-bold mb-6 text-brand-secondary">Programa de Lealtad</h2>
            
            <div class="bg-brand-cream/50 border border-brand-primary/20 rounded-2xl p-6 text-center shadow-soft-sm">
              <Icon name="lucide:award" class="w-16 h-16 text-brand-primary mx-auto mb-4" />
              <h3 class="text-xl font-bold mb-2 text-brand-secondary">¡Tienes {{ authStore.profile?.points || 0 }} Puntos Dulce Fe!</h3>
              <p class="text-xs text-brand-primary/80 max-w-md mx-auto leading-relaxed font-medium">
                Acumulas 1 punto por cada S/ 1.00 de compra. Podrás canjear tus puntos por descuentos exclusivos, envíos gratis o postres sorpresa de regalo en tus próximos pedidos.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>

    <!-- Modales -->
    <CustomerOrderDetailsModal 
      :show="showOrderDetailsModal" 
      :order="selectedOrder" 
      @close="showOrderDetailsModal = false" 
    />

    <!-- Modal de Dirección -->
    <div v-if="showAddressModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-surface rounded-3xl p-8 max-w-xl w-full shadow-soft-lg animate-pop relative max-h-[85vh] overflow-y-auto custom-scrollbar">
        <button @click="showAddressModal = false" class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-brand-cream text-brand-secondary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
        <h3 class="text-2xl font-playfair font-bold mb-6 text-brand-secondary">{{ newAddress.id ? 'Editar Dirección' : 'Nueva Dirección' }}</h3>
        <div class="space-y-5">
          <div>
            <label class="block text-xs font-bold mb-2 uppercase tracking-wider text-brand-secondary">Nombre de la dirección</label>
            <input v-model="newAddress.label" type="text" class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary text-sm font-medium text-brand-secondary transition-colors" placeholder="Ej. Casa, Trabajo">
          </div>
          <div>
            <label class="block text-xs font-bold mb-2 uppercase tracking-wider text-brand-secondary">Dirección completa</label>
            <textarea v-model="newAddress.address_line" rows="3" class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary text-sm font-medium text-brand-secondary transition-colors resize-none" placeholder="Av. Los Pinos 123, Dpto 402..."></textarea>
          </div>
          <div>
            <label class="block text-xs font-bold mb-2 uppercase tracking-wider text-brand-secondary">Referencia</label>
            <input v-model="newAddress.reference" type="text" class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary text-sm font-medium text-brand-secondary transition-colors" placeholder="Frente al parque principal">
          </div>
          <button 
            @click="handleSaveAddress" 
            :disabled="isSavingAddress || !newAddress.label || !newAddress.address_line"
            class="w-full bg-brand-primary text-white font-bold py-4 rounded-xl mt-2 hover:bg-brand-secondary transition-colors shadow-soft-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
          >
            <Icon v-if="isSavingAddress" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            {{ isSavingAddress ? 'Guardando...' : 'Guardar Dirección' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
