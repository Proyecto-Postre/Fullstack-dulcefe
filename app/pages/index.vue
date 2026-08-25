<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'
import { toast } from 'vue-sonner'

const cartStore = useCartStore()
const authStore = useAuthStore()

const featuredProducts = [
  {
    id: 'fav-1',
    name: 'Torta Artesanal de Chocolate & Frutos Rojos',
    price: 95.00,
    stock: 6,
    image_url: '/images/desserts/torta-chocolate-frutos.jpg',
    description: 'Bizcocho húmedo de cacao intenso con ganache bitter, frambuesas frescas, arándanos e higos seleccionados.'
  },
  {
    id: 'fav-2',
    name: 'Tartaletas Gourmet de Fresas & Pistacho',
    price: 45.00,
    stock: 8,
    image_url: '/images/desserts/tartaleta-fresas-pistacho.jpg',
    description: 'Masa sableé crujiente rellena de suave crema pastelera a la vainilla de Madagascar y lluvia de pistachos tostados.'
  },
  {
    id: 'fav-3',
    name: 'Cheesecake Estilo New York de Fresa',
    price: 85.00,
    stock: 3,
    image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
    description: 'Cremoso cheesecake horneado a baja temperatura con coulis artesanal de fresas de huerto y base de galleta de canela.'
  }
]

