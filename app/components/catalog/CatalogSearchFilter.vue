<script setup lang="ts">
import type { CatalogCategory } from '~/types/catalog'

defineProps<{
  searchQuery: string
  selectedCategory: string
  categories: CatalogCategory[]
}>()

defineEmits<{
  (e: 'update:searchQuery', val: string): void
  (e: 'update:selectedCategory', val: string): void
}>()
</script>

<template>
  <div class="mb-10 space-y-4 max-w-3xl mx-auto">
    <!-- Barra de Búsqueda -->
    <div class="relative w-full">
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
        title="Limpiar búsqueda"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </button>
    </div>

    <!-- Píldoras de Categoría -->
    <div class="flex items-center justify-center gap-2 overflow-x-auto py-1 hide-scrollbar">
      <button
        v-for="cat in categories"
        :key="cat.id"
        @click="$emit('update:selectedCategory', cat.id)"
        type="button"
        :class="[
          'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 border cursor-pointer',
          selectedCategory === cat.id
            ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm scale-102'
            : 'bg-surface text-brand-secondary border-brand-primary/15 hover:bg-brand-cream shadow-soft-sm'
        ]"
      >
        <Icon :name="cat.icon" class="w-3.5 h-3.5" />
        {{ cat.name }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
