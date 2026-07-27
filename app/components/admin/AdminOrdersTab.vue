<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

const orders = ref<any[]>([])
const isLoading = ref(true)

// Definición de las columnas del Kanban
const columns = [
  { id: 'pending', title: 'Pendientes', color: 'bg-gradient-to-b from-yellow-50 to-yellow-100/50 border-yellow-200 text-yellow-800', icon: 'lucide:clock', headerColor: 'bg-yellow-100/80' },
  { id: 'processing', title: 'Horneando', color: 'bg-gradient-to-b from-orange-50 to-orange-100/50 border-orange-200 text-orange-800', icon: 'lucide:chef-hat', headerColor: 'bg-orange-100/80' },
  { id: 'ready', title: 'Listo para Despacho', color: 'bg-gradient-to-b from-blue-50 to-blue-100/50 border-blue-200 text-blue-800', icon: 'lucide:package', headerColor: 'bg-blue-100/80' },
  { id: 'completed', title: 'Entregado', color: 'bg-gradient-to-b from-green-50 to-green-100/50 border-green-200 text-green-800', icon: 'lucide:check-circle', headerColor: 'bg-green-100/80' }
]

const fetchOrders = async () => {
  isLoading.value = true
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles ( full_name, phone ),
        order_items (
          quantity,
          products ( name )
        )
      `)
      .order('created_at', { ascending: false })
      
    if (error) throw error
    orders.value = data || []
  } catch (err) {
    console.error('Error fetching orders:', err)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchOrders()
})

// Lógica de Drag and Drop
const draggedOrder = ref<any>(null)

const onDragStart = (order: any, event: DragEvent) => {
  draggedOrder.value = order
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', order.id)
  }
}

const onDrop = async (columnId: string, event: DragEvent) => {
  if (!draggedOrder.value) return
  
  const orderId = draggedOrder.value.id
  const oldStatus = draggedOrder.value.status
  const newStatus = columnId
  
  if (oldStatus === newStatus) return

  // Optimistic UI update
  const orderIndex = orders.value.findIndex(o => o.id === orderId)
  if (orderIndex !== -1) {
    orders.value[orderIndex].status = newStatus
  }

  try {
    // 1. Actualizar estado en la BD
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId)
      
    if (error) throw error

    // 2. Si pasa a "Horneando" (processing), ejecutar el trigger de inventario
    if (newStatus === 'processing' && oldStatus === 'pending') {
      const { error: rpcError } = await supabase.rpc('process_order_inventory', {
        order_uuid: orderId
      })
      if (rpcError) {
        console.error('Error al descontar inventario:', rpcError)
        alert('El pedido se movió a Horneando, pero hubo un error al descontar el inventario. Revisa la consola.')
      }
    }

    // 3. Si pasa a "Entregado" (completed), otorgar puntos de lealtad
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      const { error: pointsError } = await supabase.rpc('award_loyalty_points', {
        order_uuid: orderId
      })
      if (pointsError) {
        console.error('Error al otorgar puntos de lealtad:', pointsError)
        // No mostramos alert para no interrumpir el flujo, pero queda registrado
      }
    }
  } catch (err) {
    console.error('Error updating order status:', err)
    // Revertir cambio en UI si falla
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = oldStatus
    }
    alert('Hubo un error al mover el pedido.')
  } finally {
    draggedOrder.value = null
  }
}

const getOrdersByStatus = (status: string) => {
  return orders.value.filter(o => o.status === status)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-PE', { 
    day: '2-digit', month: 'short', 
    hour: '2-digit', minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-playfair font-black text-[#2A321B]">Tablero de Pedidos</h2>
      <button 
        @click="fetchOrders"
        class="flex items-center gap-2 px-4 py-2 bg-white border border-[#4A5D23]/20 rounded-xl font-bold text-sm shadow-sm hover:bg-[#F4F1E1] active:translate-y-0.5 active:shadow-none transition-all"
      >
        <Icon name="lucide:refresh-cw" :class="['w-4 h-4', isLoading ? 'animate-spin' : '']" />
        Actualizar
      </button>
    </div>

    <!-- Kanban Board -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-4 min-h-[600px]">
      
      <!-- Columnas -->
      <div 
        v-for="col in columns" 
        :key="col.id"
        :class="['border rounded-2xl flex flex-col shadow-sm overflow-hidden', col.color]"
        @dragover.prevent
        @dragenter.prevent
        @drop="onDrop(col.id, $event)"
      >
        <!-- Header de Columna -->
        <div :class="['p-4 border-b border-current/10 flex items-center gap-3 backdrop-blur-sm', col.headerColor]">
          <div class="p-1.5 bg-white/60 rounded-lg shadow-sm">
            <Icon :name="col.icon" class="w-4 h-4" />
          </div>
          <h3 class="font-bold uppercase tracking-wider text-xs flex-1">{{ col.title }}</h3>
          <span class="bg-white px-2.5 py-1 rounded-md text-xs font-black border border-current/10 shadow-sm">
            {{ getOrdersByStatus(col.id).length }}
          </span>
        </div>

        <!-- Lista de Tarjetas -->
        <div class="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
          
          <div v-if="isLoading && getOrdersByStatus(col.id).length === 0" class="text-center py-8 opacity-50">
            <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin mx-auto" />
          </div>

          <div v-else-if="getOrdersByStatus(col.id).length === 0" class="text-center py-8 opacity-50 border border-dashed border-[#4A5D23]/30 rounded-xl bg-white/50">
            <p class="text-xs font-bold uppercase tracking-widest text-[#4A5D23]">Vacío</p>
          </div>

          <!-- Tarjeta de Pedido -->
          <div 
            v-for="order in getOrdersByStatus(col.id)" 
            :key="order.id"
            draggable="true"
            @dragstart="onDragStart(order, $event)"
            class="bg-white border border-current/10 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-md transition-all shadow-sm group flex flex-col gap-3"
          >
            <!-- Header: Nombre y Precio -->
            <div class="flex justify-between items-start">
              <div>
                <h4 class="font-bold text-[#2A321B] text-sm group-hover:text-current transition-colors leading-tight">{{ order.profiles?.full_name || 'Cliente Anónimo' }}</h4>
                <p v-if="order.profiles?.phone" class="text-[10px] text-current/70 flex items-center gap-1 mt-1 font-medium">
                  <Icon name="lucide:phone" class="w-3 h-3" /> {{ order.profiles.phone }}
                </p>
              </div>
              <span class="font-black text-[#2A321B] bg-[#F4F1E1] px-2 py-1 rounded-md text-xs border border-[#4A5D23]/10 shrink-0">S/ {{ Number(order.total_amount).toFixed(2) }}</span>
            </div>

            <!-- Items del Pedido -->
            <div class="space-y-1.5 bg-current/5 p-2.5 rounded-lg border border-current/10">
              <div v-for="(item, idx) in order.order_items" :key="idx" class="text-[11px] font-medium flex items-start gap-2 text-[#2A321B]">
                <span class="font-black text-current bg-white px-1.5 py-0.5 rounded shadow-sm shrink-0">{{ item.quantity }}x</span>
                <span class="leading-tight pt-0.5">{{ item.products?.name }}</span>
              </div>
            </div>

            <!-- Footer: Fechas -->
            <div class="flex flex-col gap-1.5 pt-2 border-t border-dashed border-current/10 mt-auto">
              <div v-if="order.delivery_date || order.delivery_time" class="text-[10px] font-bold text-[#991B1B] flex items-center gap-1.5">
                <Icon name="lucide:calendar-clock" class="w-3.5 h-3.5" />
                Para: {{ order.delivery_date }} {{ order.delivery_time }}
              </div>
              <div class="text-[9px] font-bold text-current/60 uppercase tracking-wider flex items-center gap-1.5">
                <Icon name="lucide:clock-4" class="w-3 h-3" />
                Creado: {{ formatDate(order.created_at) }}
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
</style>
