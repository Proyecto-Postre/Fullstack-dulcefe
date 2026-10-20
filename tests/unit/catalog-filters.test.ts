import { describe, it, expect, vi, beforeEach } from 'vitest'
import { computed } from 'vue'
import { useCatalog } from '../../app/composables/useCatalog'
import type { CatalogProduct } from '../../app/types/catalog'

// Mock de Pinia y toast de Vue-Sonner para entorno aislado
vi.mock('../../app/stores/cart', () => ({
  useCartStore: () => ({
    addToCart: vi.fn()
  })
}))

vi.mock('vue-sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('Filtros de Porciones y Presupuesto en Catálogo (useCatalog)', () => {
  const mockProducts: CatalogProduct[] = [
    {
      id: 1,
      name: 'Tartaleta Individual de Fresas',
      price: 15.0,
      stock: 10,
      image_url: null,
      portions: 1
    },
    {
      id: 2,
      name: 'Pack Mini Brownies (4 unidades)',
      price: 25.0,
      stock: 8,
      image_url: null,
      portions: 4
    },
    {
      id: 3,
      name: 'Cheesecake Familiar de Maracuyá',
      price: 48.0,
      stock: 5,
      image_url: null,
      portions: 8
    },
    {
      id: 4,
      name: 'Torta de Chocolate de Fiesta',
      price: 75.0,
      stock: 3,
      image_url: null,
      portions: 16
    }
  ]

  let catalog: ReturnType<typeof useCatalog>

  beforeEach(() => {
    catalog = useCatalog(computed(() => mockProducts))
  })

  it('muestra todos los productos cuando los filtros estan en "all"', () => {
    expect(catalog.filteredProducts.value.length).toBe(4)
  })

  it('filtra correctamente por porciones: individual/pareja (1-4 porciones)', () => {
    catalog.portionFilter.value = '1-4'
    const names = catalog.filteredProducts.value.map(p => p.name)
    expect(names).toEqual([
      'Tartaleta Individual de Fresas',
      'Pack Mini Brownies (4 unidades)'
    ])
  })

  it('filtra correctamente por porciones: familiar pequeño (6-10 porciones)', () => {
    catalog.portionFilter.value = '6-10'
    const names = catalog.filteredProducts.value.map(p => p.name)
    expect(names).toEqual(['Cheesecake Familiar de Maracuyá'])
  })

  it('filtra correctamente por porciones: celebracion (12+ porciones)', () => {
    catalog.portionFilter.value = '12+'
    const names = catalog.filteredProducts.value.map(p => p.name)
    expect(names).toEqual(['Torta de Chocolate de Fiesta'])
  })

  it('filtra correctamente por presupuesto: hasta S/ 30', () => {
    catalog.priceRangeFilter.value = 'under-30'
    const names = catalog.filteredProducts.value.map(p => p.name)
    expect(names).toEqual([
      'Tartaleta Individual de Fresas',
      'Pack Mini Brownies (4 unidades)'
    ])
  })

  it('filtra correctamente por presupuesto: S/ 30 a S/ 60', () => {
    catalog.priceRangeFilter.value = '30-60'
    const names = catalog.filteredProducts.value.map(p => p.name)
    expect(names).toEqual(['Cheesecake Familiar de Maracuyá'])
  })

  it('filtra correctamente por presupuesto: mas de S/ 60', () => {
    catalog.priceRangeFilter.value = 'above-60'
    const names = catalog.filteredProducts.value.map(p => p.name)
    expect(names).toEqual(['Torta de Chocolate de Fiesta'])
  })

  it('combina filtros de porciones y presupuesto simultaneamente', () => {
    catalog.portionFilter.value = '1-4'
    catalog.priceRangeFilter.value = 'under-30'
    expect(catalog.filteredProducts.value.length).toBe(2)

    catalog.portionFilter.value = '12+'
    catalog.priceRangeFilter.value = 'under-30'
    expect(catalog.filteredProducts.value.length).toBe(0)
  })

  it('resetFilters restablece porciones y presupuesto a sus valores base', () => {
    catalog.portionFilter.value = '12+'
    catalog.priceRangeFilter.value = 'above-60'
    catalog.searchQuery.value = 'chocolate'
    catalog.resetFilters()

    expect(catalog.portionFilter.value).toBe('all')
    expect(catalog.priceRangeFilter.value).toBe('all')
    expect(catalog.searchQuery.value).toBe('')
    expect(catalog.filteredProducts.value.length).toBe(4)
  })
})
