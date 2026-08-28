<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  materials: any
  pendingMaterials: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const newMaterial = ref({ name: '', unit: 'g', purchase_price: '', purchase_quantity: '', stock: '' })
const editingMaterialId = ref<string | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

// Local state for Optimistic UI
const localMaterials = ref<any[]>([]);

watch(() => props.materials?.data, (newData) => {
  if (newData) {
    localMaterials.value = [...newData];
  }
}, { immediate: true });

// Search & Filter state
const searchQuery = ref('')
const isSearchFocused = ref(false)

const filteredMaterials = computed(() => {
  if (!localMaterials.value.length) return []
  if (!searchQuery.value.trim()) return localMaterials.value
  
  const q = searchQuery.value.toLowerCase().trim()
  return localMaterials.value.filter((item: any) => 
    item.name.toLowerCase().includes(q) ||
    (item.unit && item.unit.toLowerCase().includes(q))
  )
})

// Top 5 suggestions for live dropdown menu
const searchSuggestions = computed(() => {
  if (!searchQuery.value.trim()) return []
  return filteredMaterials.value.slice(0, 5)
})

function selectSuggestion(item: any) {
  searchQuery.value = item.name
  isSearchFocused.value = false
}

function clearSearch() {
  searchQuery.value = ''
  isSearchFocused.value = false
}

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

const paginatedMaterials = computed(() => {
  if (!filteredMaterials.value.length) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredMaterials.value.slice(start, end)
})

