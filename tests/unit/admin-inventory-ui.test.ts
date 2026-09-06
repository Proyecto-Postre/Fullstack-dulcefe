import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { calculateUnitCost, getMaterialIcon, useAdminMaterials } from '../../app/composables/admin/useAdminMaterials'
import type { RawMaterialRow } from '../../app/types/inventory'

describe('Fase 4 (PR-4c): Dominio Inventario y Materias Primas - Cálculo de Costos, Iconografía y Filtrado', () => {
  describe('calculateUnitCost', () => {
    it('retorna 0 si el precio o la cantidad son nulos, indefinidos o menores o iguales a cero', () => {
      expect(calculateUnitCost(null, 1000)).toBe(0)
      expect(calculateUnitCost(undefined, 1000)).toBe(0)
      expect(calculateUnitCost(20, null)).toBe(0)
      expect(calculateUnitCost(20, undefined)).toBe(0)
      expect(calculateUnitCost(0, 1000)).toBe(0)
      expect(calculateUnitCost(20, 0)).toBe(0)
      expect(calculateUnitCost(20, -50)).toBe(0)
    })

    it('calcula el costo unitario con precisión decimal', () => {
      // S/ 15.50 por un saco de 5000g -> S/ 0.0031 / g
      expect(calculateUnitCost(15.5, 5000)).toBeCloseTo(0.0031, 4)
      // S/ 38.00 por 12 unidades de huevos -> S/ 3.1666...
      expect(calculateUnitCost(38.0, 12)).toBeCloseTo(3.1667, 4)
      // S/ 8.20 por 1 Litro (1000 ml) -> S/ 0.0082 / ml
      expect(calculateUnitCost(8.2, 1000)).toBeCloseTo(0.0082, 4)
    })
  })

  describe('getMaterialIcon', () => {
    it('retorna icono por defecto lucide:box si el nombre es nulo o vacío', () => {
      expect(getMaterialIcon(null)).toBe('lucide:box')
      expect(getMaterialIcon(undefined)).toBe('lucide:box')
      expect(getMaterialIcon('')).toBe('lucide:box')
    })

    it('asigna iconos culinarios temáticos de repostería y panadería según el insumo', () => {
      // Harinas y polvos
      expect(getMaterialIcon('Harina sin preparar blanca')).toBe('lucide:wheat')
      expect(getMaterialIcon('Polvo de hornear')).toBe('lucide:wheat')
      expect(getMaterialIcon('Maizena')).toBe('lucide:wheat')

      // Lácteos y cremas
      expect(getMaterialIcon('Leche condensada Nestlé')).toBe('lucide:milk')
      expect(getMaterialIcon('Queso crema Philadelphia')).toBe('lucide:ice-cream-2')
      expect(getMaterialIcon('Mantequilla con sal')).toBe('lucide:sandwich')

      // Huevos
      expect(getMaterialIcon('Huevo de corral')).toBe('lucide:egg')
      expect(getMaterialIcon('Yemas pasteurizadas')).toBe('lucide:egg')

      // Azúcares y dulces
      expect(getMaterialIcon('Azúcar rubia')).toBe('lucide:candy')
      expect(getMaterialIcon('Manjar blanco de olla')).toBe('lucide:donut')
      expect(getMaterialIcon('Mermelada de saúco')).toBe('lucide:amphora')

      // Chocolates y galletas
      expect(getMaterialIcon('Chocolate cobertura bitter 70%')).toBe('lucide:cookie')
      expect(getMaterialIcon('Galleta Oreo triturada')).toBe('lucide:croissant')

      // Frutas y frutos secos
      expect(getMaterialIcon('Fresa fresca seleccionada')).toBe('lucide:cherry')
      expect(getMaterialIcon('Limón sutil')).toBe('lucide:citrus')
      expect(getMaterialIcon('Pecanas enteras peladas')).toBe('lucide:nut')

      // Carnes / Salados
      expect(getMaterialIcon('Carne molida especial')).toBe('lucide:beef')
      expect(getMaterialIcon('Pechuga de pollo')).toBe('lucide:drumstick')

      // Genérico / Insumo no mapeado
      expect(getMaterialIcon('Envase descartable biodegradable')).toBe('lucide:box')
    })
  })

  describe('useAdminMaterials Composable', () => {
    const mockMaterials: RawMaterialRow[] = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: i % 2 === 0 ? `Insumo Harina ${i + 1}` : `Insumo Azúcar ${i + 1}`,
      purchase_price: 10 + i,
      purchase_quantity: 1000,
      stock: 500,
      unit: i % 2 === 0 ? 'kg' : 'g',
      created_at: '2026-09-01T00:00:00Z'
    }))

    it('inicializa con la lista completa sin filtro y página 1', () => {
      const materialsList = ref<RawMaterialRow[]>(mockMaterials)
      const { paginatedMaterials, totalPages, currentPage } = useAdminMaterials(materialsList)

      expect(currentPage.value).toBe(1)
      expect(totalPages.value).toBe(3) // 25 items con 10 por página = 3 páginas
      expect(paginatedMaterials.value.length).toBe(10)
    })

    it('filtra correctamente por nombre de insumo y actualiza sugerencias', () => {
      const materialsList = ref<RawMaterialRow[]>(mockMaterials)
      const { searchQuery, filteredMaterials, searchSuggestions } = useAdminMaterials(materialsList)

      searchQuery.value = 'Azúcar'
      expect(filteredMaterials.value.length).toBe(12) // 12 impares en 25
      expect(searchSuggestions.value.length).toBe(5) // Máximo 5 sugerencias

      searchQuery.value = 'NoExisteInsumo'
      expect(filteredMaterials.value.length).toBe(0)
      expect(searchSuggestions.value.length).toBe(0)
    })

    it('permite paginar hacia adelante y hacia atrás con límites estrictos', () => {
      const materialsList = ref<RawMaterialRow[]>(mockMaterials)
      const { currentPage, nextPage, prevPage, totalPages } = useAdminMaterials(materialsList)

      expect(currentPage.value).toBe(1)
      prevPage()
      expect(currentPage.value).toBe(1) // No puede bajar de 1

      nextPage()
      expect(currentPage.value).toBe(2)

      nextPage()
      expect(currentPage.value).toBe(3)

      nextPage()
      expect(currentPage.value).toBe(totalPages.value) // No puede superar totalPages

      prevPage()
      expect(currentPage.value).toBe(2)
    })

    it('selecciona y limpia sugerencias de búsqueda', () => {
      const materialsList = ref<RawMaterialRow[]>(mockMaterials)
      const { searchQuery, isSearchFocused, selectSuggestion, clearSearch } = useAdminMaterials(materialsList)

      isSearchFocused.value = true
      selectSuggestion(mockMaterials[0]!)
      expect(searchQuery.value).toBe(mockMaterials[0]!.name)
      expect(isSearchFocused.value).toBe(false)

      clearSearch()
      expect(searchQuery.value).toBe('')
      expect(isSearchFocused.value).toBe(false)
    })
  })
})
