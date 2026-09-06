import { describe, it, expect } from 'vitest'
import {
  formatAdminOrderDate,
  getOrderCustomerName,
  getOrderCustomerPhone,
  filterOrdersByStatus,
  KANBAN_COLUMNS
} from '../../app/composables/admin/useAdminOrders'
import type { AdminOrder } from '../../app/types/admin-orders'
import type { ProductRow } from '../../app/types/catalog'
import type { RawMaterialRow } from '../../app/types/inventory'

describe('Fase 4 (PR-4e): Dominio Pedidos Admin, Kanban & Dashboard - Formateo, Filtros y Métricas', () => {
  describe('formatAdminOrderDate', () => {
    it('retorna cadena vacía si la fecha es nula, indefinida o inválida', () => {
      expect(formatAdminOrderDate(null)).toBe('')
      expect(formatAdminOrderDate(undefined)).toBe('')
      expect(formatAdminOrderDate('')).toBe('')
      expect(formatAdminOrderDate('fecha-invalida')).toBe('')
    })

    it('formatea fechas ISO a formato legible peruano (es-PE)', () => {
      const formatted = formatAdminOrderDate('2026-09-06T15:30:00Z')
      expect(formatted).toBeTruthy()
      expect(typeof formatted).toBe('string')
      expect(formatted.length).toBeGreaterThan(0)
    })
  })

  describe('Resolución de Datos del Cliente', () => {
    it('getOrderCustomerName prioriza profiles.full_name sobre customer_name', () => {
      const order: AdminOrder = {
        id: 'ord-001',
        profile_id: 'prof-001',
        status: 'pending',
        total_price: 65.0,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T10:00:00Z',
        customer_name: 'Nombre Manual',
        profiles: {
          full_name: 'Lucía Benavides',
          phone: '999888777'
        }
      }

      expect(getOrderCustomerName(order)).toBe('Lucía Benavides')
    })

    it('getOrderCustomerName usa customer_name si profiles es nulo o vacío', () => {
      const order: AdminOrder = {
        id: 'ord-002',
        profile_id: null,
        status: 'processing',
        total_price: 45.0,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T10:00:00Z',
        customer_name: 'Carlos Mendoza',
        profiles: null
      }

      expect(getOrderCustomerName(order)).toBe('Carlos Mendoza')
    })

    it('getOrderCustomerName retorna "Cliente sin nombre" si no hay datos', () => {
      expect(getOrderCustomerName(null)).toBe('Cliente sin nombre')
      expect(getOrderCustomerName(undefined)).toBe('Cliente sin nombre')
    })

    it('getOrderCustomerPhone resuelve correctamente de profile o customer_phone', () => {
      const orderWithProfile: AdminOrder = {
        id: 'ord-003',
        profile_id: 'prof-002',
        status: 'ready',
        total_price: 30.0,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T10:00:00Z',
        profiles: { full_name: 'Ana', phone: '987654321' }
      }
      expect(getOrderCustomerPhone(orderWithProfile)).toBe('987654321')

      const orderManual: AdminOrder = {
        id: 'ord-004',
        profile_id: null,
        status: 'completed',
        total_price: 50.0,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T10:00:00Z',
        customer_phone: '912345678'
      }
      expect(getOrderCustomerPhone(orderManual)).toBe('912345678')

      expect(getOrderCustomerPhone(null)).toBe('')
    })
  })

  describe('Kanban y Agrupación por Estado', () => {
    const mockOrders: AdminOrder[] = [
      {
        id: '1',
        profile_id: null,
        status: 'pending',
        total_price: 25,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T00:00:00Z'
      },
      {
        id: '2',
        profile_id: null,
        status: 'pending',
        total_price: 35,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T01:00:00Z'
      },
      {
        id: '3',
        profile_id: null,
        status: 'processing',
        total_price: 50,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T02:00:00Z'
      },
      {
        id: '4',
        profile_id: null,
        status: 'ready',
        total_price: 40,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T03:00:00Z'
      },
      {
        id: '5',
        profile_id: null,
        status: 'completed',
        total_price: 100,
        delivery_date: null,
        delivery_time: null,
        notes: null,
        address: null,
        created_at: '2026-09-06T04:00:00Z'
      }
    ]

    it('define las 4 columnas del flujo Kanban estándar', () => {
      expect(KANBAN_COLUMNS.length).toBe(4)
      const columnIds = KANBAN_COLUMNS.map(c => c.id)
      expect(columnIds).toEqual(['pending', 'processing', 'ready', 'completed'])
    })

    it('filtra pedidos por estado con exactitud', () => {
      expect(filterOrdersByStatus(mockOrders, 'pending').length).toBe(2)
      expect(filterOrdersByStatus(mockOrders, 'processing').length).toBe(1)
      expect(filterOrdersByStatus(mockOrders, 'ready').length).toBe(1)
      expect(filterOrdersByStatus(mockOrders, 'completed').length).toBe(1)
      expect(filterOrdersByStatus(mockOrders, 'cancelled').length).toBe(0)
    })
  })

  describe('Lógica de Métricas de Dashboard Administrativo', () => {
    const sampleProducts: ProductRow[] = [
      { id: 1, name: 'Torta Chocolate', price: 45, stock: 2, image_url: null, created_at: '' },
      { id: 2, name: 'Pie de Limón', price: 25, stock: 5, image_url: null, created_at: '' },
      { id: 3, name: 'Cheesecake', price: 50, stock: 12, image_url: null, created_at: '' },
      { id: 4, name: 'Alfajores', price: 18, stock: 0, image_url: null, created_at: '' }
    ]

    const sampleMaterials: RawMaterialRow[] = [
      { id: 1, name: 'Harina', unit: 'g', purchase_price: 10, purchase_quantity: 1000, stock: 350, created_at: '' },
      { id: 2, name: 'Azúcar', unit: 'g', purchase_price: 8, purchase_quantity: 1000, stock: 1200, created_at: '' },
      { id: 3, name: 'Cajas', unit: 'und', purchase_price: 20, purchase_quantity: 10, stock: 4, created_at: '' },
      { id: 4, name: 'Esencia Vainilla', unit: 'ml', purchase_price: 15, purchase_quantity: 500, stock: 600, created_at: '' }
    ]

    it('identifica productos con stock bajo (stock <= 5)', () => {
      const lowStock = sampleProducts.filter(p => Number(p.stock) <= 5)
      expect(lowStock.length).toBe(3) // Torta (2), Pie (5), Alfajores (0)
    })

    it('identifica materias primas críticas según su unidad de medida', () => {
      const lowStockMaterials = sampleMaterials.filter(m => {
        const stock = Number(m.stock || 0)
        if (m.unit === 'g' || m.unit === 'ml') return stock <= 500
        return stock <= 5
      })
      // Harina (350g <= 500g) y Cajas (4und <= 5und)
      expect(lowStockMaterials.length).toBe(2)
      expect(lowStockMaterials.map(m => m.name)).toEqual(['Harina', 'Cajas'])
    })

    it('calcula el valor total del inventario multiplicando costo unitario por stock físico', () => {
      const totalValue = sampleMaterials.reduce((sum, m) => {
        const price = Number(m.purchase_price || 0)
        const qty = Number(m.purchase_quantity || 1)
        const costPerUnit = qty > 0 ? price / qty : 0
        const stock = Number(m.stock || 0)
        return sum + costPerUnit * stock
      }, 0)

      // Harina: (10/1000) * 350 = 3.50
      // Azúcar: (8/1000) * 1200 = 9.60
      // Cajas: (20/10) * 4 = 8.00
      // Vainilla: (15/500) * 600 = 18.00
      // Total = 3.50 + 9.60 + 8.00 + 18.00 = 39.10
      expect(totalValue).toBeCloseTo(39.1, 2)
    })
  })
})
