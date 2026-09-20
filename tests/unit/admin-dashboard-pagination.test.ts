import { describe, it, expect } from 'vitest'
import type { ProductRow } from '../../app/types/catalog'
import type { RawMaterialRow } from '../../app/types/inventory'

describe('Admin Dashboard - Alertas de Stock Bajo y Paginación (5 ítems por página)', () => {
  const ITEMS_PER_PAGE = 5

  // Helper de filtrado de productos por agotarse
  function filterLowStockProducts(products: ProductRow[]): ProductRow[] {
    return products.filter(p => Number(p.stock) <= 5)
  }

  // Helper de filtrado de insumos críticos
  function filterLowStockMaterials(materials: RawMaterialRow[]): RawMaterialRow[] {
    return materials.filter(m => {
      const stock = Number(m.stock || 0)
      if (m.unit === 'g' || m.unit === 'ml') return stock <= 500
      return stock <= 5
    })
  }

  // Helper de cálculo de total de páginas
  function calculateTotalPages(totalItems: number, itemsPerPage = ITEMS_PER_PAGE): number {
    if (totalItems <= 0) return 1
    return Math.ceil(totalItems / itemsPerPage)
  }

  // Helper de corte por página
  function paginateItems<T>(items: T[], page: number, itemsPerPage = ITEMS_PER_PAGE): T[] {
    const start = (page - 1) * itemsPerPage
    return items.slice(start, start + itemsPerPage)
  }

  describe('Criterios de umbral para alertas de stock', () => {
    it('filtra productos con stock menor o igual a 5 unidades', () => {
      const mockProducts = [
        { id: '1', name: 'Torta Chocolate', stock: 0, price: 95 },
        { id: '2', name: 'Roll de Canela', stock: 1, price: 72 },
        { id: '3', name: 'Alfajor', stock: 5, price: 25 },
        { id: '4', name: 'Cheesecake', stock: 6, price: 85 },
        { id: '5', name: 'Pie de Limon', stock: 20, price: 60 },
      ] as ProductRow[]

      const lowStock = filterLowStockProducts(mockProducts)
      expect(lowStock).toHaveLength(3)
      expect(lowStock.map(p => p.id)).toEqual(['1', '2', '3'])
    })

    it('filtra insumos según unidad (<= 500g/ml o <= 5 unidades/kg/litro)', () => {
      const mockMaterials = [
        { id: 1, name: 'Azúcar blanca', unit: 'kg', stock: 1 }, // <= 5 -> alerta
        { id: 2, name: 'Harina preparada', unit: 'kg', stock: 10 }, // > 5 -> ok
        { id: 3, name: 'Canela en polvo', unit: 'g', stock: 100 }, // <= 500 -> alerta
        { id: 4, name: 'Polvo de hornear', unit: 'g', stock: 800 }, // > 500 -> ok
        { id: 5, name: 'Esencia vainilla', unit: 'ml', stock: 250 }, // <= 500 -> alerta
        { id: 6, name: 'Chantilly', unit: 'l', stock: 1 }, // <= 5 -> alerta
      ] as unknown as RawMaterialRow[]

      const lowStock = filterLowStockMaterials(mockMaterials)
      expect(lowStock).toHaveLength(4)
      expect(lowStock.map(m => m.name)).toEqual([
        'Azúcar blanca',
        'Canela en polvo',
        'Esencia vainilla',
        'Chantilly'
      ])
    })
  })

  describe('Lógica de Paginación de 5 en 5', () => {
    it('calcula 1 página si no hay ítems o hay 5 o menos', () => {
      expect(calculateTotalPages(0)).toBe(1)
      expect(calculateTotalPages(3)).toBe(1)
      expect(calculateTotalPages(5)).toBe(1)
    })

    it('calcula múltiples páginas correctamente cuando hay más de 5 ítems', () => {
      expect(calculateTotalPages(6)).toBe(2)
      expect(calculateTotalPages(10)).toBe(2)
      expect(calculateTotalPages(11)).toBe(3)
      expect(calculateTotalPages(15)).toBe(3)
    })

    it('muestra exactamente los 5 primeros ítems en página 1 y los restantes en página 2', () => {
      const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5', 'Item 6', 'Item 7']
      const page1 = paginateItems(items, 1)
      const page2 = paginateItems(items, 2)

      expect(page1).toEqual(['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'])
      expect(page2).toEqual(['Item 6', 'Item 7'])
    })

    it('no desborda si la página seleccionada supera el total de páginas', () => {
      const items = ['Item 1', 'Item 2', 'Item 3']
      const totalPages = calculateTotalPages(items.length)
      let currentPage = 3 // Usuario estaba en página 3 y se borraron ítems

      if (currentPage > totalPages) {
        currentPage = Math.max(1, totalPages)
      }

      expect(currentPage).toBe(1)
      expect(paginateItems(items, currentPage)).toHaveLength(3)
    })
  })
})
