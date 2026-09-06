import { ref, computed, type Ref } from 'vue'
import type { RawMaterialRow } from '../../types/inventory'

export function getMaterialIcon(name: string | null | undefined): string {
  if (!name) return 'lucide:box'
  const n = name.toLowerCase()
  
  const hasWord = (w: string) => new RegExp(`\\b${w}\\b`, 'i').test(n)

  // 1. Carnes, Aves, Pescados y Charcutería (Insumos Salados)
  if (n.includes('carne') || hasWord('res') || n.includes('lomo') || n.includes('asado') || n.includes('bife') || n.includes('cerdo') || n.includes('chancho') || n.includes('tocino') || n.includes('panceta') || n.includes('jamon') || n.includes('jamón') || n.includes('jamonada') || n.includes('salame') || n.includes('salchicha') || n.includes('chorizo') || n.includes('hotdog') || n.includes('chicharron')) return 'lucide:beef'
  if (n.includes('pollo') || n.includes('gallina') || n.includes('pavo') || n.includes('alitas') || n.includes('pechuga') || n.includes('nugget')) return 'lucide:drumstick'
  if (n.includes('pescado') || n.includes('atun') || n.includes('atún') || n.includes('salmon') || n.includes('salmón') || n.includes('marisco') || n.includes('camaron') || n.includes('langostino')) return 'lucide:fish'

  // 2. Lácteos, Quesos y Grasas
  if (n.includes('leche') || n.includes('condensada') || n.includes('evaporada') || n.includes('lacteo')) return 'lucide:milk'
  if (n.includes('queso') || n.includes('cheese') || n.includes('mozzarella') || n.includes('parmesano') || n.includes('edam') || n.includes('gouda') || n.includes('cheddar') || n.includes('crema') || n.includes('chantilly') || n.includes('yogurt')) return 'lucide:ice-cream-2'
  if (n.includes('mantequilla') || n.includes('margarina') || n.includes('manteca') || n.includes('grasa')) return 'lucide:sandwich'

  // 3. Masas, Panes e Insumos Salados
  if (hasWord('pan') || hasWord('panes') || n.includes('baguette') || n.includes('ciabatta') || n.includes('brioche') || n.includes('miga')) return 'lucide:sandwich'
  if (n.includes('hojaldre') || n.includes('empanada') || n.includes('croissant') || n.includes('medialuna') || n.includes('milhojas') || n.includes('cachito')) return 'lucide:croissant'
  if (n.includes('pizza') || n.includes('focaccia') || n.includes('quiche') || n.includes('calzone')) return 'lucide:pizza'

  // 4. Harinas, Polvos, Féculas y Cereales
  if (n.includes('harina') || n.includes('trigo') || n.includes('maizena') || n.includes('fecula') || n.includes('fécula') || n.includes('chuño') || n.includes('avena') || n.includes('polvo de hornear') || n.includes('premix') || n.includes('salvado')) return 'lucide:wheat'

  // 5. Chocolates, Cacao y Galletas
  if (n.includes('chocolate') || n.includes('cacao') || n.includes('chispas') || n.includes('chips') || n.includes('cocoa')) return 'lucide:cookie'
  if (n.includes('oblea') || n.includes('galleta') || n.includes('bizcocho') || n.includes('wafer')) return 'lucide:croissant'

  // 6. Dulces, Rellenos, Mermeladas y Azúcares
  if (n.includes('mermelada') || n.includes('jalea') || n.includes('almibar') || n.includes('almíbar') || n.includes('jarabe') || n.includes('sirope') || n.includes('miel') || n.includes('compota')) return 'lucide:amphora'
  if (n.includes('manjar') || n.includes('dulce de leche') || n.includes('fudge') || n.includes('nutella') || n.includes('fondant') || n.includes('glaseado') || n.includes('cobertura')) return 'lucide:donut'
  if (n.includes('azucar') || n.includes('azúcar') || n.includes('impalpable') || n.includes('caramelo') || n.includes('rubia') || n.includes('blanca')) return 'lucide:candy'

  // 7. Huevos
  if (n.includes('huevo') || n.includes('huevos') || n.includes('yema') || n.includes('clara')) return 'lucide:egg'

  // 8. Frutas, Cítricos y Verduras/Hortalizas
  if (n.includes('fresa') || n.includes('frutilla') || n.includes('cereza') || n.includes('frambuesa') || n.includes('guinda') || n.includes('berrie') || n.includes('arándano') || n.includes('arandano')) return 'lucide:cherry'
  if (n.includes('limon') || n.includes('limón') || n.includes('naranja') || n.includes('citrico') || n.includes('maracuya') || n.includes('maracuyá') || n.includes('lima')) return 'lucide:citrus'
  if (n.includes('manzana') || n.includes('durazno') || n.includes('pera') || n.includes('damasco') || n.includes('membrillo')) return 'lucide:apple'
  if (n.includes('platano') || n.includes('plátano') || n.includes('banana')) return 'lucide:banana'
  if (n.includes('uva') || n.includes('pasa') || n.includes('pasas') || n.includes('higo')) return 'lucide:grape'
  if (n.includes('cebolla') || n.includes('tomate') || n.includes('aceituna') || n.includes('espinaca') || n.includes('pimiento') || n.includes('perejil') || n.includes('verdura')) return 'lucide:carrot'

  // 9. Frutos Secos
  if (n.includes('almendra') || n.includes('nuez') || n.includes('pecana') || n.includes('mani') || n.includes('maní') || n.includes('pistacho') || n.includes('castaña') || n.includes('avellana') || n.includes('ajonjoli')) return 'lucide:nut'

  // 10. Líquidos, Aceites, Esencias y Licores
  if (n.includes('aceite') || n.includes('oliva') || n.includes('vegetal')) return 'lucide:droplet'
  if (n.includes('esencia') || n.includes('vainilla') || n.includes('aroma') || n.includes('colorante') || n.includes('tinta')) return 'lucide:amphora'

  return 'lucide:box'
}

