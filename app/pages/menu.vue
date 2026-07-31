<script setup lang="ts">
import { useAsyncData } from 'nuxt/app';
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()

interface Product {
  id: string | number;
  name: string;
  price: number | string;
  stock: number;
  image_url?: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Product[];
}

// Optimización: useAsyncData con caché para evitar llamadas innecesarias al navegar
const { data: catalog, pending, error } = await useAsyncData<ApiResponse>(
  'products-catalog',
  () => $fetch('/api/products'),
  {
    transform: (res: any) => res as ApiResponse,
    // La data se mantiene en caché, ideal para catálogos que no cambian cada segundo
    default: () => ({ success: true, count: 0, data: [] })
  }
);

</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative overflow-hidden">
    
    <CartDrawer />
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.02] -rotate-12" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.02] rotate-45" />
    </div>

    <!-- Header -->
    <header class="z-50 sticky top-0 bg-[#F4F1E1]/90 backdrop-blur-md border-b border-[#4A5D23]/10 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex justify-between items-center">
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#4A5D23] shadow-sm group-hover:shadow-md transition-all">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe</h1>
            <p class="text-[8px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Menú</p>
          </div>
        </NuxtLink>
        
        <div class="flex items-center gap-3">
          <!-- Botón de Iniciar Sesión (Si no está logueado) -->
          <NuxtLink 
            v-if="!authStore.isLoggedIn"
            to="/login"
            class="hidden md:flex items-center justify-center px-5 py-2 text-sm font-bold text-white bg-[#4A5D23] hover:bg-[#3C4A1C] rounded-full transition-colors shadow-sm"
          >
            Iniciar Sesión
          </NuxtLink>

          <template v-else>
            <!-- Botón Admin (Solo Admins) -->
            <NuxtLink 
              v-if="authStore.profile?.is_admin"
              to="/admin"
              class="flex items-center gap-2 bg-[#2A321B] px-3 md:px-4 py-2 rounded-full text-white hover:bg-black transition-colors shadow-sm h-10"
            >
              <span class="hidden md:block text-xs font-bold truncate max-w-[150px]">
                {{ authStore.profile?.full_name?.split(' ')[0] || 'Admin' }} (Admin)
              </span>
              <Icon name="lucide:layout-dashboard" class="w-5 h-5 md:w-4 md:h-4" />
            </NuxtLink>

            <!-- Perfil (Solo Clientes) -->
            <NuxtLink 
              v-else
              to="/perfil"
              class="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-full text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-colors shadow-sm h-10"
            >
              <span class="hidden md:block text-xs font-bold truncate max-w-[150px]">
                {{ authStore.profile?.full_name?.split(' ')[0] || 'Mi Perfil' }}
              </span>
              <Icon name="lucide:user" class="w-5 h-5 md:w-4 md:h-4" />
            </NuxtLink>
          </template>

          <button 
            @click="cartStore.toggleDrawer()"
            class="relative w-10 h-10 flex items-center justify-center rounded-full bg-white text-[#2A321B] hover:bg-[#4A5D23] hover:text-white transition-colors shadow-sm"
          >
            <Icon name="lucide:shopping-bag" class="w-5 h-5" />
            <span 
              v-if="cartStore.cartItemCount > 0"
              class="absolute -top-1 -right-1 bg-[#991B1B] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white"
            >
              {{ cartStore.cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-12">
      
      <!-- Page Header -->
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-playfair font-black text-[#2A321B] mb-4 tracking-tight">
          Nuestro Catálogo
        </h2>
        <div class="flex items-center justify-center gap-4 mb-4">
          <div class="w-12 h-px bg-[#4A5D23]/30"></div>
          <Icon name="lucide:leaf" class="w-4 h-4 text-[#4A5D23]" />
          <div class="w-12 h-px bg-[#4A5D23]/30"></div>
        </div>
        <p class="text-sm text-[#4A5D23]/80 font-medium max-w-lg mx-auto leading-relaxed">
          Descubre nuestra selección de postres artesanales, elaborados diariamente con los mejores ingredientes.
        </p>
      </div>

      <!-- State: Loading -->
      <div v-if="pending" class="flex flex-col items-center justify-center py-24">
        <div class="relative w-12 h-12 mb-6 text-[#4A5D23]">
           <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
        </div>
        <p class="text-xs font-bold tracking-widest uppercase text-[#4A5D23] animate-pulse">Horneando catálogo...</p>
      </div>

      <!-- State: Error -->
      <div v-else-if="error" class="max-w-2xl mx-auto bg-white border border-red-200 text-red-800 px-8 py-8 rounded-2xl flex items-start gap-5 shadow-sm">
        <Icon name="lucide:triangle-alert" class="w-6 h-6 text-red-600 shrink-0 mt-1" />
        <div>
          <h3 class="text-lg font-playfair font-bold mb-1 tracking-tight">Ocurrió un error al cargar</h3>
          <p class="text-sm font-medium leading-relaxed font-inter">{{ error.message }}</p>
        </div>
      </div>

      <!-- State: Empty -->
      <div v-else-if="!catalog?.data || catalog.data.length === 0" class="max-w-xl mx-auto text-center py-24 bg-white rounded-[2rem] shadow-sm border border-[#4A5D23]/10">
        <Icon name="lucide:utensils-crossed" class="w-12 h-12 text-[#4A5D23]/30 mx-auto mb-6" />
        <h3 class="text-2xl font-playfair font-bold text-[#2A321B] mb-3 tracking-tight">La vitrina está vacía</h3>
        <p class="text-[#4A5D23]/80 font-medium text-sm max-w-sm mx-auto text-balance leading-relaxed">
          Nuestros pasteleros están preparando nuevas delicias. Vuelve pronto para descubrir nuestras creaciones.
        </p>
      </div>

      <!-- State: Grid -->
      <div v-else>
        <TransitionGroup 
          name="list" 
          tag="div" 
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          <article
            v-for="(product, index) in catalog?.data"
            :key="product.id"
            class="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col animate-fade-in-up"
            :style="{ animationDelay: `${index * 50}ms` }"
          >
            <!-- Image Container -->
            <div class="h-64 w-full relative overflow-hidden bg-[#F4F1E1]/50">
              
              <!-- Badges -->
              <div 
                v-if="product.stock <= 5 && product.stock > 0" 
                class="absolute top-4 right-4 z-20 bg-[#991B1B]/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Últimos {{ product.stock }}
              </div>
              <div 
                v-else-if="product.stock === 0" 
                class="absolute top-4 right-4 z-20 bg-[#2A321B]/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider"
              >
                Agotado
              </div>

              <!-- Image -->
              <div v-if="product.image_url" class="absolute inset-0 w-full h-full">
                <img :src="product.image_url" :alt="product.name" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
              </div>
              <div v-else class="absolute inset-0 flex items-center justify-center">
                <Icon name="lucide:croissant" class="w-12 h-12 text-[#4A5D23]/30 transform group-hover:scale-110 transition-transform duration-500" />
              </div>
            </div>

            <!-- Content -->
            <div class="p-6 flex-1 flex flex-col bg-white">
              <h3 class="text-xl font-playfair font-bold text-[#2A321B] mb-2 tracking-tight">
                {{ product.name }}
              </h3>
              <p class="text-sm text-[#4A5D23]/70 line-clamp-2 leading-relaxed mb-6 font-medium">
                Elaborado con dedicación, utilizando ingredientes seleccionados para el mejor sabor.
              </p>

              <div class="flex items-center justify-between mt-auto pt-4 border-t border-[#4A5D23]/10">
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-bold text-[#4A5D23] uppercase tracking-widest">S/</span>
                  <span class="text-2xl font-inter font-black tracking-tight text-[#2A321B]">{{ Number(product.price).toFixed(2) }}</span>
                </div>
                
                <button
                  @click="cartStore.addToCart(product)"
                  :disabled="product.stock === 0"
                  :class="[
                    'w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm group/btn',
                    product.stock > 0
                      ? 'bg-[#4A5D23] text-white hover:bg-[#3C4A1C] hover:shadow-md hover:-translate-y-0.5'
                      : 'bg-[#F4F1E1] text-[#4A5D23]/40 cursor-not-allowed'
                  ]"
                  :title="product.stock > 0 ? 'Agregar al carrito' : 'Sin stock'"
                >
                  <Icon v-if="product.stock > 0" name="lucide:shopping-bag" class="w-5 h-5 transform group-hover/btn:scale-110 transition-transform" />
                  <Icon v-else name="lucide:ban" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </article>
        </TransitionGroup>
      </div>
    </main>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,500&display=swap');

.font-inter { font-family: 'Inter', sans-serif; }
.font-playfair { font-family: 'Playfair Display', serif; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}
</style>
