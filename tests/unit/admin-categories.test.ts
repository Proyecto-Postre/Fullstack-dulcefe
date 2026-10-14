import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { computed } from 'vue'
import { useCatalog } from '../../app/composables/useCatalog'
import type { CatalogProduct, CatalogCategory } from '../../app/types/catalog'

describe('Admin & Catalog Categories Integration Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  const mockCategories: CatalogCategory[] = [
    { id: 'tortas', name: 'Tortas de Cumpleaños', icon: 'lucide:cake', sort_order: 1, is_active: true },
    { id: 'tartaletas', name: 'Tartaletas & Pies', icon: 'lucide:sparkles', sort_order: 2, is_active: true },
    { id: 'boxes', name: 'Boxes para Regalo', icon: 'lucide:gift', sort_order: 3, is_active: true }
  ]

  const mockProducts: CatalogProduct[] = [
    {
      id: 1,
      name: 'Torta de Chocolate Fina',
      price: 85.00,
      stock: 5,
      image_url: '/img/torta.jpg',
      category_id: 'tortas'
    },
    {
      id: 2,
      name: 'Tartaleta de Fresas',
      price: 45.00,
      stock: 8,
      image_url: '/img/tarta.jpg',
      category_id: 'tartaletas'
    },
    {
      id: 3,
      name: 'Box Dulce Sorpresa',
      price: 60.00,
      stock: 3,
      image_url: '/img/box.jpg',
      category_id: 'boxes'
    },
    {
      id: 4,
      name: 'Alfajor Artesanal',
      price: 15.00,
      stock: 12,
      image_url: '/img/alfajor.jpg',
      category_id: null
    }
  ]

  it('1. useCatalog inicializa con opción "Todos los Postres" y las categorías de la BD', () => {
    const rawProducts = computed(() => mockProducts)
    const rawCategories = computed(() => mockCategories)

    const { categories, selectedCategory } = useCatalog(rawProducts, rawCategories)

    expect(selectedCategory.value).toBe('todos')
    expect(categories.value.length).toBe(4) // 'todos' + 3 categorías
    expect(categories.value[0]?.id).toBe('todos')
    expect(categories.value[1]?.id).toBe('tortas')
    expect(categories.value[2]?.id).toBe('tartaletas')
    expect(categories.value[3]?.id).toBe('boxes')
  })

  it('2. filtra productos dinámicamente cuando el usuario selecciona una categoría', () => {
    const rawProducts = computed(() => mockProducts)
    const rawCategories = computed(() => mockCategories)

    const { filteredProducts, selectedCategory } = useCatalog(rawProducts, rawCategories)

    // Inicialmente todos
    expect(filteredProducts.value.length).toBe(4)

    // Filtrar por Tortas
    selectedCategory.value = 'tortas'
    expect(filteredProducts.value.length).toBe(1)
    expect(filteredProducts.value[0]?.name).toBe('Torta de Chocolate Fina')

    // Filtrar por Tartaletas
    selectedCategory.value = 'tartaletas'
    expect(filteredProducts.value.length).toBe(1)
    expect(filteredProducts.value[0]?.name).toBe('Tartaleta de Fresas')

    // Regresar a Todos
    selectedCategory.value = 'todos'
    expect(filteredProducts.value.length).toBe(4)
  })

  it('3. combina el filtro por categoría con la búsqueda por texto', () => {
    const rawProducts = computed(() => mockProducts)
    const rawCategories = computed(() => mockCategories)

    const { filteredProducts, selectedCategory, searchQuery } = useCatalog(rawProducts, rawCategories)

    selectedCategory.value = 'tortas'
    searchQuery.value = 'chocolate'
    expect(filteredProducts.value.length).toBe(1)

    // Búsqueda que no coincida dentro de esa categoría
    searchQuery.value = 'fresas'
    expect(filteredProducts.value.length).toBe(0)
  })

  it('4. resetea los filtros al invocar resetFilters()', () => {
    const rawProducts = computed(() => mockProducts)
    const rawCategories = computed(() => mockCategories)

    const { filteredProducts, selectedCategory, searchQuery, resetFilters } = useCatalog(rawProducts, rawCategories)

    selectedCategory.value = 'boxes'
    searchQuery.value = 'sorpresa'
    expect(filteredProducts.value.length).toBe(1)

    resetFilters()
    expect(selectedCategory.value).toBe('todos')
    expect(searchQuery.value).toBe('')
    expect(filteredProducts.value.length).toBe(4)
  })
})
