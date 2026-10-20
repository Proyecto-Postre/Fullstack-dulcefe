<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { CatalogCategory } from '~/types/catalog'
import UiCustomSelect, { type SelectOption } from '~/components/ui/CustomSelect.vue'

const props = defineProps<{
  searchQuery: string
  selectedCategory?: string
  selectedCategories?: string[]
  categories: CatalogCategory[]
  portionFilter?: string
  priceRangeFilter?: string
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedCategory', val: string): void
  (e: 'update:selectedCategories', val: string[]): void
  (e: 'update:portionFilter', val: string): void
  (e: 'update:priceRangeFilter', val: string): void
  (e: 'toggleCategory', catId: string): void
  (e: 'resetAll'): void
}>()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Lista de categorías reales (excluyendo la opción virtual 'todos')
const realCategories = computed<CatalogCategory[]>(() => {
  return (props.categories || []).filter(c => c.id !== 'todos')
})

// Categorías actualmente activas
const activeCategoryIds = computed<string[]>(() => {
  const cats = props.selectedCategories
  if (Array.isArray(cats) && cats.length > 0) {
    const valid = cats.filter(c => c && c !== 'multiple')
    if (valid.length > 0) return valid
  }
  if (props.selectedCategory && props.selectedCategory !== 'todos' && props.selectedCategory !== 'multiple') {
    return [props.selectedCategory]
  }
  return ['todos']
})

const isAllSelected = computed<boolean>(() => {
  return activeCategoryIds.value.includes('todos') || activeCategoryIds.value.length === 0
})

function isCatActive(id: string): boolean {
  if (id === 'todos') return isAllSelected.value
  return activeCategoryIds.value.includes(id)
}

// Etiqueta e ícono dinámico para el botón desplegable principal
const activeFilterLabel = computed<string>(() => {
  if (isAllSelected.value) {
    return 'Todas las secciones (Toda la carta)'
  }
  if (activeCategoryIds.value.length === 1) {
    const singleCat = realCategories.value.find(c => c.id === activeCategoryIds.value[0])
    return singleCat ? singleCat.name : '1 sección seleccionada'
  }
  return `${activeCategoryIds.value.length} secciones seleccionadas`
})

const activeFilterIcon = computed<string>(() => {
  if (isAllSelected.value) {
    return 'lucide:sparkles'
  }
  if (activeCategoryIds.value.length === 1) {
    const singleCat = realCategories.value.find(c => c.id === activeCategoryIds.value[0])
    return singleCat?.icon || 'lucide:cake'
  }
  return 'lucide:layers'
})

function selectAll() {
  emit('update:selectedCategories', ['todos'])
  emit('update:selectedCategory', 'todos')
}

function toggleCategory(catId: string) {
  if (catId === 'todos') {
    selectAll()
    return
  }

  const current = activeCategoryIds.value.filter(id => id !== 'todos' && id !== 'multiple')
  const exists = current.includes(catId)
  let next: string[]

  if (exists) {
    const remaining = current.filter(id => id !== catId)
    next = remaining.length === 0 ? ['todos'] : remaining
  } else {
    next = [...current, catId]
  }

  emit('update:selectedCategories', next)
  const singleCat = next[0] || 'todos'
  emit('update:selectedCategory', next.includes('todos') ? 'todos' : (next.length === 1 ? singleCat : 'multiple'))
}

function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isDropdownOpen.value = false
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('click', handleClickOutside)
    window.removeEventListener('keydown', handleKeyDown)
  }
})

// Opciones de selector enriquecido CustomSelect para Porciones
const portionOptions: SelectOption[] = [
  { label: 'Todas las porciones', value: 'all', sublabel: 'Cualquier tamaño' },
  { label: '1 a 4 porciones', value: '1-4', sublabel: 'Individual / Pareja' },
  { label: '6 a 10 porciones', value: '6-10', sublabel: 'Familiar' },
  { label: '12+ porciones', value: '12+', sublabel: 'Celebración' }
]

// Opciones de selector enriquecido CustomSelect para Presupuesto / Precio
const priceRangeOptions: SelectOption[] = [
  { label: 'Todos los precios', value: 'all', sublabel: 'Cualquier presupuesto' },
  { label: 'Hasta S/ 30', value: 'under-30', sublabel: 'Antojos y porciones' },
  { label: 'S/ 30 a S/ 60', value: '30-60', sublabel: 'Postres medianos' },
  { label: 'Más de S/ 60', value: 'above-60', sublabel: 'Tortas y celebraciones' }
]

const hasActiveSecondaryFilters = computed(() => {
  return (props.portionFilter && props.portionFilter !== 'all') || (props.priceRangeFilter && props.priceRangeFilter !== 'all')
})
</script>

