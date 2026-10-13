import { ref, computed, type ComputedRef } from 'vue'
import type { CatalogProduct, CatalogCategory } from '../types/catalog'
import { useCartStore } from '../stores/cart'
import { toast } from 'vue-sonner'

export function normalizeCatalogText(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export interface CatalogSection {
  id: string
  name: string
  icon: string
  products: CatalogProduct[]
}

export function matchProductCategory(product: CatalogProduct, categoryId: string): boolean {
  if (!product) return false
  const pCat = String((product as { category_id?: string | number }).category_id || '')
  if (pCat.length > 0 && pCat === String(categoryId)) return true

  const nameNorm = normalizeCatalogText(product.name || '')
  const descNorm = normalizeCatalogText(product.description || '')
  const catLower = String(categoryId).toLowerCase()

  if (catLower === 'tortas' && (nameNorm.includes('torta') || descNorm.includes('torta') || nameNorm.includes('cake'))) return true
  if ((catLower === 'tartaletas' || catLower.includes('pie')) && (nameNorm.includes('tarta') || nameNorm.includes('pie') || descNorm.includes('tarta'))) return true
  if (catLower === 'boxes' && (nameNorm.includes('box') || descNorm.includes('box') || descNorm.includes('caja') || nameNorm.includes('regalo'))) return true
  if (catLower === 'bocaditos' && (nameNorm.includes('bocadito') || nameNorm.includes('alfajor') || nameNorm.includes('trufa') || nameNorm.includes('macaron') || descNorm.includes('bocadito'))) return true

  return false
}

export function useCatalog(
  rawProducts: ComputedRef<CatalogProduct[]>,
  rawCategories?: ComputedRef<CatalogCategory[]>
) {
  const cartStore = useCartStore()
  const searchQuery = ref<string>('')
  const selectedCategories = ref<string[]>(['todos'])

  // Getter/Setter retrocompatible con selectedCategory (string)
  const selectedCategory = computed<string>({
    get() {
      if (selectedCategories.value.includes('todos') || selectedCategories.value.length === 0) {
        return 'todos'
      }
      if (selectedCategories.value.length === 1) {
        return selectedCategories.value[0]
      }
      return 'multiple'
    },
    set(val: string) {
      if (!val || val === 'todos') {
        selectedCategories.value = ['todos']
      } else if (val === 'multiple') {
        // Blindaje: 'multiple' es solo un indicador de lectura, no un ID de categoría
        return
      } else {
        selectedCategories.value = [val]
      }
    }
  })

  function toggleCategory(catId: string): void {
    if (catId === 'todos') {
      selectedCategories.value = ['todos']
      return
    }

    const current = selectedCategories.value.filter(id => id !== 'todos')
    const exists = current.includes(catId)

    if (exists) {
      const remaining = current.filter(id => id !== catId)
      selectedCategories.value = remaining.length === 0 ? ['todos'] : remaining
    } else {
      selectedCategories.value = [...current, catId]
    }
  }

  function setOnlyCategory(catId: string): void {
    if (!catId || catId === 'todos') {
      selectedCategories.value = ['todos']
    } else {
      selectedCategories.value = [catId]
    }
  }

  function isCategoryActive(catId: string): boolean {
    if (catId === 'todos') {
      return selectedCategories.value.includes('todos') || selectedCategories.value.length === 0
    }
    return selectedCategories.value.includes(catId)
  }

  const categories = computed<CatalogCategory[]>(() => {
    const list = rawCategories?.value
    // Si no se proporcionaron categorías o la tabla en BD está vacía, no mostrar filtros en duro
    if (!list || list.length === 0) {
      return []
    }
    return [
      { id: 'todos', name: 'Todos los Postres', icon: 'lucide:sparkles' },
      ...list
    ]
  })

  const isAllSelected = computed<boolean>(() => {
    return selectedCategories.value.includes('todos') || selectedCategories.value.length === 0
  })

  const filteredProducts = computed<CatalogProduct[]>(() => {
    const list = rawProducts.value || []
    if (!Array.isArray(list) || list.length === 0) return []

    const q = normalizeCatalogText(searchQuery.value)

    return list.filter((product: CatalogProduct) => {
      if (!product || !product.name) return false
      const nameNorm = normalizeCatalogText(product.name)
      const descNorm = normalizeCatalogText(product.description || '')

      // 1. Filtro por búsqueda de texto
      if (q.length > 0) {
        const matchesSearch = nameNorm.includes(q) || descNorm.includes(q)
        if (!matchesSearch) return false
      }

      // 2. Filtro por categorías seleccionadas dinámicamente
      if (isAllSelected.value) return true

      return selectedCategories.value.some(catId => matchProductCategory(product, catId))
    })
  })

  // Agrupación de productos por secciones de categoría (respetando sort_order del admin)
  const groupedSections = computed<CatalogSection[]>(() => {
    const prods = filteredProducts.value || []
    if (prods.length === 0) return []

    const catsList = rawCategories?.value || []
    const sections: CatalogSection[] = []
    const assignedIds = new Set<string | number>()

    // Si hay una categoría única seleccionada distinta de 'todos'
    if (selectedCategories.value.length === 1 && selectedCategories.value[0] !== 'todos') {
      const singleId = selectedCategories.value[0]
      const activeCat = catsList.find(c => c.id === singleId)
      return [{
        id: singleId,
        name: activeCat?.name || 'Selección',
        icon: activeCat?.icon || 'lucide:sparkles',
        products: prods
      }]
    }

    // Filtrar lista de categorías si hay selección múltiple activa
    const visibleCats = isAllSelected.value
      ? catsList
      : catsList.filter(c => selectedCategories.value.includes(c.id))

    // Para cada categoría activa de la BD (en orden de prioridad del admin)
    for (const cat of visibleCats) {
      const sectionProducts = prods.filter(p => {
        const matches = matchProductCategory(p, cat.id)
        if (matches) assignedIds.add(p.id)
        return matches
      })

      if (sectionProducts.length > 0) {
        sections.push({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || 'lucide:sparkles',
          products: sectionProducts
        })
      }
    }

    // Postres sin categoría asociada (sólo si se ve 'todos' o se seleccionó 'otras')
    if (isAllSelected.value || selectedCategories.value.includes('otras')) {
      const unassigned = prods.filter(p => !assignedIds.has(p.id))
      if (unassigned.length > 0) {
        sections.push({
          id: 'otras',
          name: 'Otras Creaciones del Taller',
          icon: 'lucide:sparkles',
          products: unassigned
        })
      }
    }

    return sections
  })

  function handleAddToCart(product: CatalogProduct, quantity: number = 1): void {
    const qty = Math.max(1, quantity)
    for (let i = 0; i < qty; i++) {
      cartStore.addToCart(product)
    }
    toast.success('¡Agregado al pedido!', {
      description: `${qty > 1 ? `${qty}x ` : ''}${product.name} — S/ ${(Number(product.price) * qty).toFixed(2)}`
    })
  }

  function getProductImage(product: CatalogProduct): string {
    if (product.image_url && product.image_url.trim() !== '') {
      return product.image_url
    }
    const name = (product.name || '').toLowerCase()
    if (name.includes('torta') || name.includes('chocolate')) {
      return '/images/desserts/torta-chocolate-frutos.jpg'
    }
    if (name.includes('tarta') || name.includes('fresa') || name.includes('pistacho')) {
      return '/images/desserts/tartaleta-fresas-pistacho.jpg'
    }
    return '/images/desserts/torta-chocolate-frutos.jpg'
  }

  function resetFilters(): void {
    searchQuery.value = ''
    selectedCategories.value = ['todos']
  }

  return {
    searchQuery,
    selectedCategory,
    selectedCategories,
    categories,
    filteredProducts,
    groupedSections,
    isAllSelected,
    toggleCategory,
    setOnlyCategory,
    isCategoryActive,
    handleAddToCart,
    getProductImage,
    resetFilters
  }
}