const totalPages = computed(() => {
  if (!filteredMaterials.value.length) return 1
  return Math.ceil(filteredMaterials.value.length / itemsPerPage)
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(() => props.materials?.data?.length, () => {
  currentPage.value = 1
})

async function handleCreateMaterial() {
  if (!newMaterial.value.name || !newMaterial.value.purchase_price || !newMaterial.value.purchase_quantity) {
    errorMessage.value = 'Completa el precio y la cantidad del paquete.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const method = editingMaterialId.value ? 'PUT' : 'POST'
    const endpoint = editingMaterialId.value ? `/api/raw-materials/${editingMaterialId.value}` : '/api/raw-materials'

    await $fetch(endpoint, {
      method,
      body: {
        name: newMaterial.value.name,
        unit: newMaterial.value.unit,
        purchase_price: Number(newMaterial.value.purchase_price),
        purchase_quantity: Number(newMaterial.value.purchase_quantity),
        stock: Number(newMaterial.value.stock || 0)
      }
    })
    
    cancelEditMaterial()
    emit('refresh')
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Error al guardar insumo.'
  } finally {
    isSubmitting.value = false
  }
}

function handleEditMaterial(item: any) {
  errorMessage.value = ''
  editingMaterialId.value = item.id
  newMaterial.value = { 
    name: item.name, 
    unit: item.unit, 
    purchase_price: item.purchase_price, 
    purchase_quantity: item.purchase_quantity, 
    stock: item.stock 
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditMaterial() {
  editingMaterialId.value = null
  newMaterial.value = { name: '', unit: 'g', purchase_price: '', purchase_quantity: '', stock: '' }
  errorMessage.value = ''
}

async function handleDeleteMaterial(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del inventario de insumos?`)) return
  
  // Optimistic UI update: Eliminar localmente primero para disparar la animación al instante
  const index = localMaterials.value.findIndex((m: any) => m.id === id);
  let deletedItem = null;
  if (index !== -1) {
    deletedItem = localMaterials.value[index];
    localMaterials.value.splice(index, 1);
  }

  try {
    await $fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
    // No llamamos a emit("refresh") para evitar el spinner y el retraso
  } catch (err: any) {
    // Si falla, revertimos el cambio local
    if (deletedItem && index !== -1) {
      localMaterials.value.splice(index, 0, deletedItem);
    }
    alert('Error al eliminar: ' + (err.data?.statusMessage || err.message))
  }
}

const updatingStockId = ref<string | null>(null)

async function updateStockInline(item: any, event: any) {
  const newStock = Number(event.target.value)
  if (newStock === item.stock || isNaN(newStock)) return
  
  updatingStockId.value = item.id
  try {
    await $fetch(`/api/raw-materials/${item.id}`, {
      method: 'PUT',
      body: {
        name: item.name,
        unit: item.unit,
        purchase_price: item.purchase_price,
        purchase_quantity: item.purchase_quantity,
        stock: newStock
      }
    })
    emit('refresh')
  } catch (err: any) {
    alert('Error al actualizar stock: ' + (err.data?.statusMessage || err.message))
    event.target.value = item.stock // revert
  } finally {
    updatingStockId.value = null
  }
}

const showModal = ref(false)
const selectedMaterial = ref<any>(null)

function openNewMaterialModal() {
  selectedMaterial.value = null
  showModal.value = true
}

function openEditMaterial(item: any) {
  selectedMaterial.value = item
  showModal.value = true
}

function getMaterialIcon(name: string): string {
  if (!name) return 'lucide:box'
  const n = name.toLowerCase()
  
  // 1. Carnes, Aves, Pescados y Charcutería (Insumos Salados)
  if (n.includes('carne') || n.includes('res') || n.includes('lomo') || n.includes('asado') || n.includes('bife') || n.includes('cerdo') || n.includes('chancho') || n.includes('tocino') || n.includes('panceta') || n.includes('jamon') || n.includes('jamón') || n.includes('jamonada') || n.includes('salame') || n.includes('salchicha') || n.includes('chorizo') || n.includes('hotdog') || n.includes('chicharron')) return 'lucide:beef'
  if (n.includes('pollo') || n.includes('gallina') || n.includes('pavo') || n.includes('alitas') || n.includes('pechuga') || n.includes('nugget')) return 'lucide:drumstick'
  if (n.includes('pescado') || n.includes('atun') || n.includes('atún') || n.includes('salmon') || n.includes('salmón') || n.includes('marisco') || n.includes('camaron') || n.includes('langostino')) return 'lucide:fish'

  // 2. Lácteos, Quesos y Grasas
  if (n.includes('leche') || n.includes('condensada') || n.includes('evaporada') || n.includes('lacteo')) return 'lucide:milk'
  if (n.includes('queso') || n.includes('cheese') || n.includes('mozzarella') || n.includes('parmesano') || n.includes('edam') || n.includes('gouda') || n.includes('cheddar') || n.includes('crema') || n.includes('chantilly') || n.includes('yogurt')) return 'lucide:ice-cream-2'
  if (n.includes('mantequilla') || n.includes('margarina') || n.includes('manteca') || n.includes('grasa')) return 'lucide:sandwich'

  // 3. Masas, Panes e Insumos Salados
  if (n.includes('pan') || n.includes('panes') || n.includes('baguette') || n.includes('ciabatta') || n.includes('brioche') || n.includes('miga')) return 'lucide:sandwich'
  if (n.includes('hojaldre') || n.includes('empanada') || n.includes('croissant') || n.includes('medialuna') || n.includes('milhojas') || n.includes('cachito')) return 'lucide:croissant'
  if (n.includes('pizza') || n.includes('focaccia') || n.includes('quiche') || n.includes('calzone')) return 'lucide:pizza'

  // 4. Harinas, Polvos, Féculas y Cereales
  if (n.includes('harina') || n.includes('trigo') || n.includes('maizena') || n.includes('fecula') || n.includes('fécula') || n.includes('chuño') || n.includes('avena') || n.includes('polvo de hornear') || n.includes('premix') || n.includes('salvado')) return 'lucide:wheat'

  // 5. Dulces, Rellenos, Mermeladas y Azúcares
  if (n.includes('mermelada') || n.includes('jalea') || n.includes('almibar') || n.includes('almíbar') || n.includes('jarabe') || n.includes('sirope') || n.includes('miel') || n.includes('compota')) return 'lucide:amphora'
  if (n.includes('manjar') || n.includes('dulce de leche') || n.includes('fudge') || n.includes('nutella') || n.includes('fondant') || n.includes('glaseado') || n.includes('cobertura')) return 'lucide:donut'
  if (n.includes('azucar') || n.includes('azúcar') || n.includes('impalpable') || n.includes('caramelo') || n.includes('rubia') || n.includes('blanca')) return 'lucide:candy'

  // 6. Huevos
  if (n.includes('huevo') || n.includes('huevos') || n.includes('yema') || n.includes('clara')) return 'lucide:egg'

  // 7. Chocolates, Cacao y Galletas
  if (n.includes('chocolate') || n.includes('cacao') || n.includes('chispas') || n.includes('chips') || n.includes('cocoa')) return 'lucide:cookie'
  if (n.includes('oblea') || n.includes('galleta') || n.includes('bizcocho') || n.includes('wafer')) return 'lucide:croissant'

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
  if (n.includes('ron') || n.includes('pisco') || n.includes('licor') || n.includes('vino') || n.includes('cerveza')) return 'lucide:glass-water'

  // 11. Levadura, Sal y Condimentos / Especias
  if (n.includes('levadura') || n.includes('fermento') || n.includes('masa madre')) return 'lucide:hop'
  if (n.includes('sal') || n.includes('bicarbonato') || n.includes('canela') || n.includes('clavo') || n.includes('especias') || n.includes('oregano') || n.includes('orégano') || n.includes('pimienta')) return 'lucide:sparkles'
  if (n.includes('cafe') || n.includes('café') || n.includes('matcha') || n.includes('te') || n.includes('té')) return 'lucide:coffee'

  // 12. Empaques, Cajas, Moldes y Pirotines
  if (n.includes('caja') || n.includes('empaque') || n.includes('bolsa') || n.includes('envase') || n.includes('pirotin') || n.includes('papel') || n.includes('domo') || n.includes('cinta')) return 'lucide:package'

  return 'lucide:box'
}

function onSearchBlur() {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 200)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Controls: Title, Search & Actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-dashed border-[#4A5D23]/30">
      <div class="flex items-center gap-3">
        <Icon name="lucide:scale" class="w-6 h-6 text-[#4A5D23]" />
        <h2 class="text-2xl font-playfair font-black text-[#2A321B] tracking-tight">
          Almacén de Insumos & Costos
        </h2>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <!-- Buscador Inteligente con Sugerencias en Tiempo Real -->
        <div class="relative flex-1 sm:w-72" @focusin="isSearchFocused = true" @blur="onSearchBlur">
          <div class="relative flex items-center">
            <Icon name="lucide:search" class="w-4 h-4 text-[#4A5D23]/50 absolute left-3.5 pointer-events-none" />
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar insumo..."
              class="w-full pl-9 pr-9 py-2.5 bg-white rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-xs font-bold text-[#2A321B] placeholder:text-[#4A5D23]/40 shadow-sm transition-all"
            />
            <button 
              v-if="searchQuery" 
              @click="clearSearch" 
              class="absolute right-3 text-[#4A5D23]/40 hover:text-[#4A5D23] transition-colors"
              title="Limpiar búsqueda"
            >
              <Icon name="lucide:x" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Sugerencias en tiempo real -->
          <Transition name="fade">
            <div 
              v-if="isSearchFocused && searchQuery && searchSuggestions.length > 0" 
              class="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl border border-[#4A5D23]/20 shadow-lg overflow-hidden z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar divide-y divide-[#4A5D23]/5"
            >
              <button
                v-for="suggestion in searchSuggestions"
                :key="suggestion.id"
                @mousedown="selectSuggestion(suggestion)"
                class="w-full text-left px-4 py-2.5 hover:bg-[#F4F1E1]/60 text-xs font-bold text-[#2A321B] hover:text-[#4A5D23] transition-colors cursor-pointer truncate block"
              >
                {{ suggestion.name }}
              </button>
            </div>
          </Transition>
        </div>

        <!-- Botón Nuevo Insumo -->
        <button 
          @click="openNewMaterialModal" 
          class="flex items-center gap-2 px-4 py-2.5 bg-[#4A5D23] text-white rounded-xl font-bold text-xs shadow-sm hover:bg-[#3C4A1C] active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          Nuevo Insumo
        </button>

        <!-- Botón Actualizar -->
        <button 
          @click="$emit('refresh')" 
          class="w-9 h-9 rounded-xl bg-white border border-[#4A5D23]/20 text-[#4A5D23] hover:bg-[#F4F1E1] flex items-center justify-center transition-all shadow-sm shrink-0" 
          title="Actualizar"
        >
          <Icon name="lucide:refresh-cw" :class="['w-4 h-4', pendingMaterials ? 'animate-spin' : '']" />
        </button>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="mb-4 bg-white border-2 border-red-800 text-red-900 p-4 rounded-xl text-sm flex items-start gap-3 shadow-sm">
      <Icon name="lucide:triangle-alert" class="w-5 h-5 shrink-0 mt-0.5" />
      <span class="font-medium leading-relaxed">{{ errorMessage }}</span>
    </div>

    <!-- State: Loading -->
    <div v-if="pendingMaterials && (!materials?.data)" class="flex flex-col items-center justify-center py-16">
      <div class="relative w-12 h-12 mb-4 text-[#4A5D23]">
         <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
      </div>
      <p class="text-[11px] font-bold tracking-widest uppercase text-[#4A5D23] animate-pulse">Cargando inventario...</p>
    </div>

    <!-- State: Empty (No materials) -->
    <div v-else-if="!materials?.data || materials.data.length === 0" class="text-center py-20 bg-white rounded-3xl border border-[#4A5D23]/20 shadow-sm">
      <Icon name="lucide:package-open" class="w-12 h-12 text-[#4A5D23]/50 mx-auto mb-4" />
      <h3 class="text-lg font-playfair font-bold text-[#2A321B] mb-2 tracking-tight">Sin Insumos Registrados</h3>
      <p class="text-[#4A5D23]/80 font-medium text-sm max-w-sm mx-auto text-balance leading-relaxed mb-6">
        Agrega tu primer insumo para comenzar a calcular tus costos reales.
      </p>
      <button 
        @click="openNewMaterialModal" 
        class="inline-flex items-center gap-2 px-5 py-3 bg-[#4A5D23] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#3C4A1C] transition-all"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        Agregar Insumo Ahora
      </button>
    </div>

    <!-- State: No Search Results -->
    <div v-else-if="filteredMaterials.length === 0 && searchQuery" class="text-center py-16 bg-white rounded-3xl border border-[#4A5D23]/10 shadow-sm p-6">
      <Icon name="lucide:search-x" class="w-12 h-12 text-[#4A5D23]/40 mx-auto mb-3" />
      <h3 class="text-base font-playfair font-bold text-[#2A321B] mb-1">Sin resultados para "{{ searchQuery }}"</h3>
      <p class="text-xs text-[#4A5D23]/70 font-medium mb-4">No encontramos ningún insumo que coincida con tu búsqueda.</p>
      <button @click="clearSearch" class="px-4 py-2 bg-[#F4F1E1] text-[#4A5D23] rounded-xl text-xs font-bold hover:bg-[#e6e2cc] transition-colors">
        Limpiar búsqueda
      </button>
    </div>

    <!-- State: List -->
    <TransitionGroup 
      v-else 
      name="list" 
      tag="div" 
      class="flex-1 flex flex-col gap-3 relative"
    >
      <div v-for="item in paginatedMaterials" :key="item.id" class="bg-white rounded-2xl border border-[#4A5D23]/10 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-all duration-300 group">
        
        <!-- Ícono Temático Inteligente por Insumo -->
        <div class="w-12 h-12 rounded-2xl bg-[#F4F1E1] border border-[#4A5D23]/15 flex items-center justify-center text-[#4A5D23] shrink-0 shadow-sm group-hover:scale-105 group-hover:bg-[#4A5D23] group-hover:text-white transition-all duration-300">
          <Icon :name="getMaterialIcon(item.name)" class="w-6 h-6" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <!-- Name & Purchase -->
          <div>
            <h3 class="font-bold text-[#2A321B] text-base truncate">{{ item.name }}</h3>
            <p class="text-[10px] font-bold text-[#4A5D23]/70 uppercase tracking-widest mt-0.5">
              Compra: S/ {{ Number(item.purchase_price).toFixed(2) }} / {{ item.purchase_quantity }}{{ item.unit }}
            </p>
          </div>
          
          <!-- Stock Input -->
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-bold text-[#4A5D23]/70 uppercase tracking-widest">Stock:</span>
            <div class="inline-flex items-center gap-1 bg-[#F4F1E1]/60 border border-[#4A5D23]/20 rounded-xl px-2.5 py-1 focus-within:border-[#4A5D23] focus-within:bg-white transition-all relative">
              <input 
                type="number" 
                :value="item.stock" 
                @blur="updateStockInline(item, $event)"
                @keyup.enter="updateStockInline(item, $event)"
                :disabled="updatingStockId === item.id"
                class="w-14 text-center text-xs font-bold text-[#2A321B] bg-transparent focus:outline-none disabled:opacity-50"
              />
              <span class="text-[10px] font-bold text-[#4A5D23]">{{ item.unit }}</span>
              <Icon v-if="updatingStockId === item.id" name="lucide:loader-2" class="absolute -right-5 w-4 h-4 text-[#4A5D23] animate-spin" />
            </div>
          </div>

          <!-- Unit Cost -->
          <div class="text-right">
            <p class="text-base font-black text-[#2A321B]">
              S/ {{ Number(item.cost_per_unit || (item.purchase_price / item.purchase_quantity)).toFixed(2) }}
            </p>
            <p class="text-[10px] font-bold text-[#4A5D23]/70 uppercase tracking-widest mt-0.5">
              por {{ item.unit }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2 shrink-0 border-l border-[#4A5D23]/10 pl-4 ml-2">
          <button 
            @click="openEditMaterial(item)"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-[#4A5D23] bg-[#F4F1E1]/60 hover:bg-[#4A5D23] hover:text-white transition-colors"
            title="Editar"
          >
            <Icon name="lucide:pencil" class="w-4 h-4" />
          </button>
          <button 
            @click="handleDeleteMaterial(item.id, item.name)"
            class="w-9 h-9 rounded-xl flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors"
            title="Eliminar"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="flex items-center justify-between pt-4 px-4 py-3 bg-white rounded-2xl border border-[#4A5D23]/10 shadow-sm">
      <p class="text-xs font-bold text-[#4A5D23]/80 uppercase tracking-widest">
        Página {{ currentPage }} de {{ totalPages }}
      </p>
      <div class="flex items-center gap-3">
        <button 
          @click="prevPage" 
          :disabled="currentPage === 1"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 border-2 shadow-sm text-[#2A321B] bg-white border-[#2A321B] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
        >
          <Icon name="lucide:chevron-left" class="w-4 h-4" />
          Atrás
        </button>
        <button 
          @click="nextPage" 
          :disabled="currentPage === totalPages"
          class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 border-2 shadow-sm text-[#2A321B] bg-white border-[#2A321B] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
        >
          Siguiente
          <Icon name="lucide:chevron-right" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Modal de Insumo (Crear / Editar) -->
    <AdminMaterialModal 
      :show="showModal"
      :materialToEdit="selectedMaterial"
      @close="showModal = false"
      @saved="$emit('refresh')"
    />
  </div>
</template>

<style scoped>
/* Animaciones de Lista (Pop y Deslizamiento) */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.list-leave-active {
  position: absolute;
  width: 100%;
}
</style>
