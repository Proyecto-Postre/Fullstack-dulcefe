<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'

const cartStore = useCartStore()

interface FeaturedProduct {
  id: string
  name: string
  price: number
  stock: number
  image_url: string
  description: string
}

const featuredProducts: FeaturedProduct[] = [
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

function handleAddToCart(product: FeaturedProduct) {
  cartStore.addToCart(product)
  toast.success('¡Agregado a tu pedido!', {
    description: `${product.name} — S/ ${Number(product.price).toFixed(2)}`
  })
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="relative pt-10 pb-16 lg:pt-16 lg:pb-24 px-6 lg:px-12 z-10">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        
        <div class="space-y-8 animate-fade-in-up">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest border border-brand-primary/20">
            <Icon name="lucide:sparkles" class="w-4 h-4" />
            Repostería Fina Artesanal
          </div>
          
          <h2 class="text-5xl md:text-6xl lg:text-7xl font-playfair font-black text-brand-secondary leading-[1.1] tracking-tight text-balance">
            El arte de crear <br/>
            <span class="italic text-brand-primary font-medium">momentos dulces</span>
          </h2>
          
          <p class="text-lg text-brand-primary/80 font-medium max-w-md leading-relaxed">
            Ingredientes botánicos y naturales seleccionados, escandallados al gramo y horneados con amor para endulzar tus momentos memorables.
          </p>
          
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <NuxtLink 
              to="/menu"
              class="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary rounded-full overflow-hidden transition-all duration-300 shadow-soft-md hover:shadow-soft-lg active:translate-y-0.5"
            >
              <span class="relative z-10 flex items-center gap-2">
                Explorar el Menú
                <Icon name="lucide:arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </NuxtLink>
            
            <NuxtLink 
              to="/login"
              class="inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-brand-secondary bg-surface hover:bg-brand-cream rounded-full transition-all duration-300 shadow-soft-sm hover:shadow-soft-md border border-brand-primary/20"
            >
              Únete al Club
            </NuxtLink>
          </div>
        </div>

        <div class="relative animate-fade-in">
          <!-- Main Photo Container -->
          <div class="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] lg:aspect-square shadow-2xl border-4 border-surface">
            <img 
              src="/images/desserts/torta-chocolate-frutos.jpg" 
              alt="Torta Artesanal de Chocolate Dulce Fe" 
              class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" 
            />
            <div class="absolute inset-0 bg-gradient-to-t from-brand-secondary/60 via-transparent to-transparent pointer-events-none"></div>

            <!-- Floating Badge Contained Inside Bottom-Left -->
            <div class="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-surface/95 backdrop-blur-md px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-soft-lg flex items-center gap-3.5 border border-surface/50 z-20">
              <div class="w-10 h-10 sm:w-11 sm:h-11 bg-brand-cream rounded-full flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
                <Icon name="lucide:award" class="w-5 h-5 sm:w-6 sm:h-6 text-brand-primary" />
              </div>
              <div>
                <p class="text-[9px] sm:text-[10px] font-bold text-brand-primary uppercase tracking-widest leading-none mb-1">100% Artesanal</p>
                <p class="text-base sm:text-lg font-black font-playfair text-brand-secondary leading-none">Calidad Premium</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Featured Products Section -->
    <section class="relative py-20 bg-surface z-10 border-t border-brand-primary/10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12">
        <div class="text-center mb-16">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-cream text-brand-primary mb-4">
            <Icon name="lucide:sparkles" class="w-6 h-6" />
          </div>
          <h3 class="text-4xl font-playfair font-black text-brand-secondary mb-3">Las Creaciones Favoritas</h3>
          <p class="text-sm text-brand-primary font-medium max-w-md mx-auto">Nuestras joyas de autor más solicitadas. Horneadas al día bajo pedido especial.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <article
            v-for="product in featuredProducts"
            :key="product.id"
            class="group bg-brand-cream/40 border border-brand-primary/10 rounded-[2rem] overflow-hidden transition-all duration-500 hover:bg-brand-cream hover:shadow-soft-lg hover:-translate-y-1.5 flex flex-col"
          >
            <!-- Image Container -->
            <div class="h-72 w-full relative overflow-hidden bg-surface">
              <div 
                v-if="product.stock <= 5 && product.stock > 0" 
                class="absolute top-4 right-4 z-20 bg-status-danger/95 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                Últimas {{ product.stock }} unidades
              </div>
              <img 
                :src="product.image_url" 
                :alt="product.name" 
                class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
            </div>

            <!-- Content -->
            <div class="p-6 flex-1 flex flex-col justify-between">
              <div>
                <h4 class="text-xl font-playfair font-bold text-brand-secondary mb-2 leading-snug">{{ product.name }}</h4>
                <p class="text-xs text-brand-primary/80 leading-relaxed mb-6 font-medium">{{ product.description }}</p>
              </div>

              <div class="flex items-center justify-between pt-4 border-t border-brand-primary/10">
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-bold text-brand-primary uppercase tracking-widest">S/</span>
                  <span class="text-2xl font-inter font-black text-brand-secondary">{{ product.price.toFixed(2) }}</span>
                </div>
                
                <button
                  @click="handleAddToCart(product)"
                  type="button"
                  class="h-11 px-5 rounded-full bg-surface border border-brand-primary/25 flex items-center gap-2 text-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300 shadow-soft-sm hover:shadow-soft-md active:scale-95 cursor-pointer"
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
            class="inline-flex items-center gap-2 text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors uppercase tracking-widest border-b-2 border-brand-primary hover:border-brand-secondary pb-1"
          >
            Ver Catálogo Completo
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
