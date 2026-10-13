<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { CatalogCategory } from '~/types/catalog'

const props = defineProps<{
  searchQuery: string
  selectedCategory?: string
  selectedCategories?: string[]
  categories: CatalogCategory[]
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedCategory', val: string): void
  (e: 'update:selectedCategories', val: string[]): void
  (e: 'toggleCategory', catId: string): void
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
</script>

<template>
  <div class="mb-5 sm:mb-8 space-y-3 sm:space-y-3.5 max-w-4xl mx-auto">
    <!-- Barra de Búsqueda -->
    <div class="relative w-full max-w-2xl mx-auto">
      <Icon 
        name="lucide:search" 
        class="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/60 pointer-events-none" 
      />
      <input 
        :value="searchQuery" 
        @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
        type="text" 
        placeholder="Buscar por nombre o sabor (ej. chocolate, fresa, torta, brownie, alfajores)..." 
        class="w-full pl-12 pr-10 py-3 bg-surface rounded-2xl border border-brand-primary/25 text-sm font-semibold text-brand-secondary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-soft-sm"
      />
      <button 
        v-if="searchQuery" 
        @click="$emit('update:searchQuery', '')"
        type="button"
        class="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50 hover:text-status-danger p-1 cursor-pointer"
        aria-label="Limpiar búsqueda"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </button>
    </div>

    <!-- Único Control Desplegable Compacto de Filtros (Optimizado para Mobile y Desktop) -->
    <div 
      v-if="realCategories.length > 0" 
      ref="dropdownRef" 
      class="relative w-full max-w-2xl mx-auto flex items-center justify-center gap-2"
    >
      <!-- Botón Disparador del Desplegable -->
      <button
        @click.stop="toggleDropdown"
        type="button"
        :class="[
          'inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 border cursor-pointer select-none active:scale-98 shadow-soft-sm',
          !isAllSelected
            ? 'bg-brand-primary text-white border-brand-primary shadow-soft-md'
            : 'bg-surface text-brand-secondary border-brand-primary/20 hover:bg-brand-cream hover:border-brand-primary/35'
        ]"
        :aria-expanded="isDropdownOpen"
        aria-label="Filtrar por sección de la carta"
      >
        <Icon :name="activeFilterIcon" class="w-4 h-4 text-brand-accent shrink-0" />
        <span class="truncate max-w-[210px] sm:max-w-xs">{{ activeFilterLabel }}</span>
        <Icon 
          name="lucide:chevron-down" 
          :class="['w-4 h-4 transition-transform duration-200 shrink-0 opacity-80', isDropdownOpen ? 'rotate-180' : '']" 
        />
      </button>

      <!-- Botón Rápido para Reestablecer a 'Toda la carta' si hay filtro activo -->
      <button
        v-if="!isAllSelected"
        @click="selectAll"
        type="button"
        class="inline-flex items-center gap-1 px-3 py-2 sm:py-2.5 rounded-full text-xs font-bold text-brand-secondary/80 bg-brand-cream/80 hover:bg-brand-cream border border-brand-primary/15 transition-all cursor-pointer active:scale-95 shadow-soft-sm"
        title="Mostrar todas las secciones"
      >
        <Icon name="lucide:x" class="w-3.5 h-3.5 text-brand-primary" />
        <span class="hidden sm:inline">Ver todo</span>
      </button>

      <!-- Menú Desplegable Flotante Elegante con Selección Múltiple -->
      <Transition name="dropdown-fade">
        <div
          v-if="isDropdownOpen"
          class="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[calc(100vw-2rem)] max-w-sm bg-surface rounded-2xl border border-brand-primary/20 shadow-soft-xl p-3 z-50 backdrop-blur-md"
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
                <span class="truncate">✨ Toda la Carta (Todos los postres)</span>
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
  transform: translate(-50%, -6px) scale(0.97);
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
