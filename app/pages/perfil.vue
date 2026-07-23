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
  navigateTo('/cuenta')
}

const activeTab = ref<'history' | 'addresses' | 'points'>('history')

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
          <NuxtLink to="/" class="w-10 h-10 flex items-center justify-center rounded-full border-2 border-[#2A321B] bg-white text-[#2A321B] hover:bg-[#F4F1E1] transition-colors shadow-[2px_2px_0px_#2A321B] active:translate-y-0.5 active:shadow-none">
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
          <div class="bg-white border-2 border-[#2A321B] rounded-[2rem] p-6 shadow-[6px_6px_0px_#4A5D23]">
            <div class="w-16 h-16 bg-[#F4F1E1] border-2 border-[#2A321B] rounded-full flex items-center justify-center mb-4 shadow-[2px_2px_0px_#2A321B]">
              <Icon name="lucide:user" class="w-8 h-8 text-[#4A5D23]" />
            </div>
            <h2 class="text-xl font-black font-playfair mb-1">{{ authStore.user?.user_metadata?.full_name || 'Usuario' }}</h2>
            <p class="text-sm text-[#4A5D23] font-medium">{{ authStore.user?.email }}</p>
            
            <div class="mt-6 pt-6 border-t-2 border-[#2A321B]/10">
              <div class="flex items-center justify-between">
                <span class="font-bold text-sm uppercase tracking-wider">Puntos Dulce Fe</span>
                <span class="text-2xl font-black text-[#84cc16]">{{ authStore.profile?.points || 0 }}</span>
              </div>
            </div>
          </div>

          <!-- Menú -->
          <div class="bg-white border-2 border-[#2A321B] rounded-[2rem] p-4 shadow-[6px_6px_0px_#4A5D23] flex flex-col gap-2">
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
          <div class="bg-white border-2 border-[#2A321B] rounded-[2rem] p-8 shadow-[6px_6px_0px_#4A5D23] min-h-[400px]">
            
            <!-- Tab: Historial -->
            <div v-if="activeTab === 'history'" class="animate-pop">
              <h2 class="text-2xl font-playfair font-bold mb-6">Tus Pedidos Anteriores</h2>
              
              <div v-if="isLoadingOrders" class="flex justify-center py-12">
                <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-[#4A5D23]" />
              </div>
              
              <div v-else-if="orders.length === 0" class="text-center py-12">
                <Icon name="lucide:shopping-bag" class="w-16 h-16 text-[#4A5D23]/20 mx-auto mb-4" />
                <p class="text-[#4A5D23] font-medium">Aún no tienes pedidos en tu historial.</p>
                <NuxtLink to="/" class="inline-block mt-4 text-[#84cc16] font-bold hover:underline">Ir a comprar</NuxtLink>
              </div>
              
              <!-- Lista de pedidos -->
              <div v-else class="space-y-6">
                <div 
                  v-for="order in orders" 
                  :key="order.id"
                  class="border-2 border-[#2A321B] rounded-2xl p-5 bg-[#F4F1E1]/50"
                >
                  <div class="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b-2 border-[#2A321B]/10">
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
                      class="bg-[#2A321B] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#4A5D23] transition-colors flex items-center gap-2 shadow-[2px_2px_0px_#4A5D23] active:translate-y-0.5 active:shadow-none"
                    >
                      <Icon name="lucide:refresh-cw" class="w-4 h-4" />
                      Volver a pedir
                    </button>
                  </div>
                  
                  <div class="space-y-3">
                    <div v-for="item in order.order_items" :key="item.products?.id" class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-lg bg-white border border-[#2A321B]/20 overflow-hidden shrink-0">
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
                <button class="bg-[#2A321B] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#4A5D23] transition-colors shadow-[2px_2px_0px_#4A5D23] active:translate-y-0.5 active:shadow-none">
                  + Nueva Dirección
                </button>
              </div>
              
              <div v-if="authStore.addresses.length === 0" class="text-center py-12 border-2 border-dashed border-[#2A321B]/20 rounded-2xl">
                <Icon name="lucide:map" class="w-12 h-12 text-[#4A5D23]/20 mx-auto mb-4" />
                <p class="text-[#4A5D23] font-medium">No tienes direcciones guardadas.</p>
              </div>
            </div>

            <!-- Tab: Puntos -->
            <div v-if="activeTab === 'points'" class="animate-pop">
              <h2 class="text-2xl font-playfair font-bold mb-6">Programa de Lealtad</h2>
              
              <div class="bg-[#F4F1E1] border-2 border-[#2A321B] rounded-2xl p-6 text-center shadow-[4px_4px_0px_#4A5D23]">
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
  </div>
</template>
