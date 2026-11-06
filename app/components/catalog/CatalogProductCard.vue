<script setup lang="ts">
import type { CatalogProduct } from '~/types/catalog'

defineProps<{
  product: CatalogProduct
  imageUrl: string
}>()

defineEmits<{
  (e: 'addToCart', product: CatalogProduct): void
  (e: 'viewDetail', product: CatalogProduct): void
}>()
</script>

<template>
  <article
    class="group bg-surface rounded-2xl sm:rounded-3xl overflow-hidden shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 ease-out flex flex-col border border-brand-primary/10 hover:-translate-y-1.5 h-full"
  >
    <!-- Contenedor de Imagen (Proporción 4:3 horizontal para fotos naturales de cámara y celular) -->
    <div 
      @click="$emit('viewDetail', product)"
      class="aspect-[4/3] w-full relative overflow-hidden bg-brand-cream/60 shrink-0 cursor-pointer"
    >
      <!-- Badge de Estado: Solo visible cuando el producto está agotado -->
      <div 
        v-if="product.stock <= 0" 
        class="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 z-20 bg-brand-secondary/90 backdrop-blur-sm text-white text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-full uppercase tracking-normal flex items-center gap-1 shadow-soft-sm"
      >
        <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        <span>Agotado</span>
      </div>

      <!-- Imagen con zoom al hover -->
      <img 
        v-if="imageUrl && imageUrl.trim() !== ''"
        :src="imageUrl" 
        :alt="product.name" 
        loading="lazy"
        class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
      />

      <!-- Placeholder con Icono referente si no hay imagen -->
      <div 
        v-else 
        class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#FDFBF7] to-[#F5F1E1] p-3 sm:p-4 text-center select-none"
      >
        <div class="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-[#EFEAD4]/80 border border-brand-primary/15 flex items-center justify-center shadow-soft-sm group-hover:scale-110 transition-transform duration-500 ease-out">
          <Icon :name="getProductIcon(product.name, product.category_id)" class="w-6 h-6 sm:w-7 sm:h-7 text-brand-primary/80" />
        </div>
        <span class="text-[8px] sm:text-[10px] font-semibold text-brand-secondary/60 mt-2 font-serif italic tracking-wide">
          Receta Artesanal
        </span>
      </div>
    </div>

    <!-- Contenido y Precio -->
    <div class="p-2.5 sm:p-3.5 md:p-4 flex-1 flex flex-col justify-between bg-surface">
      <div 
        @click="$emit('viewDetail', product)"
        class="cursor-pointer"
      >
        <h3 class="text-xs sm:text-sm md:text-[15px] font-playfair font-bold text-brand-secondary mb-1 tracking-tight leading-snug line-clamp-2 group-hover:text-brand-primary transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
          {{ product.name }}
        </h3>
        <p v-if="product.portions" class="inline-flex items-center gap-1 text-[9px] sm:text-[11px] font-semibold text-brand-primary/75 mb-1.5">
          <Icon name="lucide:users" class="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
          <span>{{ product.portions }} {{ product.portions === 1 ? 'porción aprox.' : 'porciones aprox.' }}</span>
        </p>
      </div>

      <div class="flex items-center justify-between pt-2 sm:pt-3 border-t border-brand-primary/10 mt-auto gap-1">
        <div class="flex items-baseline gap-0.5 sm:gap-1 min-w-0">
          <span class="text-[9px] sm:text-xs font-bold text-brand-primary uppercase tracking-wider">S/</span>
          <span class="text-xs sm:text-base md:text-lg font-inter font-black tracking-tight text-brand-secondary truncate">
            {{ Number(product.price).toFixed(2) }}
          </span>
        </div>
        
        <button
          @click="$emit('addToCart', product)"
          type="button"
          :disabled="Number(product.price) <= 0 || product.stock === 0"
          :class="[
            'h-7 sm:h-8.5 md:h-9 px-2 sm:px-3 md:px-3.5 rounded-full flex items-center justify-center gap-1 sm:gap-1.5 transition-all duration-300 shadow-soft-sm shrink-0 active:scale-95',
            Number(product.price) > 0 && product.stock > 0
              ? 'bg-brand-primary text-white hover:bg-brand-secondary hover:shadow-soft-md cursor-pointer'
              : 'bg-brand-cream/80 text-brand-primary/40 border border-brand-primary/10 cursor-not-allowed'
          ]"
          :aria-label="Number(product.price) > 0 && product.stock > 0 ? `Agregar ${product.name} al pedido` : 'Producto no disponible'"
        >
          <span class="text-[10px] sm:text-xs font-bold font-inter">
            {{ product.stock > 0 ? 'Pedir' : 'Agotado' }}
          </span>
          <Icon v-if="product.stock > 0" name="lucide:shopping-bag" class="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          <Icon v-else name="lucide:ban" class="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-primary/40" />
        </button>
      </div>
    </div>
  </article>
</template>
