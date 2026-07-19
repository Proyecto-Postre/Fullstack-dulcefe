<script setup lang="ts">
import { useFetch } from 'nuxt/app';

// Definimos las interfaces para evitar errores de TypeScript con 'any'
interface Product {
  id: string | number;
  name: string;
  price: number | string;
  stock: number;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Product[];
}

// Ahora TypeScript sabe exactamente qué estructura tiene 'catalog'
const { data: catalog, pending, error } = await useFetch("/api/products", {
  transform: (res: any) => res as ApiResponse
});
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative overflow-hidden">
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <!-- Decoraciones sutiles de hojas -->
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.03] -rotate-12" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.03] rotate-45" />
      <Icon name="lucide:leaf" class="absolute top-[30%] left-[10%] w-64 h-64 text-[#4A5D23]/[0.02] rotate-[120deg]" />
      
      <!-- Líneas botánicas elegantes (puntos o divisores) -->
      <div class="absolute top-0 right-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
      <div class="absolute top-0 left-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
    </div>

    <!-- Header -->
    <header class="relative z-50 sticky top-0 bg-[#F4F1E1]/95 backdrop-blur-sm border-b border-[#4A5D23]/20 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 border border-[#4A5D23] bg-white rounded-full flex items-center justify-center text-[#4A5D23] shadow-[2px_2px_0px_#4A5D23]">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-2xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe</h1>
            <p class="text-[9px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Patisserie & Café</p>
          </div>
        </div>
        
        <NuxtLink
          to="/login"
          class="group relative inline-flex items-center justify-center px-6 py-2.5 text-[13px] font-semibold text-[#F4F1E1] bg-[#4A5D23] hover:bg-[#3C4A1C] border border-[#2A321B] rounded-full overflow-hidden transition-colors duration-300 shadow-[3px_3px_0px_#2A321B] active:translate-y-1 active:shadow-none"
        >
          <span class="relative z-10 flex items-center gap-2">
             Administración
             <Icon name="lucide:arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </span>
        </NuxtLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
      
      <!-- Hero Section -->
      <div class="text-center max-w-3xl mx-auto mb-20 relative">
        <Icon name="lucide:flower-2" class="w-8 h-8 text-[#4A5D23]/30 mx-auto mb-6" />
        <h2 class="text-5xl md:text-6xl lg:text-7xl font-playfair font-black text-[#2A321B] mb-6 leading-[1.1] tracking-tight text-balance">
          Menú de <br/> <span class="italic text-[#4A5D23] font-medium">Postres</span>
        </h2>
        <div class="flex items-center justify-center gap-4 mb-6">
          <div class="w-16 h-px bg-[#4A5D23]/30"></div>
          <Icon name="lucide:heart" class="w-4 h-4 text-[#4A5D23] fill-[#4A5D23]" />
          <div class="w-16 h-px bg-[#4A5D23]/30"></div>
        </div>
        <p class="text-[11px] text-[#4A5D23] font-bold uppercase tracking-widest leading-relaxed max-w-xl mx-auto">
          Ingredientes de calidad, sabores que enamoran
        </p>
      </div>

      <!-- State: Loading -->
      <div v-if="pending" class="flex flex-col items-center justify-center py-24">
        <div class="relative w-12 h-12 mb-6 text-[#4A5D23]">
           <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
        </div>
        <p class="text-sm font-semibold tracking-widest uppercase text-[#4A5D23] animate-pulse">Horneando catálogo...</p>
      </div>

      <!-- State: Error -->
      <div v-else-if="error" class="max-w-2xl mx-auto bg-white border-2 border-red-800 text-red-900 px-8 py-8 rounded-2xl flex items-start gap-5 shadow-[6px_6px_0px_#991B1B]">
        <Icon name="lucide:triangle-alert" class="w-7 h-7 text-red-800 shrink-0 mt-1" />
        <div>
          <h3 class="text-lg font-playfair font-bold mb-1 tracking-tight">Ocurrió un error al cargar</h3>
          <p class="text-sm font-medium leading-relaxed font-inter">{{ error.message }}</p>
        </div>
      </div>

      <!-- State: Empty -->
      <div v-else-if="!catalog?.data || catalog.data.length === 0" class="max-w-xl mx-auto text-center py-24 bg-white rounded-[2rem] border-2 border-[#4A5D23] shadow-[8px_8px_0px_#4A5D23]">
        <Icon name="lucide:utensils-crossed" class="w-12 h-12 text-[#4A5D23]/40 mx-auto mb-6" />
        <h3 class="text-2xl font-playfair font-bold text-[#2A321B] mb-3 tracking-tight">La vitrina está vacía</h3>
        <p class="text-[#4A5D23]/80 font-medium text-sm max-w-sm mx-auto text-balance leading-relaxed">
          Nuestros pasteleros están preparando nuevas delicias. Vuelve pronto para descubrir nuestras creaciones.
        </p>
      </div>

      <!-- State: Grid -->
      <div v-else>
        <!-- Category Title Example (Static for now to match the aesthetic) -->
        <div class="text-center mb-12">
          <h3 class="text-xl font-playfair font-bold text-[#2A321B] uppercase tracking-widest flex items-center justify-center gap-4">
            <span class="w-12 h-px bg-[#4A5D23]/40"></span>
            Delicias de la Casa
            <span class="w-12 h-px bg-[#4A5D23]/40"></span>
          </h3>
          <Icon name="lucide:leaf" class="w-4 h-4 text-[#4A5D23] mx-auto mt-3" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          <article
            v-for="product in catalog?.data"
            :key="product.id"
            class="group relative flex flex-col bg-white border-2 border-[#4A5D23]/20 shadow-[4px_4px_0px_#4A5D23]/20 hover:border-[#4A5D23] hover:shadow-[6px_6px_0px_#4A5D23] transition-all duration-300 rounded-[2rem] p-4 cursor-pointer"
          >
            <!-- Image/Icon Container -->
            <div class="h-56 w-full relative overflow-hidden bg-[#F4F1E1] rounded-[1.5rem] p-6 flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-[#EAE6D3]">
              
              <!-- Badges -->
              <div 
                v-if="product.stock <= 5 && product.stock > 0" 
                class="absolute top-4 right-4 z-20 bg-[#991B1B] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 border border-[#4A0000]"
              >
                <span class="w-1 h-1 rounded-full bg-white animate-pulse"></span>
                Últimos {{ product.stock }}
              </div>
              <div 
                v-else-if="product.stock === 0" 
                class="absolute top-4 right-4 z-20 bg-[#2A321B] text-white text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
              >
                Agotado
              </div>

              <!-- Product Placeholder Icon -->
              <div class="w-24 h-24 rounded-full border border-[#4A5D23]/30 flex items-center justify-center group-hover:border-[#4A5D23] transition-colors duration-500">
                <Icon name="lucide:croissant" class="w-10 h-10 text-[#4A5D23] transform group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 ease-out z-10" />
              </div>
            </div>

            <!-- Content -->
            <div class="px-2 pb-2 flex-1 flex flex-col">
              <h3 class="text-lg font-playfair font-bold text-[#2A321B] mb-2 tracking-tight">
                {{ product.name }}
              </h3>
              <p class="text-[12px] text-[#4A5D23]/80 line-clamp-2 leading-relaxed mb-6 font-medium text-pretty font-inter">
                Elaborado con dedicación, utilizando ingredientes seleccionados para el mejor sabor.
              </p>

              <div class="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-[#4A5D23]/30">
                <div class="flex items-baseline gap-1">
                  <span class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest">S/</span>
                  <span class="text-xl font-inter font-bold tracking-tight text-[#2A321B]">{{ Number(product.price).toFixed(2) }}</span>
                </div>
                
                <button
                  :disabled="product.stock === 0"
                  :class="[
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border border-[#2A321B]',
                    product.stock > 0
                      ? 'bg-[#4A5D23] text-white hover:bg-[#3C4A1C] hover:shadow-[3px_3px_0px_#2A321B] active:translate-y-0.5 active:shadow-none'
                      : 'bg-[#F4F1E1] text-[#4A5D23]/40 border-[#4A5D23]/20 cursor-not-allowed'
                  ]"
                  :title="product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'"
                >
                  <Icon v-if="product.stock > 0" name="lucide:shopping-bag" class="w-4 h-4" />
                  <Icon v-else name="lucide:ban" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
        
        <div class="mt-16 text-center text-[10px] font-bold text-[#4A5D23] uppercase tracking-[0.3em] flex items-center justify-center gap-3 opacity-60">
          <Icon name="lucide:flower" class="w-3 h-3" />
          Hechos con amor
          <Icon name="lucide:flower" class="w-3 h-3" />
        </div>
      </div>
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&display=swap');

.font-inter {
  font-family: 'Inter', sans-serif;
}
.font-playfair {
  font-family: 'Playfair Display', serif;
}
</style>
