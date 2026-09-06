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

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { id: 'todos', name: 'Todos los Postres', icon: 'lucide:sparkles' },
  { id: 'tortas', name: 'Tortas & Pasteles', icon: 'lucide:cake' },
  { id: 'tartaletas', name: 'Tartaletas & Pies', icon: 'lucide:pie-chart' },
  { id: 'cheesecakes', name: 'Cheesecakes', icon: 'lucide:heart' },
  { id: 'bocaditos', name: 'Boxes & Porciones', icon: 'lucide:box' }
]

export function useCatalog(rawProducts: ComputedRef<CatalogProduct[]>) {
  const cartStore = useCartStore()
  const searchQuery = ref<string>('')
  const selectedCategory = ref<string>('todos')

  const categories = CATALOG_CATEGORIES

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

      // 2. Filtro por categoría
      if (cat === 'todos') return true
      if (cat === 'tortas') {
        return (nameNorm.includes('torta') || nameNorm.includes('pastel') || nameNorm.includes('cake')) && !nameNorm.includes('cheesecake')
      }
      if (cat === 'tartaletas') {
        return nameNorm.includes('tarta') || nameNorm.includes('pie')
      }
      if (cat === 'cheesecakes') {
        return nameNorm.includes('cheesecake') || nameNorm.includes('cheese')
      }
      if (cat === 'bocaditos') {
        return nameNorm.includes('box') || nameNorm.includes('alfajor') || nameNorm.includes('brownie') || nameNorm.includes('cajita')
      }

      return true
    })
  })

  function handleAddToCart(product: CatalogProduct): void {
    cartStore.addToCart(product)
    toast.success('¡Agregado al pedido!', {
      description: `${product.name} — S/ ${Number(product.price).toFixed(2)}`
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
    handleAddToCart,
    getProductImage,
    resetFilters
  }
}
