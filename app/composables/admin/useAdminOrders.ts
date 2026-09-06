import { ref } from 'vue'
import type {
  AdminOrder,
  OrderStatus,
  KanbanColumn,
  StatusUpdateResult,
  AdminOrdersApiResponse
} from '../../types/admin-orders'

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'pending',
    title: 'Pendientes',
    color: 'bg-gradient-to-b from-yellow-50 to-yellow-100/50 border-yellow-200 text-yellow-800',
    icon: 'lucide:clock',
    headerColor: 'bg-yellow-100/80'
  },
  {
    id: 'processing',
    title: 'Horneando',
    color: 'bg-gradient-to-b from-orange-50 to-orange-100/50 border-orange-200 text-orange-800',
    icon: 'lucide:chef-hat',
    headerColor: 'bg-orange-100/80'
  },
  {
    id: 'ready',
    title: 'Listo para Despacho',
    color: 'bg-gradient-to-b from-blue-50 to-blue-100/50 border-blue-200 text-blue-800',
    icon: 'lucide:package',
    headerColor: 'bg-blue-100/80'
  },
  {
    id: 'completed',
    title: 'Entregado',
    color: 'bg-gradient-to-b from-green-50 to-green-100/50 border-green-200 text-green-800',
    icon: 'lucide:check-circle',
    headerColor: 'bg-green-100/80'
  }
]

export function formatAdminOrderDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export function getOrderCustomerName(order: AdminOrder | null | undefined): string {
  if (!order) return 'Cliente sin nombre'
  return order.profiles?.full_name || order.customer_name || 'Cliente sin nombre'
}

export function getOrderCustomerPhone(order: AdminOrder | null | undefined): string {
  if (!order) return ''
  return order.profiles?.phone || order.customer_phone || ''
}

export function filterOrdersByStatus(orders: AdminOrder[], status: OrderStatus): AdminOrder[] {
  if (!orders || !orders.length) return []
  return orders.filter((o: AdminOrder) => o.status === status)
}

export function useAdminOrders() {
  const orders = ref<AdminOrder[]>([])
  const isLoading = ref<boolean>(true)
  const viewMode = ref<'kanban' | 'list'>('kanban')
  const draggedOrder = ref<AdminOrder | null>(null)
  const errorMessage = ref<string>('')

  async function fetchOrders(): Promise<void> {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const res = await $fetch<AdminOrdersApiResponse>('/api/admin/orders')
      orders.value = res.data || []
    } catch (err: unknown) {
      const fetchErr = err as { data?: { error?: { message?: string } }; message?: string }
      errorMessage.value = fetchErr.data?.error?.message || fetchErr.message || 'Error al cargar pedidos.'
    } finally {
      isLoading.value = false
    }
  }

  function onDragStart(order: AdminOrder, event: DragEvent): void {
    draggedOrder.value = order
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', order.id)
    }
  }

  async function updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<boolean> {
    const orderIndex = orders.value.findIndex((o: AdminOrder) => o.id === orderId)
    if (orderIndex === -1) return false

    const previousStatus = orders.value[orderIndex]?.status
    if (previousStatus === newStatus) return true

    // Optimistic UI Update
    const currentOrder = orders.value[orderIndex]
    if (currentOrder) {
      currentOrder.status = newStatus
    }

    try {
      const result = await $fetch<StatusUpdateResult>(`/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        body: { status: newStatus }
      })

      if (result && currentOrder) {
        currentOrder.inventory_processed = result.inventory_processed
        currentOrder.points_awarded = result.points_awarded
      }
      return true
    } catch (err: unknown) {
      // Rollback
      if (currentOrder && previousStatus) {
        currentOrder.status = previousStatus
      }
      const fetchErr = err as { data?: { error?: { message?: string } }; message?: string }
      const msg = fetchErr.data?.error?.message || fetchErr.message || 'Hubo un error al mover el pedido.'
      errorMessage.value = msg
      return false
    }
  }

  async function onDrop(columnId: OrderStatus, _event: DragEvent): Promise<void> {
    if (!draggedOrder.value) return
    const order = draggedOrder.value
    draggedOrder.value = null
    await updateOrderStatus(order.id, columnId)
  }

  function getOrdersForColumn(status: OrderStatus): AdminOrder[] {
    return filterOrdersByStatus(orders.value, status)
  }

  return {
    orders,
    isLoading,
    viewMode,
    draggedOrder,
    errorMessage,
    columns: KANBAN_COLUMNS,
    fetchOrders,
    onDragStart,
    onDrop,
    updateOrderStatus,
    getOrdersForColumn,
    formatDate: formatAdminOrderDate,
    getCustomerName: getOrderCustomerName,
    getCustomerPhone: getOrderCustomerPhone
  }
}
