<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()

// Imágenes generadas
const heroImage = '/_nuxt/assets/hero_pastry.png' // Asumiremos que las pondremos en public o usaremos URLs directas si las tuviéramos.
// Para el demo, usaremos imágenes de Unsplash o placeholders elegantes si no tenemos la URL pública de las generadas.
// En un entorno real, las imágenes generadas se subirían a Supabase Storage.
// Por ahora, usaremos URLs de Unsplash de alta calidad para el demo visual.

const featuredProducts = [
  {
    id: 'demo-1',
    name: 'Box Brownies x6',
    price: 35.00,
    stock: 10,
    image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?q=80&w=800&auto=format&fit=crop',
    description: 'Nuestros clásicos brownies melcochudos con costra crujiente y trozos de chocolate bitter.'
  },
  {
    id: 'demo-2',
    name: 'Alfajores de Maicena',
    price: 25.00,
    stock: 5,
    image_url: 'https://images.unsplash.com/photo-1519869325930-281384150729?q=80&w=800&auto=format&fit=crop',
    description: 'Suaves alfajores que se deshacen en la boca, rellenos de abundante manjar blanco de olla.'
  },
  {
    id: 'demo-3',
    name: 'Cheesecake de Fresa',
    price: 85.00,
    stock: 2, // Stock bajo para probar UI
    image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?q=80&w=800&auto=format&fit=crop',
    description: 'Cremoso cheesecake estilo New York con jalea artesanal de fresas frescas.'
  }
]
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
    <header class="z-50 absolute top-0 w-full bg-transparent transition-all duration-300">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-[#4A5D23] shadow-sm">
            <Icon name="lucide:wheat" class="w-6 h-6" />
          </div>
          <div>
            <h1 class="text-2xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe</h1>
            <p class="text-[9px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Patisserie & Café</p>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <NuxtLink 
            to="/menu"
            class="hidden md:flex items-center gap-2 text-sm font-bold text-[#2A321B] hover:text-[#4A5D23] transition-colors mr-4"
          >
            Ver Menú
          </NuxtLink>

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
              class="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 md:px-4 py-2 rounded-full text-[#2A321B] hover:bg-white transition-colors shadow-sm h-10"
            >
              <span class="hidden md:block text-xs font-bold truncate max-w-[150px]">
                {{ authStore.profile?.full_name?.split(' ')[0] || 'Mi Perfil' }}
              </span>
              <Icon name="lucide:user" class="w-5 h-5 md:w-4 md:h-4" />
            </NuxtLink>
          </template>

          <button 
            @click="cartStore.toggleDrawer()"
            class="relative w-10 h-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-[#2A321B] hover:bg-white transition-colors shadow-sm"
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

    <!-- Hero Section -->
    <section class="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 z-10">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div class="space-y-8 animate-fade-in-up">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#4A5D23]/10 text-[#4A5D23] text-xs font-bold uppercase tracking-widest">
            <Icon name="lucide:sparkles" class="w-4 h-4" />
            Pastelería Artesanal
          </div>
          
          <h2 class="text-5xl md:text-6xl lg:text-7xl font-playfair font-black text-[#2A321B] leading-[1.1] tracking-tight text-balance">
            El arte de crear <br/>
            <span class="italic text-[#4A5D23] font-medium">momentos dulces</span>
          </h2>
          
          <p class="text-lg text-[#4A5D23]/80 font-medium max-w-md leading-relaxed">
            Ingredientes seleccionados, recetas tradicionales y un toque de innovación para endulzar tus días especiales.
          </p>
          
          <div class="flex flex-wrap items-center gap-4 pt-4">
            <NuxtLink 
              to="/menu"
              class="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-[#4A5D23] hover:bg-[#3C4A1C] rounded-full overflow-hidden transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
            >
              <span class="relative z-10 flex items-center gap-2">
                Explorar el Menú
                <Icon name="lucide:arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </NuxtLink>
            
            <NuxtLink 
              to="/login"
              class="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-[#2A321B] bg-white hover:bg-[#F4F1E1] rounded-full transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Únete al Club
            </NuxtLink>
          </div>
        </div>

        <div class="relative animate-fade-in">
          <!-- Main Image -->
          <div class="relative rounded-[2rem] overflow-hidden aspect-[4/5] lg:aspect-square shadow-2xl">
            <img src="https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1000&auto=format&fit=crop" alt="Pastel de Chocolate Premium" class="w-full h-full object-cover" />
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          
          <!-- Floating Badge -->
          <div class="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 animate-bounce-slow">
            <div class="w-12 h-12 bg-[#F4F1E1] rounded-full flex items-center justify-center text-[#4A5D23]">
              <Icon name="lucide:star" class="w-6 h-6 fill-[#4A5D23]" />
            </div>
            <div>
              <p class="text-xs font-bold text-[#4A5D23] uppercase tracking-widest">Calidad</p>
              <p class="text-lg font-black font-playfair text-[#2A321B]">Premium</p>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="relative py-24 bg-white z-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="text-center mb-16">
          <Icon name="lucide:heart" class="w-8 h-8 text-[#4A5D23]/30 mx-auto mb-4" />
          <h3 class="text-4xl font-playfair font-black text-[#2A321B] mb-4">Los Favoritos</h3>
          <p class="text-sm text-[#4A5D23] font-medium max-w-md mx-auto">Nuestras creaciones más amadas por nuestros clientes. Perfectas para cualquier ocasión.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article
            v-for="(product, index) in featuredProducts"
            :key="product.id"
            class="group bg-[#F4F1E1]/30 rounded-[2rem] overflow-hidden transition-all duration-500 hover:bg-[#F4F1E1] hover:shadow-xl hover:-translate-y-2 flex flex-col"
          >
            <!-- Image Container -->
            <div class="h-64 w-full relative overflow-hidden">
              <div 
                v-if="product.stock <= 5 && product.stock > 0" 
                class="absolute top-4 right-4 z-20 bg-[#991B1B]/90 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Últimos {{ product.stock }}
              </div>
              <img :src="product.image_url" :alt="product.name" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
            </div>

            <!-- Content -->
            <div class="p-6 flex-1 flex flex-col">
              <h4 class="text-xl font-playfair font-bold text-[#2A321B] mb-2">{{ product.name }}</h4>
              <p class="text-sm text-[#4A5D23]/80 leading-relaxed mb-6 flex-1">{{ product.description }}</p>

              <div class="flex items-center justify-between mt-auto pt-4 border-t border-[#4A5D23]/10">
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-bold text-[#4A5D23] uppercase tracking-widest">S/</span>
                  <span class="text-2xl font-inter font-black text-[#2A321B]">{{ product.price.toFixed(2) }}</span>
                </div>
                
                <button
                  @click="cartStore.addToCart(product)"
                  class="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all duration-300 shadow-sm hover:shadow-md group/btn"
                >
                  <Icon name="lucide:shopping-bag" class="w-5 h-5 transform group-hover/btn:scale-110 transition-transform" />
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
    <footer class="bg-[#2A321B] text-[#F4F1E1] py-12 relative z-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 text-center">
        <Icon name="lucide:wheat" class="w-8 h-8 mx-auto mb-4 text-[#4A5D23]" />
        <h2 class="text-2xl font-playfair font-black mb-2">Dulce Fe</h2>
        <p class="text-xs text-[#F4F1E1]/60 uppercase tracking-widest mb-8">Patisserie & Café</p>
        <p class="text-sm text-[#F4F1E1]/40">© 2026 Dulce Fe. Todos los derechos reservados.</p>
      </div>
    </footer>

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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; }
.animate-fade-in { animation: fadeIn 1s ease-out forwards; }
.animate-bounce-slow { animation: bounceSlow 3s ease-in-out infinite; }
</style>
