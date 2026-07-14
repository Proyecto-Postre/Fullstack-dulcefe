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
  <div class="min-h-screen bg-[#FEF3C7] font-inter text-[#78350F] selection:bg-[#92400E] selection:text-white relative overflow-hidden">
    <!-- Ambient Liquid Glass Background Effects -->
    <div class="fixed top-[-10%] left-[-10%] w-96 h-96 bg-[#B45309]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob pointer-events-none"></div>
    <div class="fixed top-[20%] right-[-10%] w-96 h-96 bg-[#F59E0B]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000 pointer-events-none"></div>
    <div class="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-[#92400E]/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000 pointer-events-none"></div>

    <!-- Header Glassmorphism -->
    <header class="relative z-50 sticky top-0 backdrop-blur-xl bg-[#FEF3C7]/70 border-b border-[#92400E]/10 transition-all duration-300 shadow-sm">
      <div class="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-gradient-to-tr from-[#92400E] to-[#B45309] rounded-2xl flex items-center justify-center shadow-lg shadow-[#92400E]/30 transform rotate-3 hover:rotate-6 transition-transform duration-300">
            <span class="text-2xl drop-shadow-md cursor-default">🧁</span>
          </div>
          <div>
            <h1 class="text-3xl font-playfair font-black tracking-tight text-[#92400E]">Dulce Fe</h1>
            <p class="text-[10px] font-bold text-[#B45309]/70 uppercase tracking-[0.2em] mt-0.5">Patisserie & Café</p>
          </div>
        </div>
        
        <NuxtLink
          to="/login"
          class="group relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white bg-[#92400E] hover:bg-[#78350F] rounded-full overflow-hidden transition-all shadow-md shadow-[#92400E]/20 hover:shadow-lg hover:shadow-[#92400E]/40"
        >
          <span class="relative z-10 flex items-center gap-2">
             Administración
             <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
             </svg>
          </span>
        </NuxtLink>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24">
      
      <!-- Hero Section -->
      <div class="text-center max-w-3xl mx-auto mb-24">
        <h2 class="text-5xl md:text-7xl font-playfair font-black text-[#92400E] mb-6 leading-tight drop-shadow-sm">
          El Arte de Endulzar <br/> <span class="italic text-[#B45309]">Tu Día</span>
        </h2>
        <p class="text-lg md:text-xl text-[#78350F]/80 font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
          Descubre nuestra colección de repostería artesanal, creada con los ingredientes más finos y una pasión inquebrantable por el detalle.
        </p>
      </div>

      <!-- State: Loading -->
      <div v-if="pending" class="flex flex-col items-center justify-center py-20">
        <div class="relative w-24 h-24 mb-6">
           <div class="absolute inset-0 bg-[#B45309] rounded-full animate-ping opacity-20"></div>
           <div class="absolute inset-2 bg-gradient-to-tr from-[#92400E] to-[#B45309] rounded-full animate-pulse shadow-xl flex items-center justify-center">
             <span class="text-3xl animate-bounce">👨‍🍳</span>
           </div>
        </div>
        <p class="text-lg font-medium text-[#92400E] animate-pulse">Horneando nuestro catálogo...</p>
      </div>

      <!-- State: Error -->
      <div v-else-if="error" class="max-w-2xl mx-auto bg-red-50/80 backdrop-blur-xl border border-red-200 text-red-800 px-8 py-8 rounded-[2rem] shadow-xl flex items-center gap-6">
        <div class="text-5xl">🚨</div>
        <div>
          <h3 class="text-xl font-bold mb-1 font-playfair">Algo salió mal en el horno</h3>
          <p class="text-sm opacity-90 font-medium">{{ error.message }}</p>
        </div>
      </div>

      <!-- State: Empty -->
      <div v-else-if="!catalog?.data || catalog.data.length === 0" class="max-w-2xl mx-auto text-center py-24 bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/50">
        <span class="text-6xl block mb-6 opacity-80 cursor-default">🍽️</span>
        <h3 class="text-3xl font-playfair font-bold text-[#92400E] mb-4">La vitrina está vacía</h3>
        <p class="text-[#78350F]/70 font-medium max-w-md mx-auto text-lg">
          Nuestros pasteleros están preparando nuevas delicias. Vuelve pronto para descubrir nuestras creaciones.
        </p>
      </div>

      <!-- State: Grid (Liquid Glass Cards) -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        <article
          v-for="(product, idx) in catalog?.data"
          :key="product.id"
          class="group relative bg-white/50 backdrop-blur-xl rounded-[2rem] overflow-hidden shadow-lg shadow-[#92400E]/5 border border-white/60 hover:shadow-2xl hover:shadow-[#92400E]/15 transition-all duration-500 hover:-translate-y-2 flex flex-col cursor-pointer"
          :style="{ animationDelay: `${idx * 100}ms` }"
        >
          <!-- Image/Icon Container -->
          <div class="h-64 relative overflow-hidden bg-gradient-to-br from-[#FEF3C7] to-[#fde68a] p-6 flex items-center justify-center">
            <!-- Glassmorphism Badge -->
            <div 
              v-if="product.stock <= 5 && product.stock > 0" 
              class="absolute top-5 right-5 z-20 bg-red-500/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-red-400/50 flex items-center gap-1.5"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              ¡Últimos {{ product.stock }}!
            </div>
            <div 
              v-else-if="product.stock === 0" 
              class="absolute top-5 right-5 z-20 bg-[#78350F]/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-[#78350F]/50"
            >
              Agotado
            </div>

            <!-- Ambient glow behind icon -->
            <div class="absolute inset-0 bg-gradient-to-t from-[#92400E]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span class="text-7xl transform group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 ease-out drop-shadow-xl z-10 relative">🍰</span>
          </div>

          <!-- Content -->
          <div class="p-7 flex-1 flex flex-col justify-between relative bg-white/40 group-hover:bg-white/60 transition-colors duration-500">
            <div>
              <h3 class="text-2xl font-playfair font-black text-[#92400E] mb-2 leading-tight group-hover:text-[#B45309] transition-colors">
                {{ product.name }}
              </h3>
              <p class="text-sm text-[#78350F]/70 line-clamp-2 leading-relaxed mb-6 font-medium">
                Elaborado artesanalmente con los mejores ingredientes y mucho amor para tu paladar.
              </p>
            </div>

            <div class="pt-5 border-t border-[#92400E]/10 flex items-end justify-between mt-auto">
              <div>
                <p class="text-[10px] font-bold tracking-[0.15em] uppercase text-[#92400E]/60 mb-1">Precio Unitario</p>
                <div class="flex items-start">
                  <span class="text-sm font-bold text-[#92400E] mt-1 mr-1">S/</span>
                  <span class="text-3xl font-black tracking-tighter text-[#92400E]">{{ Number(product.price).toFixed(2) }}</span>
                </div>
              </div>
              
              <button
                :disabled="product.stock === 0"
                :class="[
                  'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md',
                  product.stock > 0
                    ? 'bg-[#92400E] hover:bg-[#B45309] text-white hover:shadow-xl hover:shadow-[#92400E]/30 hover:scale-105 active:scale-95'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
                ]"
                :title="product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'"
              >
                <svg v-if="product.stock > 0" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>
  </div>
</template>

<style>
/* Importamos las tipografías recomendadas por el Design System */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,700&display=swap');

.font-inter {
  font-family: 'Inter', sans-serif;
}
.font-playfair {
  font-family: 'Playfair Display', serif;
}

/* Animaciones para el efecto "Liquid Glass" en el fondo */
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

.animate-blob {
  animation: blob 10s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
</style>