function handleAddToCart(product: any) {
  cartStore.addToCart(product)
  toast.success('¡Agregado a tu pedido!', {
    description: `${product.name} — S/ ${Number(product.price).toFixed(2)}`,
    icon: '🍰'
  })
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative overflow-hidden flex flex-col">
    
    <CartDrawer />
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.02] -rotate-12 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.02] rotate-45 pointer-events-none" />
    </div>

    <!-- Header (Sticky) -->
    <header class="z-50 sticky top-0 w-full bg-[#F4F1E1]/95 backdrop-blur-md border-b border-[#4A5D23]/10 transition-all duration-300 shadow-xs">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex justify-between items-center">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3.5 group cursor-pointer">
          <div class="w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#4A5D23] shadow-sm border border-[#4A5D23]/15 group-hover:scale-105 transition-transform">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-2xl font-playfair font-black tracking-tight text-[#2A321B] leading-none">Dulce Fe</h1>
            <p class="text-[8.5px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-1">Patisserie & Café</p>
          </div>
        </NuxtLink>
        
        <!-- Navigation Actions -->
        <div class="flex items-center gap-3">
          <NuxtLink 
            to="/menu"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-[#2A321B] hover:text-[#4A5D23] hover:bg-white/80 rounded-full transition-all"
          >
            <Icon name="lucide:cake-slice" class="w-4 h-4 text-[#4A5D23]" />
            <span>Carta & Menú</span>
          </NuxtLink>

          <!-- Auth / Admin / Profile Links -->
          <NuxtLink 
            v-if="!authStore.isLoggedIn"
            to="/login"
            class="hidden sm:inline-flex items-center justify-center px-5 py-2 text-xs font-bold text-white bg-[#4A5D23] hover:bg-[#3C4A1C] rounded-full transition-all shadow-sm active:translate-y-0.5"
          >
            Iniciar Sesión
          </NuxtLink>

          <template v-else>
            <!-- Admin -->
            <NuxtLink 
              v-if="authStore.isAdmin"
              to="/admin"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#2A321B] hover:bg-[#4A5D23] rounded-full transition-all shadow-sm"
            >
              <Icon name="lucide:layout-dashboard" class="w-3.5 h-3.5" />
              <span>Panel Admin</span>
            </NuxtLink>

            <!-- Cliente Normal -->
            <NuxtLink 
              v-else
              to="/perfil"
              class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#2A321B] bg-white hover:bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-full transition-all shadow-sm"
            >
              <Icon name="lucide:user" class="w-3.5 h-3.5 text-[#4A5D23]" />
              <span>Mi Cuenta</span>
            </NuxtLink>
          </template>

          <!-- Cart Button -->
          <button 
            @click="cartStore.openDrawer()"
            type="button"
            class="relative w-11 h-11 bg-white rounded-full flex items-center justify-center text-[#2A321B] hover:text-[#4A5D23] shadow-sm border border-[#4A5D23]/15 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="Abrir carrito de compras"
          >
            <Icon name="lucide:shopping-bag" class="w-5 h-5" />
            <span 
              v-if="cartStore.cartItemCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 bg-[#4A5D23] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm"
            >
              {{ cartStore.cartItemCount }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- Hero Section -->
    <section class="relative pt-12 pb-20 lg:pt-20 lg:pb-28 px-6 lg:px-12 z-10">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div class="space-y-8 animate-fade-in-up">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A5D23]/10 text-[#4A5D23] text-xs font-bold uppercase tracking-widest border border-[#4A5D23]/20">
            <Icon name="lucide:sparkles" class="w-4 h-4" />
            Repostería Fina Artesanal
          </div>
          
          <h2 class="text-5xl md:text-6xl lg:text-7xl font-playfair font-black text-[#2A321B] leading-[1.1] tracking-tight text-balance">
            El arte de crear <br/>
            <span class="italic text-[#4A5D23] font-medium">momentos dulces</span>
          </h2>
          
          <p class="text-lg text-[#4A5D23]/80 font-medium max-w-md leading-relaxed">
            Ingredientes botánicos y naturales seleccionados, escandallados al gramo y horneados con amor para endulzar tus momentos memorables.
          </p>
          
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <NuxtLink 
              to="/menu"
              class="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-[#4A5D23] hover:bg-[#3C4A1C] rounded-full overflow-hidden transition-all duration-300 shadow-md hover:shadow-lg active:translate-y-0.5"
            >
              <span class="relative z-10 flex items-center gap-2">
                Explorar el Menú
                <Icon name="lucide:arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </NuxtLink>
            
            <NuxtLink 
              to="/login"
              class="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-[#2A321B] bg-white hover:bg-[#F4F1E1] rounded-full transition-all duration-300 shadow-sm hover:shadow-md border border-[#4A5D23]/20"
            >
              Únete al Club
            </NuxtLink>
          </div>
        </div>

        <div class="relative animate-fade-in">
          <!-- Main Photo Container (With contained badge inside) -->
          <div class="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] lg:aspect-square shadow-2xl border-4 border-white">
            <img 
              src="/images/desserts/torta-chocolate-frutos.jpg" 
              alt="Torta Artesanal de Chocolate Dulce Fe" 
              class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" 
            />
            <div class="absolute inset-0 bg-gradient-to-t from-[#2A321B]/60 via-transparent to-transparent pointer-events-none"></div>

            <!-- Floating Badge Contained Inside Bottom-Left -->
            <div class="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-xl flex items-center gap-3.5 border border-white/50 z-20">
              <div class="w-10 h-10 sm:w-11 sm:h-11 bg-[#F4F1E1] rounded-full flex items-center justify-center text-[#4A5D23] border border-[#4A5D23]/20 shrink-0">
                <Icon name="lucide:award" class="w-5 h-5 sm:w-6 sm:h-6 text-[#4A5D23]" />
              </div>
              <div>
                <p class="text-[9px] sm:text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest leading-none mb-1">100% Artesanal</p>
                <p class="text-base sm:text-lg font-black font-playfair text-[#2A321B] leading-none">Calidad Premium</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="relative py-24 bg-white z-10 border-t border-[#4A5D23]/10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#F4F1E1] text-[#4A5D23] mb-4">
            <Icon name="lucide:sparkles" class="w-6 h-6" />
          </div>
          <h3 class="text-4xl font-playfair font-black text-[#2A321B] mb-3">Las Creaciones Favoritas</h3>
          <p class="text-sm text-[#4A5D23] font-medium max-w-md mx-auto">Nuestras joyas de autor más solicitadas. Horneadas al día bajo pedido especial.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article
            v-for="product in featuredProducts"
            :key="product.id"
            class="group bg-[#F4F1E1]/40 border border-[#4A5D23]/10 rounded-[2rem] overflow-hidden transition-all duration-500 hover:bg-[#F4F1E1] hover:shadow-xl hover:-translate-y-1.5 flex flex-col"
          >
            <!-- Image Container -->
            <div class="h-72 w-full relative overflow-hidden bg-white">
              <div 
                v-if="product.stock <= 5 && product.stock > 0" 
                class="absolute top-4 right-4 z-20 bg-[#991B1B]/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Últimas {{ product.stock }} unidades
              </div>
              <img 
                :src="product.image_url" 
                :alt="product.name" 
                class="w-full h-full object-cover transform group-hover:scale-108 transition-transform duration-700 ease-out" 
              />
            </div>

            <!-- Content -->
            <div class="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h4 class="text-xl font-playfair font-bold text-[#2A321B] mb-2 leading-snug">{{ product.name }}</h4>
                <p class="text-xs text-[#4A5D23]/80 leading-relaxed mb-6 font-medium">{{ product.description }}</p>
              </div>

              <div class="flex items-center justify-between pt-4 border-t border-[#4A5D23]/10">
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-bold text-[#4A5D23] uppercase tracking-widest">S/</span>
                  <span class="text-2xl font-inter font-black text-[#2A321B]">{{ product.price.toFixed(2) }}</span>
                </div>
                
                <button
                  @click="handleAddToCart(product)"
                  type="button"
                  class="h-11 px-5 rounded-full bg-white border border-[#4A5D23]/25 flex items-center gap-2 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 cursor-pointer"
                  title="Añadir a mi pedido"
                >
                  <span class="text-xs font-bold font-inter">Pedir</span>
                  <Icon name="lucide:shopping-bag" class="w-4 h-4" />
                </button>
              </div>
            </div>
          </article>
        </div>
        
        <div class="text-center mt-16">
          <NuxtLink 
            to="/menu"
            class="inline-flex items-center gap-2 text-sm font-bold text-[#4A5D23] hover:text-[#2A321B] transition-colors uppercase tracking-widest border-b-2 border-[#4A5D23] hover:border-[#2A321B] pb-1"
          >
            Ver Catálogo Completo
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer Simple -->
    <footer class="bg-[#2A321B] text-[#F4F1E1] py-12 relative z-10 border-t border-white/10 mt-auto">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 text-center">
        <div class="w-10 h-10 rounded-full bg-white/10 mx-auto mb-4 flex items-center justify-center text-[#F4F1E1]">
          <Icon name="lucide:wheat" class="w-5 h-5" />
        </div>
        <h2 class="text-2xl font-playfair font-black mb-1">Dulce Fe</h2>
        <p class="text-xs text-[#F4F1E1]/60 uppercase tracking-widest mb-6">Patisserie & Café</p>
        <p class="text-xs text-[#F4F1E1]/40">© 2026 Dulce Fe. Todos los derechos reservados.</p>
      </div>
    </footer>

  </div>
</template>
