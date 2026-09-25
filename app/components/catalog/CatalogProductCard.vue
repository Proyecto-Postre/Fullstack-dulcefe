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
    class="group bg-surface rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 ease-out flex flex-col border border-brand-primary/10 hover:-translate-y-1.5 h-full"
  >
    <!-- Contenedor de Imagen -->
    <div class="aspect-[4/3] sm:aspect-auto sm:h-56 md:h-64 w-full relative overflow-hidden bg-brand-cream/60 shrink-0">
      <!-- Badge Artesanal: Horneado Fresco / A Pedido o Agotado por hoy -->
      <div 
        v-if="product.stock > 0" 
        class="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-20 bg-surface/90 backdrop-blur-md text-brand-primary border border-brand-primary/20 text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-soft-sm"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
        <span>Horneado Fresco</span>
      </div>
      <div 
        v-else 
        class="absolute top-2 right-2 sm:top-3.5 sm:right-3.5 z-20 bg-brand-secondary/90 backdrop-blur-sm text-white text-[9px] sm:text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-soft-sm"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span>Agotado por hoy</span>
      </div>

      <!-- Imagen con zoom al hover -->
      <img 
        :src="imageUrl" 
        :alt="product.name" 
        loading="lazy"
        class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
      />
    </div>

    <!-- Contenido y Precio -->
    <div class="p-3 sm:p-5 md:p-6 flex-1 flex flex-col justify-between bg-surface">
      <div>
        <h3 class="text-xs sm:text-base md:text-xl font-playfair font-bold text-brand-secondary mb-1 sm:mb-2 tracking-tight leading-snug line-clamp-2">
          {{ product.name }}
        </h3>
        <p class="hidden sm:block text-xs text-brand-primary/75 line-clamp-2 leading-relaxed mb-4 md:mb-6 font-medium">
          {{ product.description || 'Elaborado artesanalmente con recetas tradicionales e insumos naturales seleccionados.' }}
        </p>
      </div>

      <div class="flex items-center justify-between pt-2.5 sm:pt-4 border-t border-brand-primary/10 mt-auto gap-1">
        <div class="flex items-baseline gap-0.5 sm:gap-1 min-w-0">
          <span class="text-[10px] sm:text-xs font-bold text-brand-primary uppercase tracking-wider">S/</span>
          <span class="text-sm sm:text-xl md:text-2xl font-inter font-black tracking-tight text-brand-secondary truncate">
            {{ Number(product.price).toFixed(2) }}
          </span>
        </div>
        
        <button
          @click="$emit('addToCart', product)"
          type="button"
          :disabled="Number(product.price) <= 0 || product.stock === 0"
          :class="[
            'h-8 sm:h-11 px-2.5 sm:px-5 rounded-full flex items-center justify-center gap-1 sm:gap-2 transition-all duration-300 shadow-soft-sm shrink-0 active:scale-95',
            Number(product.price) > 0 && product.stock > 0
              ? 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-soft-md cursor-pointer'
              : 'bg-brand-cream/80 text-brand-primary/40 border border-brand-primary/10 cursor-not-allowed'
          ]"
          :aria-label="Number(product.price) > 0 && product.stock > 0 ? `Agregar ${product.name} al pedido` : 'Producto no disponible'"
        >
          <span class="text-[11px] sm:text-xs font-bold font-inter">
            {{ product.stock > 0 ? 'Pedir' : 'Agotado' }}
          </span>
          <Icon v-if="product.stock > 0" name="lucide:shopping-bag" class="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <Icon v-else name="lucide:ban" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-primary/40" />
        </button>
      </div>
    </div>
  </article>
</template>
