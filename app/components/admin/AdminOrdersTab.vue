<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

const orders = ref<any[]>([])
const isLoading = ref(true)

// Definición de las columnas del Kanban
const columns = [
  { id: 'pending', title: 'Pendientes', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', icon: 'lucide:clock' },
  { id: 'processing', title: 'Horneando', color: 'bg-orange-100 border-orange-400 text-orange-800', icon: 'lucide:chef-hat' },
  { id: 'ready', title: 'Listo para Despacho', color: 'bg-blue-100 border-blue-400 text-blue-800', icon: 'lucide:package' },
  { id: 'completed', title: 'Entregado', color: 'bg-[#84cc16]/20 border-[#4A5D23] text-[#4A5D23]', icon: 'lucide:check-circle' }
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
        class="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#2A321B] rounded-xl font-bold text-sm shadow-[2px_2px_0px_#2A321B] hover:bg-[#F4F1E1] active:translate-y-0.5 active:shadow-none transition-all"
      >
        <Icon name="lucide:refresh-cw" :class="['w-4 h-4', isLoading ? 'animate-spin' : '']" />
        Actualizar
      </button>
    </div>

    <!-- Kanban Board -->
    <div class="flex gap-6 overflow-x-auto pb-4 min-h-[600px]">
      
      <!-- Columnas -->
      <div 
        v-for="col in columns" 
        :key="col.id"
        class="flex-shrink-0 w-80 bg-[#F4F1E1] border-2 border-[#2A321B] rounded-2xl flex flex-col shadow-[4px_4px_0px_#2A321B]"
        @dragover.prevent
        @dragenter.prevent
        @drop="onDrop(col.id, $event)"
      >
        <!-- Header de Columna -->
        <div :class="['p-4 border-b-2 border-[#2A321B] rounded-t-xl flex items-center gap-3', col.color]">
          <Icon :name="col.icon" class="w-5 h-5" />
          <h3 class="font-bold uppercase tracking-wider text-sm flex-1">{{ col.title }}</h3>
          <span class="bg-white/50 px-2 py-0.5 rounded-md text-xs font-black border border-current">
            {{ getOrdersByStatus(col.id).length }}
          </span>
        </div>

        <!-- Lista de Tarjetas -->
        <div class="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
          
          <div v-if="isLoading && getOrdersByStatus(col.id).length === 0" class="text-center py-8 opacity-50">
            <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin mx-auto" />
          </div>

          <div v-else-if="getOrdersByStatus(col.id).length === 0" class="text-center py-8 opacity-50 border-2 border-dashed border-[#2A321B]/20 rounded-xl">
            <p class="text-xs font-bold uppercase tracking-widest">Vacío</p>
          </div>

          <!-- Tarjeta de Pedido -->
          <div 
            v-for="order in getOrdersByStatus(col.id)" 
            :key="order.id"
            draggable="true"
            @dragstart="onDragStart(order, $event)"
            class="bg-white border-2 border-[#2A321B] rounded-xl p-4 cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-[4px_4px_0px_#2A321B] transition-all"
          >
            <div class="flex justify-between items-start mb-2">
              <span class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider bg-[#F4F1E1] px-2 py-1 rounded-md border border-[#4A5D23]/20">
                {{ formatDate(order.created_at) }}
              </span>
              <span class="font-black text-[#2A321B]">S/ {{ Number(order.total_amount).toFixed(2) }}</span>
            </div>
            
            <h4 class="font-bold text-[#2A321B] mb-1">{{ order.profiles?.full_name || 'Cliente Anónimo' }}</h4>
            <p v-if="order.profiles?.phone" class="text-xs text-[#4A5D23] flex items-center gap-1 mb-3">
              <Icon name="lucide:phone" class="w-3 h-3" /> {{ order.profiles.phone }}
            </p>

            <div class="space-y-1 mb-3">
              <div v-for="(item, idx) in order.order_items" :key="idx" class="text-xs font-medium flex items-start gap-2">
                <span class="font-bold text-[#4A5D23]">{{ item.quantity }}x</span>
                <span class="leading-tight">{{ item.products?.name }}</span>
              </div>
            </div>

            <div v-if="order.delivery_date || order.delivery_time" class="pt-3 border-t-2 border-dashed border-[#2A321B]/10 text-xs font-bold text-[#991B1B] flex items-center gap-1">
              <Icon name="lucide:calendar-clock" class="w-3.5 h-3.5" />
              Para: {{ order.delivery_date }} {{ order.delivery_time }}
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
