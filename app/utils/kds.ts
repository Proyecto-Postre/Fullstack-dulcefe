/**
 * Utilidades de Kitchen Display System (KDS) para Taller y Cocina (Fase 6 / Plan Maestro §7)
 * Provee cálculo de urgencia horaria en America/Lima, ordenamiento de comandas y agregación de mise en place.
 */

export type UrgencyLevel = 'overdue' | 'urgent' | 'warning' | 'normal'

export interface UrgencyInfo {
  level: UrgencyLevel
  minutesRemaining: number
  badgeLabel: string
  badgeClass: string
}

export interface KdsOrderItem {
  product_id: number
  product_name: string
  quantity: number
  recipe?: Array<{
    material_id: number
    material_name: string
    unit: string
    quantity_used: number
  }>
}

export interface KdsOrder {
  id: string
  short_id: string
  customer_name: string
  status: 'pending' | 'processing' | 'ready' | 'completed' | 'cancelled'
  delivery_date: string | null // "YYYY-MM-DD"
  delivery_time: string | null // "HH:mm"
  created_at: string
  notes?: string | null
  items: KdsOrderItem[]
}

export interface BatchIngredientSummary {
  material_id: number
  material_name: string
  unit: string
  total_quantity: number
}

/**
 * Calcula el nivel de urgencia de entrega comparando con la hora oficial de Lima.
 * @param deliveryDate Fecha YYYY-MM-DD
 * @param deliveryTime Hora HH:mm
 * @param nowTimestamp Timestamp opcional para pruebas
 */
export function calculateDeliveryUrgency(
  deliveryDate: string | null,
  deliveryTime: string | null,
  nowTimestamp?: number
): UrgencyInfo {
  if (!deliveryDate) {
    return {
      level: 'normal',
      minutesRemaining: 9999,
      badgeLabel: 'Sin fecha límite',
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-300'
    }
  }

  const timeStr = deliveryTime || '18:00'
  // Construir fecha en formato ISO para Lima (UTC-5)
  const targetIso = `${deliveryDate}T${timeStr}:00-05:00`
  const targetMs = new Date(targetIso).getTime()
  const currentMs = nowTimestamp !== undefined ? nowTimestamp : Date.now()

  const diffMinutes = Math.floor((targetMs - currentMs) / (60 * 1000))

  if (diffMinutes < 0) {
    return {
      level: 'overdue',
      minutesRemaining: diffMinutes,
      badgeLabel: `Vencido (${Math.abs(diffMinutes)}m)`,
      badgeClass: 'bg-red-600 text-white border-red-700 animate-pulse'
    }
  }

  if (diffMinutes <= 120) {
    return {
      level: 'urgent',
      minutesRemaining: diffMinutes,
      badgeLabel: `Urgente (<${Math.max(1, Math.round(diffMinutes / 60))}h)`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold'
    }
  }

  if (diffMinutes <= 240) {
    return {
      level: 'warning',
      minutesRemaining: diffMinutes,
      badgeLabel: `Atención (<${Math.round(diffMinutes / 60)}h)`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300'
    }
  }

  return {
    level: 'normal',
    minutesRemaining: diffMinutes,
    badgeLabel: `En tiempo (>4h)`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300'
  }
}

/**
 * Ordena comandas de taller por hora límite de entrega ascendente (pedidos más urgentes primero).
 */
export function sortKdsOrdersByUrgency(orders: KdsOrder[], nowMs?: number): KdsOrder[] {
  return [...orders].sort((a, b) => {
    const urgA = calculateDeliveryUrgency(a.delivery_date, a.delivery_time, nowMs).minutesRemaining
    const urgB = calculateDeliveryUrgency(b.delivery_date, b.delivery_time, nowMs).minutesRemaining
    return urgA - urgB
  })
}

/**
 * Agregador de Mise en Place / Horneado por Lotes (Batch Baking Aggregator):
 * Consolida todas las recetas de las órdenes activas y calcula el requerimiento total de insumos.
 */
export function aggregateBatchBakingRequirements(orders: KdsOrder[]): BatchIngredientSummary[] {
  const map = new Map<number, BatchIngredientSummary>()

  for (const order of orders) {
    // Solo contar pedidos que están pendientes o en preparación
    if (order.status !== 'pending' && order.status !== 'processing') continue

    for (const item of order.items) {
      if (!item.recipe || item.recipe.length === 0) continue

      for (const ingredient of item.recipe) {
        const qtyNeeded = ingredient.quantity_used * item.quantity
        const existing = map.get(ingredient.material_id)

        if (existing) {
          existing.total_quantity += qtyNeeded
        } else {
          map.set(ingredient.material_id, {
            material_id: ingredient.material_id,
            material_name: ingredient.material_name,
            unit: ingredient.unit,
            total_quantity: qtyNeeded
          })
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => a.material_name.localeCompare(b.material_name))
}
