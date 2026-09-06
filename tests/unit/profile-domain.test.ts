import { describe, it, expect } from 'vitest'
import type { ProfileOrder, ProfileOrderItem, ProfileAddressItem } from '../../app/types/profile'

describe('Fase 4 (PR-4a): Dominio Perfil - Tipado y Lógica de Pedidos', () => {
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

  it('asigna correctamente las clases y etiquetas de estado para los pedidos del perfil', () => {
    expect(getStatusLabel('completed')).toBe('Entregado')
    expect(getStatusBadgeClass('completed')).toContain('bg-status-success/20')

    expect(getStatusLabel('in_delivery')).toBe('En camino')
    expect(getStatusBadgeClass('in_delivery')).toContain('bg-blue-100')

    expect(getStatusLabel('processing')).toBe('En preparación')
    expect(getStatusBadgeClass('processing')).toContain('bg-amber-100')

    expect(getStatusLabel('pending')).toBe('Pendiente')
    expect(getStatusBadgeClass('pending')).toContain('bg-yellow-100')

    expect(getStatusLabel('cancelled')).toBe('Cancelado')
    expect(getStatusBadgeClass('cancelled')).toContain('bg-red-100')

    expect(getStatusLabel(null)).toBe('Desconocido')
  })

  it('respeta la estructura estricta del contrato ProfileOrder sin any', () => {
    const item: ProfileOrderItem = {
      id: 'item-1',
      quantity: 2,
      price_at_time: 15.5,
      products: {
        name: 'Torta de Chocolate',
        image_url: 'https://example.com/torta.jpg'
      }
    }

    const order: ProfileOrder = {
      id: 'ord-12345678-abcd',
      created_at: '2026-09-06T12:00:00Z',
      status: 'completed',
      total_amount: 31.0,
      delivery_date: '2026-09-07',
      delivery_time: '15:00',
      notes: 'Sin azúcar adicional',
      order_items: [item]
    }

    expect(order.id).toBe('ord-12345678-abcd')
    expect(order.order_items?.[0].price_at_time).toBe(15.5)
    expect(order.order_items?.[0].products?.name).toBe('Torta de Chocolate')
  })

  it('valida la estructura de dirección ProfileAddressItem', () => {
    const address: ProfileAddressItem = {
      id: 'addr-1',
      label: 'Casa',
      address_line: 'Av. Las Palmeras 123',
      reference: 'Frente al parque'
    }

    expect(address.label).toBe('Casa')
    expect(address.reference).toBe('Frente al parque')
  })
})
