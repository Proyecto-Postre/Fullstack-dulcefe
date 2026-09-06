<script setup lang="ts">
import type { CatalogProduct } from '~/types/catalog'

defineProps<{
  product: CatalogProduct
  imageUrl: string
}>()

defineEmits<{
  (e: 'addToCart', product: CatalogProduct): void
}>()
</script>

<template>
  <article
    class="group bg-surface rounded-[2rem] overflow-hidden shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col border border-brand-primary/10 hover:-translate-y-1.5"
  >
    <!-- Contenedor de Imagen -->
    <div class="h-64 w-full relative overflow-hidden bg-brand-cream/60">
      <!-- Badges de Stock -->
      <div 
        v-if="product.stock <= 5 && product.stock > 0" 
        class="absolute top-4 right-4 z-20 bg-status-danger/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
        Últimos {{ product.stock }}
      </div>
      <div 
        v-else-if="product.stock === 0" 
        class="absolute top-4 right-4 z-20 bg-brand-secondary/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm"
      >
        Bajo Pedido
      </div>

      <!-- Imagen con zoom al hover -->
      <img 
        :src="imageUrl" 
        :alt="product.name" 
        class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
      />
    </div>

    <!-- Contenido y Precio -->
    <div class="p-6 flex-1 flex flex-col justify-between bg-surface">
      <div>
        <h3 class="text-xl font-playfair font-bold text-brand-secondary mb-2 tracking-tight leading-snug">
          {{ product.name }}
        </h3>
        <p class="text-xs text-brand-primary/75 line-clamp-2 leading-relaxed mb-6 font-medium">
          {{ product.description || 'Elaborado artesanalmente con recetas tradicionales e insumos naturales seleccionados.' }}
        </p>
      </div>

      <div class="flex items-center justify-between pt-4 border-t border-brand-primary/10 mt-auto">
        <div class="flex items-baseline gap-1">
          <span class="text-xs font-bold text-brand-primary uppercase tracking-widest">S/</span>
          <span class="text-2xl font-inter font-black tracking-tight text-brand-secondary">
            {{ Number(product.price).toFixed(2) }}
          </span>
        </div>
        
        <button
          @click="$emit('addToCart', product)"
          type="button"
          :disabled="Number(product.price) <= 0"
          :class="[
            'h-11 px-5 rounded-full flex items-center gap-2 transition-all duration-300 shadow-soft-sm cursor-pointer',
            Number(product.price) > 0
              ? 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-soft-md active:scale-95'
              : 'bg-brand-cream text-brand-primary/40 cursor-not-allowed'
          ]"
          :title="Number(product.price) > 0 ? 'Agregar al pedido' : 'Precio no disponible'"
        >
          <span class="text-xs font-bold font-inter">Pedir</span>
          <Icon name="lucide:shopping-bag" class="w-4 h-4" />
        </button>
      </div>
    </div>
  </article>
</template>
