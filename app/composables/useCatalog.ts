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
  const selectedCategory = ref<string>('todos')

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

  const filteredProducts = computed<CatalogProduct[]>(() => {
    const list = rawProducts.value || []
    if (!Array.isArray(list) || list.length === 0) return []

    const q = normalizeCatalogText(searchQuery.value)
    const cat = selectedCategory.value

    return list.filter((product: CatalogProduct) => {
      if (!product || !product.name) return false
      const nameNorm = normalizeCatalogText(product.name)
      const descNorm = normalizeCatalogText(product.description || '')

      // 1. Filtro por búsqueda de texto
      if (q.length > 0) {
        const matchesSearch = nameNorm.includes(q) || descNorm.includes(q)
        if (!matchesSearch) return false
      }

      // 2. Filtro por categoría dinámico desde BD
      if (cat === 'todos') return true

      return matchProductCategory(product, cat)
    })
  })

  // Agrupación de productos por secciones de categoría (respetando sort_order del admin)
  const groupedSections = computed<CatalogSection[]>(() => {
    const prods = filteredProducts.value || []
    if (prods.length === 0) return []

    const catsList = rawCategories?.value || []
    const sections: CatalogSection[] = []
    const assignedIds = new Set<string | number>()

    // Si el usuario seleccionó una categoría específica distinta de 'todos'
    if (selectedCategory.value !== 'todos') {
      const activeCat = catsList.find(c => c.id === selectedCategory.value)
      return [{
        id: selectedCategory.value,
        name: activeCat?.name || 'Selección',
        icon: activeCat?.icon || 'lucide:sparkles',
        products: prods
      }]
    }

    // Para cada categoría de la BD (en orden de prioridad del admin)
    for (const cat of catsList) {
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

    // Postres sin categoría asociada
    const unassigned = prods.filter(p => !assignedIds.has(p.id))
    if (unassigned.length > 0) {
      sections.push({
        id: 'otras',
        name: 'Otras Creaciones del Taller',
        icon: 'lucide:sparkles',
        products: unassigned
      })
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
    selectedCategory.value = 'todos'
  }

  return {
    searchQuery,
    selectedCategory,
    categories,
    filteredProducts,
    groupedSections,
    handleAddToCart,
    getProductImage,
    resetFilters
  }
}
