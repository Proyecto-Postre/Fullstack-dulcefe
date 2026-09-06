import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { Database } from '~/types/database.types'
import type { ProfileOrder } from '~/types/profile'
import { useAuthStore } from '~/stores/auth'

export function useProfileOrders() {
  const authStore = useAuthStore()
  const orders = ref<ProfileOrder[]>([])
  const isLoading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const selectedOrder = ref<ProfileOrder | null>(null)
  const showOrderDetailsModal = ref<boolean>(false)

  const fetchOrders = async (): Promise<void> => {
    if (!authStore.user?.id) {
      orders.value = []
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient<Database>()
      const { data, error: dbError } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          total_amount,
          delivery_date,
          delivery_time,
          notes,
          address,
          order_items (
            id,
            quantity,
            price_at_time,
            products (
              name,
              image_url
            )
          )
        `)
        .eq('profile_id', authStore.user.id)
        .order('created_at', { ascending: false })

      if (dbError) {
        throw dbError
      }

      orders.value = (data as unknown as ProfileOrder[]) || []
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al cargar pedidos'
      error.value = msg
      console.error('Error fetching profile orders:', err)
    } finally {
      isLoading.value = false
    }
  }

  const openOrderDetails = (order: ProfileOrder): void => {
    selectedOrder.value = order
    showOrderDetailsModal.value = true
  }

  const closeOrderDetails = (): void => {
    showOrderDetailsModal.value = false
    selectedOrder.value = null
  }

  const formatOrderDate = (dateString: string): string => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('es-PE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getStatusBadgeClass = (status: string | null): string => {
    switch (status) {
      case 'completed':
        return 'bg-status-success/20 text-brand-secondary border-status-success/30'
      case 'in_delivery':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'processing':
      case 'preparing':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-status-danger border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string | null): string => {
    switch (status) {
      case 'completed':
        return 'Entregado'
      case 'in_delivery':
        return 'En camino'
      case 'processing':
      case 'preparing':
        return 'En preparación'
      case 'pending':
        return 'Pendiente'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status || 'Desconocido'
    }
  }

  return {
    orders,
    isLoading,
    error,
    selectedOrder,
    showOrderDetailsModal,
    fetchOrders,
    openOrderDetails,
    closeOrderDetails,
    formatOrderDate,
    getStatusBadgeClass,
    getStatusLabel
  }
}
