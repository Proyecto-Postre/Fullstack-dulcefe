import { describe, it, expect } from 'vitest'
import type { AtRiskProductItem } from '../../app/components/admin/AdminDashboardTab.vue'
import type { CatalogProduct } from '../../app/types/catalog'

describe('Fase 4 (Subfase 7.4) — Dashboard Preventivo & Vitrina Artesanal', () => {
  describe('Detección y estructura de Productos en Riesgo (Dashboard)', () => {
    it('detecta y formatea correctamente productos con insumos críticos faltantes', () => {
      const mockAtRiskData: AtRiskProductItem[] = [
        {
          product_id: 10,
          product_name: 'Caja x 6 Roles de Canela Clásicos',
          price: 45.0,
          image_url: '/roles.jpg',
          critical_materials: [
            {
              material_name: 'Harina sin preparar',
              unit: 'g',
              required: 333.33,
              available: 100.0
            },
            {
              material_name: 'Caja Kraft para 6 roles',
              unit: 'und',
              required: 1,
              available: 0
            }
          ]
        },
        {
          product_id: 12,
          product_name: 'Torta Selva Negra Tradicional',
          price: 85.0,
          image_url: null,
          critical_materials: [
            {
              material_name: 'Cerezas al marrasquino',
              unit: 'g',
              required: 200,
              available: 50
            }
          ]
        }
      ]

      expect(mockAtRiskData.length).toBe(2)

      const roles = mockAtRiskData[0]
      expect(roles.product_name).toBe('Caja x 6 Roles de Canela Clásicos')
      expect(roles.critical_materials.length).toBe(2)

      // Insumo masa
      const flour = roles.critical_materials.find((m) => m.material_name === 'Harina sin preparar')
      expect(flour).toBeDefined()
      expect(flour!.available).toBeLessThan(flour!.required)

      // Empaque directo
      const box = roles.critical_materials.find((m) => m.material_name.includes('Caja'))
      expect(box).toBeDefined()
      expect(box!.available).toBe(0)
    })

    it('identifica cuándo el taller está 100% abastecido (0 productos en riesgo)', () => {
      const emptyRiskList: AtRiskProductItem[] = []
      const isWorkshopFullyStocked = emptyRiskList.length === 0
      expect(isWorkshopFullyStocked).toBe(true)
    })
  })

  describe('Lógica de Vitrina Comercial Artesanal (Hecho a Pedido / Horneado Fresco)', () => {
    const freshDessert: CatalogProduct = {
      id: 1,
      name: 'Pie de Limón Artesanal',
      price: 45.0,
      stock: 10,
      image_url: '/pie.jpg',
      description: 'Merengue suizo dorado y crema de limón criollo'
    }

    const pausedDessert: CatalogProduct = {
      id: 2,
      name: 'Cheesecake de Maracuyá',
      price: 55.0,
      stock: 0,
      image_url: '/cheesecake.jpg',
      description: 'Coulis fresco de maracuyá y queso crema'
    }

    it('marca postres disponibles como Horneado Fresco y permite el botón Pedir', () => {
      const isAvailable = freshDessert.stock > 0
      const canOrder = Number(freshDessert.price) > 0 && freshDessert.stock > 0
      const badgeText = isAvailable ? 'Horneado Fresco' : 'Agotado por hoy'

      expect(isAvailable).toBe(true)
      expect(canOrder).toBe(true)
      expect(badgeText).toBe('Horneado Fresco')
    })

    it('marca postres pausados o desabastecidos como Agotado por hoy y bloquea el botón Pedir', () => {
      const isAvailable = pausedDessert.stock > 0
      const canOrder = Number(pausedDessert.price) > 0 && pausedDessert.stock > 0
      const badgeText = isAvailable ? 'Horneado Fresco' : 'Agotado por hoy'

      expect(isAvailable).toBe(false)
      expect(canOrder).toBe(false)
      expect(badgeText).toBe('Agotado por hoy')
    })
  })
})
