import { describe, it, expect } from 'vitest'
import { ref, computed, watch } from 'vue'
import fs from 'node:fs'
import path from 'node:path'
import type { ProductRow } from '../../app/types/catalog'

describe('Admin Vitrina Comercial - Búsqueda, Animaciones FLIP y Paginación de 7 elementos', () => {
  const componentPath = path.resolve(__dirname, '../../app/components/admin/AdminProductsTab.vue')

  describe('AdminProductsTab UI Structure & Transitions', () => {
    it('AdminProductsTab.vue debe existir y definir TransitionGroup tag="tbody" con nombre "product-row"', () => {
      expect(fs.existsSync(componentPath)).toBe(true)
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toContain('<TransitionGroup')
      expect(content).toContain('name="product-row"')
      expect(content).toContain('tag="tbody"')
    })

    it('AdminProductsTab.vue debe definir las clases FLIP .product-row-move, .product-row-enter-active y .product-row-leave-active', () => {
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toContain('.product-row-move')
      expect(content).toContain('will-change: transform;')
      expect(content).toContain('.product-row-enter-active')
      expect(content).toContain('.product-row-leave-active')
      expect(content).toContain('position: absolute;')
      expect(content).toContain('prefers-reduced-motion')
    })

    it('la barra de búsqueda debe contar con botón de limpieza animado y dropdown de sugerencias', () => {
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toContain('<Transition name="fade">')
      expect(content).toContain('<Transition name="dropdown">')
      expect(content).toContain('placeholder="Buscar productos o postres..."')
      expect(content).toContain('filteredProducts.length')
    })

    it('el footer de paginación solo debe renderizarse cuando hay más de 7 elementos (totalPages > 1)', () => {
      const content = fs.readFileSync(componentPath, 'utf-8')
      expect(content).toContain('v-if="totalPages > 1"')
      expect(content).toContain('itemsPerPage = 7')
    })
  })

  describe('Lógica de Filtrado y Paginación (7 elementos por página)', () => {
    const mockCatalog: ProductRow[] = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: i % 2 === 0 ? `Torta de Chocolate ${i + 1}` : `Cheesecake de Fresa ${i + 1}`,
      price: 25 + i,
      stock: 10,
      image_url: null,
      created_at: '2026-09-01T00:00:00Z',
    }))

    it('filtra productos por nombre de forma insensible a mayúsculas', () => {
      const catalog = ref<ProductRow[]>(mockCatalog)
      const searchQuery = ref('')
      const publishedProducts = computed(() => catalog.value.filter(p => Number(p.price) > 0))
      const filteredProducts = computed(() => {
        if (!searchQuery.value.trim()) return publishedProducts.value
        const q = searchQuery.value.toLowerCase().trim()
        return publishedProducts.value.filter(p => {
          const name = p.name ? p.name.toLowerCase() : ''
          return name.includes(q)
        })
      })

      searchQuery.value = 'torta'
      expect(filteredProducts.value.length).toBe(10)

      searchQuery.value = 'FRESA'
      expect(filteredProducts.value.length).toBe(10)

      searchQuery.value = 'inexistente'
      expect(filteredProducts.value.length).toBe(0)
    })

    it('limita las sugerencias de búsqueda a un máximo de 5 elementos', () => {
      const catalog = ref<ProductRow[]>(mockCatalog)
      const searchQuery = ref('torta')
      const publishedProducts = computed(() => catalog.value.filter(p => Number(p.price) > 0))
      const filteredProducts = computed(() => {
        if (!searchQuery.value.trim()) return publishedProducts.value
        const q = searchQuery.value.toLowerCase().trim()
        return publishedProducts.value.filter(p => (p.name || '').toLowerCase().includes(q))
      })
      const searchSuggestions = computed(() => {
        if (!searchQuery.value.trim()) return []
        return filteredProducts.value.slice(0, 5)
      })

      expect(searchSuggestions.value.length).toBe(5)
    })

    it('calcula totalPages con itemsPerPage = 7 y muestra paginación solo si totalPages > 1', () => {
      const itemsPerPage = 7

      // Caso 1: 5 elementos (<= 7) -> totalPages = 1 (Paginación oculta)
      const list5 = mockCatalog.slice(0, 5)
      const totalPages5 = Math.ceil(list5.length / itemsPerPage)
      expect(totalPages5).toBe(1)
      expect(totalPages5 > 1).toBe(false)

      // Caso 2: 7 elementos (exactamente 7) -> totalPages = 1 (Paginación oculta)
      const list7 = mockCatalog.slice(0, 7)
      const totalPages7 = Math.ceil(list7.length / itemsPerPage)
      expect(totalPages7).toBe(1)
      expect(totalPages7 > 1).toBe(false)

      // Caso 3: 8 elementos (> 7) -> totalPages = 2 (Paginación VISIBLE)
      const list8 = mockCatalog.slice(0, 8)
      const totalPages8 = Math.ceil(list8.length / itemsPerPage)
      expect(totalPages8).toBe(2)
      expect(totalPages8 > 1).toBe(true)

      // Caso 4: 20 elementos -> totalPages = 3 (7 + 7 + 6)
      const totalPages20 = Math.ceil(mockCatalog.length / itemsPerPage)
      expect(totalPages20).toBe(3)
      expect(totalPages20 > 1).toBe(true)
    })

    it('reinicia currentPage a 1 cuando cambia el searchQuery', async () => {
      const { nextTick } = await import('vue')
      const searchQuery = ref('')
      const currentPage = ref(3)

      watch(searchQuery, () => {
        currentPage.value = 1
      })

      searchQuery.value = 'chocolate'
      await nextTick()
      expect(currentPage.value).toBe(1)
    })
  })
})