export function calculateUnitCost(price: number | null | undefined, quantity: number | null | undefined): number {
  if (!price || !quantity || quantity <= 0) return 0
  return price / quantity
}

export function useAdminMaterials(materialsList: Ref<RawMaterialRow[]>) {
  const searchQuery = ref<string>('')
  const isSearchFocused = ref<boolean>(false)
  const currentPage = ref<number>(1)
  const itemsPerPage = 10

  const filteredMaterials = computed<RawMaterialRow[]>(() => {
    const list = materialsList.value || []
    if (!list.length) return []
    if (!searchQuery.value.trim()) return list

    const q = searchQuery.value.toLowerCase().trim()
    return list.filter((item: RawMaterialRow) => {
      const name = item.name ? item.name.toLowerCase() : ''
      const unit = item.unit ? item.unit.toLowerCase() : ''
      return name.includes(q) || unit.includes(q)
    })
  })

  const searchSuggestions = computed<RawMaterialRow[]>(() => {
    if (!searchQuery.value.trim()) return []
    return filteredMaterials.value.slice(0, 5)
  })

  const paginatedMaterials = computed<RawMaterialRow[]>(() => {
    if (!filteredMaterials.value.length) return []
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredMaterials.value.slice(start, end)
  })

  const totalPages = computed<number>(() => {
    if (!filteredMaterials.value.length) return 1
    return Math.ceil(filteredMaterials.value.length / itemsPerPage)
  })

  function selectSuggestion(item: RawMaterialRow): void {
    searchQuery.value = item.name || ''
    isSearchFocused.value = false
  }

  function clearSearch(): void {
    searchQuery.value = ''
    isSearchFocused.value = false
  }

  function nextPage(): void {
    if (currentPage.value < totalPages.value) currentPage.value++
  }

  function prevPage(): void {
    if (currentPage.value > 1) currentPage.value--
  }

  return {
    searchQuery,
    isSearchFocused,
    currentPage,
    itemsPerPage,
    filteredMaterials,
    searchSuggestions,
    paginatedMaterials,
    totalPages,
    selectSuggestion,
    clearSearch,
    nextPage,
    prevPage,
    getMaterialIcon,
    calculateUnitCost
  }
}
