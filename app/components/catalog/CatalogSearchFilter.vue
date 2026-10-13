<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type { CatalogCategory } from '~/types/catalog'

const props = defineProps<{
  searchQuery: string
  selectedCategory: string
  categories: CatalogCategory[]
}>()

const emit = defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedCategory', val: string): void
}>()

const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// Máximo de etiquetas en la línea principal para evitar saturación y desbordamientos
const MAX_VISIBLE = 4

const visibleCategories = computed<CatalogCategory[]>(() => {
  const list = props.categories || []
  if (list.length <= MAX_VISIBLE) return list

  // Si la categoría seleccionada no está entre las primeras, promoverla a las visibles
  const topList = list.slice(0, MAX_VISIBLE - 1)
  const isSelectedInTop = topList.some(c => c.id === props.selectedCategory)

  if (!isSelectedInTop && props.selectedCategory !== 'todos') {
    const selectedItem = list.find(c => c.id === props.selectedCategory)
    if (selectedItem) {
      return [...topList, selectedItem]
    }
  }

  return list.slice(0, MAX_VISIBLE)
})

const overflowCategories = computed<CatalogCategory[]>(() => {
  const list = props.categories || []
  if (list.length <= MAX_VISIBLE) return []

  const visibleIds = new Set(visibleCategories.value.map(c => c.id))
  return list.filter(c => !visibleIds.has(c.id))
})

const isOverflowSelected = computed<boolean>(() => {
  return overflowCategories.value.some(c => c.id === props.selectedCategory)
})

function selectCategory(id: string) {
  emit('update:selectedCategory', id)
  isDropdownOpen.value = false
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
  <div class="mb-6 sm:mb-10 space-y-3 sm:space-y-4 max-w-4xl mx-auto">
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
        class="w-full pl-12 pr-10 py-3.5 bg-surface rounded-2xl border border-brand-primary/25 text-sm font-semibold text-brand-secondary placeholder:text-brand-primary/40 focus:outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all shadow-soft-sm"
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

    <!-- Píldoras de Categoría con Límite y Menú Desplegable -->
    <div v-if="categories && categories.length > 0" class="relative w-full">
      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
        <!-- Categorías Principales Visibles -->
        <button
          v-for="cat in visibleCategories"
          :key="cat.id"
          @click="selectCategory(cat.id)"
          type="button"
          :class="[
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 shrink-0 border cursor-pointer select-none active:scale-95',
            selectedCategory === cat.id
              ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm scale-102'
              : 'bg-surface text-brand-secondary border-brand-primary/15 hover:bg-brand-cream hover:border-brand-primary/30 shadow-soft-sm'
          ]"
        >
          <Icon :name="cat.icon" class="w-3.5 h-3.5" />
          <span>{{ cat.name }}</span>
        </button>

        <!-- Botón Desplegable para Categorías Adicionales -->
        <div v-if="overflowCategories.length > 0" ref="dropdownRef" class="relative inline-block">
          <button
            @click.stop="toggleDropdown"
            type="button"
            :class="[
              'inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold transition-all duration-300 shrink-0 border cursor-pointer select-none active:scale-95',
              isOverflowSelected
                ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm'
                : 'bg-surface text-brand-secondary border-brand-primary/15 hover:bg-brand-cream hover:border-brand-primary/30 shadow-soft-sm'
            ]"
            :aria-expanded="isDropdownOpen"
            aria-label="Ver más categorías"
          >
            <Icon name="lucide:layout-grid" class="w-3.5 h-3.5 text-brand-accent" />
            <span>+ Más secciones ({{ overflowCategories.length }})</span>
            <Icon 
              name="lucide:chevron-down" 
              :class="['w-3.5 h-3.5 transition-transform duration-200', isDropdownOpen ? 'rotate-180' : '']" 
            />
          </button>

          <!-- Menú Flotante Desplegable con Estética de Pastelería Fina -->
          <Transition name="dropdown-fade">
            <div
              v-if="isDropdownOpen"
              class="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 top-full mt-2 w-64 bg-surface rounded-2xl border border-brand-primary/20 shadow-soft-lg p-2 z-50 backdrop-blur-md"
            >
              <div class="px-3 py-1.5 border-b border-brand-primary/10 mb-1 flex items-center justify-between">
                <span class="text-[10px] font-bold text-brand-primary uppercase tracking-widest">
                  Otras Secciones
                </span>
                <span class="text-[10px] text-brand-secondary/60 font-semibold">
                  {{ overflowCategories.length }} opciones
                </span>
              </div>

              <div class="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                <button
                  v-for="cat in overflowCategories"
                  :key="cat.id"
                  @click="selectCategory(cat.id)"
                  type="button"
                  :class="[
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left cursor-pointer',
                    selectedCategory === cat.id
                      ? 'bg-brand-primary text-white shadow-soft-sm'
                      : 'text-brand-secondary hover:bg-brand-cream'
                  ]"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <Icon :name="cat.icon" class="w-4 h-4 shrink-0" />
                    <span class="truncate">{{ cat.name }}</span>
                  </div>
                  <Icon 
                    v-if="selectedCategory === cat.id" 
                    name="lucide:check" 
                    class="w-4 h-4 shrink-0" 
                  />
                </button>
              </div>
            </div>
          </Transition>
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
</style>