<template>
  <div class="mb-6 sm:mb-9 w-full">
    <!-- Barra Unificada de Exploración: Buscador a la izquierda y Filtros a la derecha en una sola fila continua -->
    <div class="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 sm:gap-3 w-full">
      <!-- Izquierda: Buscador (Ocupa todo el espacio dinámico disponible en desktop) -->
      <div class="relative flex-1 min-w-0">
        <Icon 
          name="lucide:search" 
          class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/60 pointer-events-none" 
        />
        <input 
          :value="searchQuery" 
          @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
          type="text" 
          placeholder="Buscar por nombre o sabor (chocolate, fresa, torta, brownie)..." 
          class="w-full h-11 sm:h-12 pl-12 pr-10 bg-surface rounded-2xl border border-brand-primary/20 text-xs sm:text-sm font-semibold text-brand-secondary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 transition-all shadow-soft-sm"
        />
        <button 
          v-if="searchQuery" 
          @click="$emit('update:searchQuery', '')"
          type="button"
          class="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50 hover:text-status-danger p-1 cursor-pointer transition-colors"
          aria-label="Limpiar búsqueda"
        >
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>

      <!-- Derecha: Cluster de Filtros (Secciones + Porciones + Precios) -->
      <div 
        v-if="realCategories.length > 0" 
        ref="dropdownRef" 
        class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0"
      >
        <!-- 1. Filtro Principal de Especialidades / Secciones -->
        <div class="relative w-full sm:w-auto lg:w-60 xl:w-72 shrink-0">
          <button
            @click.stop="toggleDropdown"
            type="button"
            :class="[
              'w-full h-11 sm:h-12 inline-flex items-center justify-between gap-2 px-3.5 sm:px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 border cursor-pointer select-none active:scale-98 shadow-soft-sm relative',
              !isAllSelected
                ? 'bg-brand-primary text-white border-brand-primary shadow-soft-md'
                : 'bg-surface text-brand-secondary border-brand-primary/20 hover:bg-brand-cream hover:border-brand-primary/35'
            ]"
            :aria-expanded="isDropdownOpen"
            aria-label="Filtrar por sección de la carta"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <Icon :name="activeFilterIcon" class="w-4 h-4 text-brand-accent shrink-0" />
              <span class="whitespace-nowrap font-bold truncate">
                <span class="sm:hidden">{{ isAllSelected ? 'Todas las secciones' : activeFilterLabel }}</span>
                <span class="hidden sm:inline">{{ activeFilterLabel }}</span>
              </span>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                v-if="!isAllSelected"
                @click.stop="selectAll"
                type="button"
                class="w-5 h-5 rounded-full bg-white/20 hover:bg-white/35 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                title="Restablecer a toda la carta"
                aria-label="Restablecer a toda la carta"
              >
                <Icon name="lucide:x" class="w-3 h-3" />
              </button>
              <Icon 
                name="lucide:chevron-down" 
                :class="['w-4 h-4 transition-transform duration-200 shrink-0 opacity-80', isDropdownOpen ? 'rotate-180' : '']" 
              />
            </div>
          </button>

          <!-- Menú Desplegable Flotante Elegante con Selección Múltiple -->
          <Transition name="dropdown-fade">
            <div
              v-if="isDropdownOpen"
              class="absolute left-0 sm:left-auto sm:right-0 lg:left-0 top-full mt-2 w-full sm:w-80 bg-white rounded-2xl border border-brand-primary/20 shadow-2xl p-3 z-50"
            >
              <!-- Encabezado del Popover -->
              <div class="px-2 py-1.5 border-b border-brand-primary/10 mb-2 flex items-center justify-between">
                <span class="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                  Filtrar por Especialidad
                </span>
                <span class="text-[10px] text-brand-secondary/60 font-semibold">
                  Selección múltiple
                </span>
              </div>

              <div class="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar p-0.5">
                <!-- Opción: Toda la Carta (Todos los Postres) -->
                <button
                  @click="selectAll"
                  type="button"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border',
                    isAllSelected
                      ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm'
                      : 'text-brand-secondary hover:bg-brand-cream border-transparent'
                  ]"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div 
                      :class="[
                        'w-4 h-4 rounded-full flex items-center justify-center border transition-colors shrink-0',
                        isAllSelected ? 'border-white bg-white/20' : 'border-brand-primary/30'
                      ]"
                    >
                      <div v-if="isAllSelected" class="w-2 h-2 rounded-full bg-brand-accent"></div>
                    </div>
                    <Icon name="lucide:sparkles" class="w-4 h-4 shrink-0 text-brand-accent" />
                    <span class="truncate">Toda la Carta (Todos los postres)</span>
                  </div>
                  <span v-if="isAllSelected" class="text-[10px] uppercase font-bold tracking-wider opacity-90">
                    Activo
                  </span>
                </button>

                <!-- Separador -->
                <div class="border-t border-brand-primary/10 my-1"></div>

                <!-- Opciones Individuales de Categoría con Checkbox Múltiple -->
                <button
                  v-for="cat in realCategories"
                  :key="cat.id"
                  @click="toggleCategory(cat.id)"
                  type="button"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer border',
                    isCatActive(cat.id)
                      ? 'bg-brand-cream text-brand-secondary border-brand-primary/30 shadow-soft-xs'
                      : 'text-brand-secondary hover:bg-brand-cream/60 border-transparent'
                  ]"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <!-- Checkbox Artesanal -->
                    <div 
                      :class="[
                        'w-4 h-4 rounded-md flex items-center justify-center border transition-colors shrink-0',
                        isCatActive(cat.id)
                          ? 'bg-brand-primary border-brand-primary text-white'
                          : 'border-brand-primary/30 bg-surface'
                      ]"
                    >
                      <Icon v-if="isCatActive(cat.id)" name="lucide:check" class="w-3 h-3 text-white" />
                    </div>
                    <Icon :name="cat.icon" class="w-4 h-4 shrink-0 text-brand-primary" />
                    <span class="truncate">{{ cat.name }}</span>
                  </div>
                  <span 
                    v-if="isCatActive(cat.id)" 
                    class="text-[10px] font-bold text-brand-primary bg-brand-primary/10 px-1.5 py-0.5 rounded-md"
                  >
                    Visible
                  </span>
                </button>
              </div>

              <!-- Pie del Popover con Botón Listo / Aplicar -->
              <div class="border-t border-brand-primary/10 pt-2 mt-2 flex items-center justify-between">
                <button
                  @click="selectAll"
                  type="button"
                  class="text-[11px] font-bold text-brand-primary hover:text-brand-secondary transition-colors cursor-pointer"
                >
                  Restablecer todo
                </button>
                <button
                  @click="isDropdownOpen = false"
                  type="button"
                  class="px-3.5 py-1.5 rounded-full bg-brand-primary text-white text-xs font-bold shadow-soft-sm hover:bg-brand-secondary transition-all cursor-pointer active:scale-95"
                >
                  Listo
                </button>
              </div>
            </div>
          </Transition>
        </div>

        <!-- 2. Sub-cluster: Porciones y Precios con CustomSelect -->
        <div class="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <!-- Selector de Porciones con CustomSelect -->
          <div class="w-1/2 sm:w-44 lg:w-44 xl:w-48 shrink-0">
            <UiCustomSelect
              :options="portionOptions"
              :modelValue="portionFilter || 'all'"
              size="sm"
              icon="lucide:users"
              placeholder="Porciones"
              :buttonClass="[
                '!h-11 sm:!h-12 !rounded-2xl',
                portionFilter && portionFilter !== 'all' ? 'bg-brand-primary !border-brand-primary shadow-soft-sm' : 'bg-surface border-brand-primary/20 hover:border-brand-primary/40'
              ].join(' ')"
              :selectedLabelClass="portionFilter && portionFilter !== 'all' ? '!text-white' : 'text-brand-secondary'"
              :iconClass="portionFilter && portionFilter !== 'all' ? '!text-white' : 'text-brand-primary'"
              :chevronClass="portionFilter && portionFilter !== 'all' ? '!text-white' : 'text-brand-primary'"
              @update:model-value="$emit('update:portionFilter', String($event))"
            />
          </div>

          <!-- Selector de Presupuesto con CustomSelect -->
          <div class="w-1/2 sm:w-40 lg:w-40 xl:w-44 shrink-0">
            <UiCustomSelect
              :options="priceRangeOptions"
              :modelValue="priceRangeFilter || 'all'"
              size="sm"
              icon="lucide:tag"
              placeholder="Precio"
              :buttonClass="[
                '!h-11 sm:!h-12 !rounded-2xl',
                priceRangeFilter && priceRangeFilter !== 'all' ? 'bg-brand-primary !border-brand-primary shadow-soft-sm' : 'bg-surface border-brand-primary/20 hover:border-brand-primary/40'
              ].join(' ')"
              :selectedLabelClass="priceRangeFilter && priceRangeFilter !== 'all' ? '!text-white' : 'text-brand-secondary'"
              :iconClass="priceRangeFilter && priceRangeFilter !== 'all' ? '!text-white' : 'text-brand-primary'"
              :chevronClass="priceRangeFilter && priceRangeFilter !== 'all' ? '!text-white' : 'text-brand-primary'"
              @update:model-value="$emit('update:priceRangeFilter', String($event))"
            />
          </div>

          <!-- Botón Limpiar Todo si alguno está activo -->
          <button
            v-if="hasActiveSecondaryFilters"
            @click="$emit('resetAll')"
            type="button"
            class="shrink-0 inline-flex items-center justify-center h-11 sm:h-12 w-11 sm:w-12 rounded-2xl text-xs font-bold text-brand-secondary/70 hover:text-status-danger bg-brand-cream/80 hover:bg-brand-cream border border-brand-primary/15 transition-all cursor-pointer shadow-soft-xs active:scale-95"
            title="Limpiar filtros de porciones y precios"
            aria-label="Limpiar filtros secundarios"
          >
            <Icon name="lucide:rotate-ccw" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(42, 50, 27, 0.15);
  border-radius: 4px;
}
</style>
