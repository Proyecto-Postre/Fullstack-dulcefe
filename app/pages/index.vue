<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAsyncData, navigateTo } from 'nuxt/app'
import { useCartStore } from '~/stores/cart'
import { toast } from 'vue-sonner'
import type { CatalogApiResponse, CatalogProduct } from '~/types/catalog'
import ProductDetailModal from '~/components/catalog/ProductDetailModal.vue'

const cartStore = useCartStore()

// 1. Consulta dinámica de productos desde el backend con fallback elegante
const { data: catalogResponse, pending } = await useAsyncData(
  'featured-catalog',
  () => $fetch<CatalogApiResponse>('/api/products'),
  {
    default: () => ({ success: true, count: 0, data: [] })
  }
)

const allProducts = computed<CatalogProduct[]>(() => {
  return catalogResponse.value?.data || []
})

// Prioriza creaciones marcadas como 'is_featured' por el administrador, ordenando por disponibilidad de stock
const displayFeatured = computed<CatalogProduct[]>(() => {
  const serverItems = allProducts.value
  if (serverItems.length === 0) return []

  const featured = serverItems.filter(p => p.is_featured === true)
  const others = serverItems.filter(p => p.is_featured !== true)

  const sortedFeatured = [...featured].sort((a, b) => (Number(b.stock) > 0 ? 1 : 0) - (Number(a.stock) > 0 ? 1 : 0))
  const sortedOthers = [...others].sort((a, b) => (Number(b.stock) > 0 ? 1 : 0) - (Number(a.stock) > 0 ? 1 : 0))

  return [...sortedFeatured, ...sortedOthers].slice(0, 3)
})

// Estado del Modal de Detalle Rápido
const selectedProduct = ref<CatalogProduct | null>(null)
const isModalOpen = ref(false)

function openDetail(product: CatalogProduct) {
  selectedProduct.value = product
  isModalOpen.value = true
}

function closeDetail() {
  isModalOpen.value = false
  selectedProduct.value = null
}

function handleAddToCart(product: CatalogProduct, quantity: number = 1) {
  const qty = Math.max(1, quantity)
  for (let i = 0; i < qty; i++) {
    cartStore.addToCart(product)
  }
  toast.success('¡Añadido a tu pedido!', {
    description: `${qty > 1 ? `${qty}x ` : ''}${product.name} — S/ ${(Number(product.price) * qty).toFixed(2)}`
  })
}

function getProductImage(product: CatalogProduct): string {
  if (product.image_url && product.image_url.trim() !== '') {
    return product.image_url
  }
  const name = (product.name || '').toLowerCase()
  if (name.includes('torta') || name.includes('chocolate')) {
    return '/images/desserts/torta-chocolate-frutos.jpg'
  }
  return '/images/desserts/tartaleta-fresas-pistacho.jpg'
}

function goToMenuWithFilter(keyword: string) {
  navigateTo({
    path: '/menu',
    query: { q: keyword }
  })
}
</script>

<template>
  <div class="overflow-x-hidden">
    <!-- ========================================================================= -->
    <!-- 1. HERO SECTION: MOSAICO EDITORIAL ATELIER                                -->
    <!-- ========================================================================= -->
    <section class="relative pt-6 sm:pt-10 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-12 z-10">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        
        <!-- Columna Izquierda: Mensaje Editorial & Acciones -->
        <div class="lg:col-span-7 space-y-3.5 sm:space-y-8 animate-fade-in-up">
          <!-- Badge de Taller en Vivo (Oculto en móvil) -->
          <div class="hidden sm:inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-widest border border-brand-primary/20 shadow-soft-sm">
            <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse"></span>
            <span>Taller Artesanal Dulce Fe · Lima</span>
          </div>
          
          <!-- Titular Editorial -->
          <h1 class="text-3xl sm:text-6xl md:text-7xl font-playfair font-black text-brand-secondary leading-[1.08] tracking-tight text-balance">
            El arte de crear <br />
            <span class="italic font-medium text-brand-primary underline decoration-brand-accent/40 decoration-wavy decoration-2">
              momentos dulces
            </span>
          </h1>

          <!-- Fotografía Protagonista del Postre en Móvil (Visible de inmediato en < lg) -->
          <div class="lg:hidden relative w-full max-w-[290px] sm:max-w-sm mx-auto my-1 pt-0.5 animate-fade-in">
            <div class="relative rounded-[1.75rem] overflow-hidden aspect-[16/11] shadow-xl border-3 border-surface bg-brand-cream">
              <img 
                src="/images/desserts/torta-chocolate-frutos.jpg" 
                alt="Torta Artesanal de Chocolate Dulce Fe" 
                class="w-full h-full object-cover" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-brand-secondary/60 via-transparent to-transparent pointer-events-none"></div>

              <!-- Badge de Elaboración Diaria en Móvil -->
              <div class="absolute bottom-2 left-2 right-2 pr-12 bg-surface/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl shadow-soft-md flex items-center border border-surface/50 z-20">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 bg-brand-cream rounded-full flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0">
                    <Icon name="lucide:award" class="w-3 h-3 text-brand-primary" />
                  </div>
                  <div>
                    <p class="text-[7.5px] font-bold text-brand-primary uppercase tracking-widest leading-none mb-0.5">Elaboración Diaria</p>
                    <p class="text-[11px] font-black font-playfair text-brand-secondary leading-none">Calidad Artesanal 100%</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Sello 'Hecho a Mano' en Móvil -->
            <div class="absolute -bottom-1.5 -right-1.5 w-14 h-14 rounded-full bg-brand-secondary text-white flex items-center justify-center shadow-lg border-2 border-brand-accent/40 z-30 ring-3 ring-surface/90 select-none">
              <div class="w-12 h-12 rounded-full border border-dashed border-brand-accent/50 flex flex-col items-center justify-center text-center p-0.5">
                <Icon name="lucide:sparkles" class="w-3 h-3 text-brand-accent mb-0.5 animate-pulse" />
                <span class="text-[6.5px] font-black uppercase tracking-wider text-white leading-tight">Hecho</span>
                <span class="text-[5.5px] font-bold uppercase tracking-widest text-brand-accent leading-none">a Mano</span>
              </div>
            </div>
          </div>
          
          <!-- Descripción (Breve en móvil / Completa en desktop) -->
          <p class="sm:hidden text-xs text-brand-secondary/80 font-medium leading-snug">
            Repostería fina horneada a diario con frutas frescas y recetas familiares.
          </p>
          <p class="hidden sm:block text-sm sm:text-base md:text-lg text-brand-secondary/80 font-medium max-w-xl leading-relaxed">
            Repostería artesanal horneada con dedicación para cada celebración. Texturas suaves, frutas frescas del día y recetas familiares elaboradas para compartir momentos inolvidables.
          </p>

          <!-- Selector de Ocasión Rápido (Oculto en móvil / Visible en Desktop) -->
          <div class="hidden lg:block space-y-2.5 pt-1">
            <p class="text-[11px] font-bold text-brand-primary uppercase tracking-widest">
              ¿Para qué ocasión estás buscando?
            </p>
            <div class="flex flex-wrap items-center gap-2">
              <button
                @click="goToMenuWithFilter('torta')"
                type="button"
                class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface hover:bg-brand-cream border border-brand-primary/20 text-xs font-bold text-brand-secondary shadow-soft-sm hover:border-brand-primary transition-all active:scale-95 cursor-pointer"
              >
                <Icon name="lucide:cake" class="w-3.5 h-3.5 text-brand-primary" />
                <span>Tortas de Cumpleaños</span>
              </button>
              <button
                @click="goToMenuWithFilter('tarta')"
                type="button"
                class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface hover:bg-brand-cream border border-brand-primary/20 text-xs font-bold text-brand-secondary shadow-soft-sm hover:border-brand-primary transition-all active:scale-95 cursor-pointer"
              >
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-primary" />
                <span>Tartaletas & Pies</span>
              </button>
              <button
                @click="goToMenuWithFilter('box')"
                type="button"
                class="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface hover:bg-brand-cream border border-brand-primary/20 text-xs font-bold text-brand-secondary shadow-soft-sm hover:border-brand-primary transition-all active:scale-95 cursor-pointer"
              >
                <Icon name="lucide:gift" class="w-3.5 h-3.5 text-brand-primary" />
                <span>Boxes para Regalo</span>
              </button>
            </div>
          </div>
          
          <!-- Botones de Acción (Inmediatamente visibles en la primera vista) -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-4 pt-1 sm:pt-2">
            <NuxtLink 
              to="/menu"
              class="group relative inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-xs sm:text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary rounded-full overflow-hidden transition-all duration-300 shadow-soft-md hover:shadow-soft-lg active:scale-95 cursor-pointer"
            >
              <span class="relative z-10 flex items-center justify-center gap-2 uppercase tracking-wider">
                Explorar Nuestra Carta
                <Icon name="lucide:arrow-right" class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </span>
            </NuxtLink>
            
            <a 
              href="#taller-artesanal"
              class="inline-flex items-center justify-center px-5 sm:px-7 py-2.5 sm:py-4 text-xs sm:text-sm font-bold text-brand-secondary bg-surface hover:bg-brand-cream rounded-full transition-all duration-300 shadow-soft-sm hover:shadow-soft-md border border-brand-primary/20 uppercase tracking-wider cursor-pointer"
            >
              Conoce el Taller
            </a>
          </div>
        </div>

        <!-- Columna Derecha: Mosaico Asimétrico de Fotografías (Desktop) -->
        <div class="hidden lg:block lg:col-span-5 relative animate-fade-in pt-4 lg:pt-0">
          <div class="relative w-full max-w-md mx-auto">
            
            <!-- Fotografía Principal -->
            <div class="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl border-4 border-surface bg-brand-cream">
              <img 
                src="/images/desserts/torta-chocolate-frutos.jpg" 
                alt="Torta Artesanal de Chocolate Dulce Fe" 
                class="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out" 
              />
              <div class="absolute inset-0 bg-gradient-to-t from-brand-secondary/60 via-transparent to-transparent pointer-events-none"></div>

              <!-- Badge de Sello de Calidad dentro de la foto -->
              <div class="absolute bottom-4 left-4 right-4 pr-16 sm:pr-20 bg-surface/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-soft-lg flex items-center border border-surface/50 z-20">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-primary border border-brand-primary/20 shrink-0 shadow-soft-sm">
                    <Icon name="lucide:award" class="w-5 h-5 text-brand-primary" />
                  </div>
                  <div>
                    <p class="text-[9px] font-bold text-brand-primary uppercase tracking-widest leading-none mb-1">Elaboración Diaria</p>
                    <p class="text-sm sm:text-base font-black font-playfair text-brand-secondary leading-none">Calidad Artesanal 100%</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Miniatura Flotante Secundaria (Superpuesta tipo Atelier) -->
            <div class="hidden sm:block absolute -top-6 -right-6 w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border-3 border-surface bg-brand-cream z-20 rotate-3 hover:rotate-0 transition-transform duration-300">
              <img 
                src="/images/desserts/tartaleta-fresas-pistacho.jpg" 
                alt="Tartaleta de fresas gourmet" 
                class="w-full h-full object-cover" 
              />
            </div>

            <!-- Sello Verde Artesanal: Timbre de Autor 'Hecho a Mano' -->
            <div class="absolute -bottom-3 -right-3 sm:-bottom-4 sm:-right-4 w-20 h-20 rounded-full bg-brand-secondary text-white flex items-center justify-center shadow-xl border-2 border-brand-accent/40 z-30 ring-4 ring-surface/90 hover:scale-105 transition-transform duration-300 select-none">
              <div class="w-[4.2rem] h-[4.2rem] rounded-full border border-dashed border-brand-accent/50 flex flex-col items-center justify-center text-center p-1">
                <Icon name="lucide:sparkles" class="w-4 h-4 text-brand-accent mb-0.5 animate-pulse" />
                <span class="text-[8px] font-black uppercase tracking-wider text-white leading-tight">Hecho</span>
                <span class="text-[7px] font-bold uppercase tracking-widest text-brand-accent leading-none">a Mano</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 2. CINTA DE CONFIANZA ARTESANAL: 4 PILARES GOURMET                         -->
    <!-- ========================================================================= -->
    <section class="relative py-4 sm:py-8 lg:py-10 bg-surface border-y border-brand-primary/10 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-6 lg:gap-8">
          
          <div class="flex items-center sm:items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-brand-cream/40 border border-brand-primary/10">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Icon name="lucide:leaf" class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 class="text-[11px] sm:text-xs md:text-sm font-bold text-brand-secondary font-playfair leading-tight mb-0.5">Insumos Seleccionados</h4>
              <p class="text-[9.5px] sm:text-[11px] text-brand-secondary/75 leading-tight line-clamp-2 sm:line-clamp-none">Frutas frescas del día y recetas 100% artesanales.</p>
            </div>
          </div>

          <div class="flex items-center sm:items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-brand-cream/40 border border-brand-primary/10">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Icon name="lucide:flame" class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 class="text-[11px] sm:text-xs md:text-sm font-bold text-brand-secondary font-playfair leading-tight mb-0.5">Horneado Diario</h4>
              <p class="text-[9.5px] sm:text-[11px] text-brand-secondary/75 leading-tight line-clamp-2 sm:line-clamp-none">Masa fresca bajo pedido para garantizar textura viva.</p>
            </div>
          </div>

          <div class="flex items-center sm:items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-brand-cream/40 border border-brand-primary/10">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Icon name="lucide:heart-handshake" class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 class="text-[11px] sm:text-xs md:text-sm font-bold text-brand-secondary font-playfair leading-tight mb-0.5">Dedicatoria Gratis</h4>
              <p class="text-[9.5px] sm:text-[11px] text-brand-secondary/75 leading-tight line-clamp-2 sm:line-clamp-none">Mensaje personalizado escrito a mano o en placa.</p>
            </div>
          </div>

          <div class="flex items-center sm:items-start gap-2.5 sm:gap-3.5 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-brand-cream/40 border border-brand-primary/10">
            <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center shrink-0">
              <Icon name="lucide:truck" class="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h4 class="text-[11px] sm:text-xs md:text-sm font-bold text-brand-secondary font-playfair leading-tight mb-0.5">Envío Refrigerado</h4>
              <p class="text-[9.5px] sm:text-[11px] text-brand-secondary/75 leading-tight line-clamp-2 sm:line-clamp-none">Empaque protector para que llegue intacto a tu hogar.</p>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 3. VITRINA DE JOYAS DESTACADAS (DINÁMICA DE LA BD)                        -->
    <!-- ========================================================================= -->
    <section class="relative py-16 sm:py-24 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        
        <div class="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-14 gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary uppercase tracking-widest mb-2">
              <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
              <span>Selección de Autor</span>
            </div>
            <h2 class="text-3xl sm:text-4xl md:text-5xl font-playfair font-black text-brand-secondary tracking-tight">
              Nuestras Joyas Dulces
            </h2>
          </div>
          <NuxtLink 
            to="/menu"
            class="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-brand-primary hover:text-brand-secondary uppercase tracking-widest border-b border-brand-primary pb-1 self-start md:self-auto transition-colors"
          >
            Ver toda la carta
            <Icon name="lucide:arrow-right" class="w-4 h-4" />
          </NuxtLink>
        </div>

        <!-- Grid de Productos Destacados (100% reales desde Supabase) -->
        <div v-if="displayFeatured.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          <article
            v-for="product in displayFeatured"
            :key="product.id"
            class="group bg-surface rounded-3xl overflow-hidden shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 flex flex-col border border-brand-primary/10 hover:-translate-y-1.5"
          >
            <!-- Imagen con click para ver detalle -->
            <div 
              @click="openDetail(product)"
              class="h-64 sm:h-72 w-full relative overflow-hidden bg-brand-cream/60 shrink-0 cursor-pointer"
            >
              <div 
                v-if="product.stock > 0" 
                class="absolute top-3.5 right-3.5 z-20 bg-surface/90 backdrop-blur-md text-brand-primary border border-brand-primary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-soft-sm"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                <span>Horneado Diario</span>
              </div>

              <img 
                :src="getProductImage(product)" 
                :alt="product.name" 
                class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
            </div>

            <!-- Contenido -->
            <div class="p-5 sm:p-6 flex-1 flex flex-col justify-between bg-surface">
              <div @click="openDetail(product)" class="cursor-pointer">
                <h3 class="text-base sm:text-lg font-sans font-bold text-brand-secondary mb-2 leading-snug group-hover:text-brand-primary transition-colors">
                  {{ product.name }}
                </h3>
              </div>

              <div class="flex items-center justify-between pt-4 border-t border-brand-primary/10 mt-auto">
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-bold text-brand-primary uppercase tracking-widest">S/</span>
                  <span class="text-2xl font-inter font-black text-brand-secondary">
                    {{ Number(product.price).toFixed(2) }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    @click="openDetail(product)"
                    type="button"
                    class="h-10 px-3.5 rounded-full border border-brand-primary/20 bg-brand-cream/40 hover:bg-brand-cream text-brand-secondary text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    aria-label="Ver detalle"
                  >
                    Detalle
                  </button>
                  <button
                    @click="handleAddToCart(product)"
                    type="button"
                    :disabled="product.stock === 0"
                    class="h-10 px-4 rounded-full bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold flex items-center gap-1.5 shadow-soft-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40"
                    :aria-label="`Pedir ${product.name}`"
                  >
                    <span>Pedir</span>
                    <Icon name="lucide:shopping-bag" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>

        <!-- Estado si la base de datos aún no tiene postres registrados -->
        <div 
          v-else 
          class="max-w-xl mx-auto text-center bg-surface border border-brand-primary/15 rounded-3xl p-8 sm:p-10 shadow-soft-sm"
        >
          <div class="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-3">
            <Icon name="lucide:sparkles" class="w-6 h-6 text-brand-accent" />
          </div>
          <h3 class="text-xl font-playfair font-bold text-brand-secondary mb-2">
            Nuevas Creaciones en el Horno
          </h3>
          <p class="text-xs sm:text-sm text-brand-secondary/75 font-medium leading-relaxed mb-6">
            Actualmente no hay postres registrados en la base de datos. Puedes registrar nuevos postres desde el panel de administración para que se exhiban automáticamente aquí y en la carta.
          </p>
          <NuxtLink
            to="/admin"
            class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-primary text-white text-xs font-bold shadow-soft-sm hover:bg-brand-secondary transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            <span>Agregar Productos en Admin</span>
          </NuxtLink>
        </div>

      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 4. EL ARTE DEL TALLER: STORYTELLING & TRANSPARENCIA                       -->
    <!-- ========================================================================= -->
    <section id="taller-artesanal" class="relative py-16 sm:py-24 bg-surface border-t border-brand-primary/10 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          <div class="space-y-6">
            <div class="inline-flex items-center gap-2 text-xs font-bold text-brand-primary uppercase tracking-widest">
              <Icon name="lucide:wheat" class="w-4 h-4" />
              <span>Nuestra Filosofía Gastronómica</span>
            </div>

            <h2 class="text-3xl sm:text-4xl md:text-5xl font-playfair font-black text-brand-secondary leading-tight">
              Dedicación, frescura y <br />
              <span class="italic font-medium text-brand-primary">pasión por cada detalle</span>
            </h2>

            <p class="text-sm sm:text-base text-brand-secondary/80 leading-relaxed font-medium">
              En Dulce Fe cada postre cuenta una historia especial. No trabajamos con producción masiva ni postres guardados: cada pedido se hornea exclusivamente para ti, cuidando la esponjosidad de los bizcochos, la suavidad de las cremas, la frescura de nuestras frutas y una presentación impecable lista para tu mesa.
            </p>

            <div class="space-y-3 pt-2">
              <div class="flex items-center gap-3 text-xs sm:text-sm font-bold text-brand-secondary">
                <Icon name="lucide:check" class="w-4 h-4 text-brand-primary shrink-0" />
                <span>Horneado bajo pedido: máxima frescura para el día y la hora de tu reunión.</span>
              </div>
              <div class="flex items-center gap-3 text-xs sm:text-sm font-bold text-brand-secondary">
                <Icon name="lucide:check" class="w-4 h-4 text-brand-primary shrink-0" />
                <span>Texturas auténticas: bizcochos esponjosos, cremas delicadas y frutas del día.</span>
              </div>
              <div class="flex items-center gap-3 text-xs sm:text-sm font-bold text-brand-secondary">
                <Icon name="lucide:check" class="w-4 h-4 text-brand-primary shrink-0" />
                <span>Presentación cuidada: empaques elegantes y dedicatoria personalizada incluida.</span>
              </div>
              <div class="flex items-center gap-3 text-xs sm:text-sm font-bold text-brand-secondary">
                <Icon name="lucide:check" class="w-4 h-4 text-brand-primary shrink-0" />
                <span>Atención directa y puntualidad garantizada para tu total tranquilidad.</span>
              </div>
            </div>
          </div>

          <!-- Tarjeta de Sello de Autor -->
          <div class="relative bg-brand-cream/60 rounded-3xl p-8 sm:p-10 border border-brand-primary/15 shadow-soft-sm">
            <div class="space-y-6">
              <Icon name="lucide:quote" class="w-10 h-10 text-brand-primary/30" />
              <p class="font-playfair italic text-lg sm:text-xl text-brand-secondary leading-relaxed">
                "Cocinar con devoción es respetar cada insumo. Cuando una familia abre una caja de Dulce Fe, está recibiendo horas de dedicación artesanal pensadas para celebrar la vida."
              </p>
              <div class="pt-4 border-t border-brand-primary/15 flex items-center justify-between">
                <div>
                  <h4 class="font-bold text-sm text-brand-secondary">Taller Dulce Fe</h4>
                  <p class="text-xs text-brand-primary/80 font-medium">Repostería Fina Artesanal</p>
                </div>
                <div class="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center font-playfair font-black text-xl shadow-soft-sm">
                  DF
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 5. CÓMO COORDINAR TU PEDIDO: 3 PASOS TRANSPARENTES                        -->
    <!-- ========================================================================= -->
    <section class="relative py-16 sm:py-20 bg-brand-cream/40 border-t border-brand-primary/10 z-10">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
        
        <div class="max-w-xl mx-auto mb-12 sm:mb-16">
          <p class="text-xs font-bold text-brand-primary uppercase tracking-widest mb-2">Paso a Paso</p>
          <h2 class="text-3xl sm:text-4xl font-playfair font-black text-brand-secondary tracking-tight">
            Cómo Llega a Tu Mesa
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-surface rounded-2xl p-6 sm:p-8 border border-brand-primary/10 shadow-soft-sm text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary font-playfair font-black text-xl flex items-center justify-center mx-auto">
              1
            </div>
            <h3 class="text-lg font-playfair font-bold text-brand-secondary">Elige en Nuestra Carta</h3>
            <p class="text-xs text-brand-secondary/75 leading-relaxed font-medium">
              Explora nuestras tortas, tartaletas o boxes y agrega tus favoritos al pedido.
            </p>
          </div>

          <div class="bg-surface rounded-2xl p-6 sm:p-8 border border-brand-primary/10 shadow-soft-sm text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary font-playfair font-black text-xl flex items-center justify-center mx-auto">
              2
            </div>
            <h3 class="text-lg font-playfair font-bold text-brand-secondary">Indica Fecha & Dedicatoria</h3>
            <p class="text-xs text-brand-secondary/75 leading-relaxed font-medium">
              Elige entre envío a domicilio o recojo en taller y déjanos tu mensaje especial.
            </p>
          </div>

          <div class="bg-surface rounded-2xl p-6 sm:p-8 border border-brand-primary/10 shadow-soft-sm text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary font-playfair font-black text-xl flex items-center justify-center mx-auto">
              3
            </div>
            <h3 class="text-lg font-playfair font-bold text-brand-secondary">Pago Fácil & Tracking Vivo</h3>
            <p class="text-xs text-brand-secondary/75 leading-relaxed font-medium">
              Transfiere o paga con Yape/Plin y sigue el avance de tu orden en tiempo real.
            </p>
          </div>
        </div>

      </div>
    </section>

    <!-- ========================================================================= -->
    <!-- 6. LLAMADO FINAL INMERSIVO: BOUTIQUE BANNER                               -->
    <!-- ========================================================================= -->
    <section class="relative py-16 sm:py-20 bg-brand-secondary text-white z-10">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <Icon name="lucide:cake" class="w-10 h-10 text-brand-accent mx-auto" />
        <h2 class="text-3xl sm:text-5xl font-playfair font-black tracking-tight leading-tight">
          ¿Listo para endulzar tu próxima celebración?
        </h2>
        <p class="text-sm sm:text-base text-white/80 max-w-xl mx-auto font-medium leading-relaxed">
          Haz tu pedido con anticipación y asegura la frescura de tu postre favorito para este fin de semana.
        </p>
        <div class="pt-4 flex flex-wrap items-center justify-center gap-4">
          <NuxtLink 
            to="/menu"
            class="px-8 py-4 rounded-full bg-brand-primary hover:bg-white hover:text-brand-secondary text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-soft-md active:scale-95 cursor-pointer"
          >
            Ver la Carta Completa
          </NuxtLink>
          <a 
            href="https://wa.me/51998265700?text=Hola%20Dulce%20Fe,%20deseo%20consultar%20sobre%20un%20pedido%20especial"
            target="_blank"
            rel="noopener noreferrer"
            class="px-8 py-4 rounded-full bg-surface/10 hover:bg-surface/20 border border-white/20 text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4" />
            <span>Consultar por WhatsApp</span>
          </a>
        </div>
      </div>
    </section>

    <!-- Modal de Detalle de Producto -->
    <ProductDetailModal
      :product="selectedProduct"
      :is-open="isModalOpen"
      :image-url="selectedProduct ? getProductImage(selectedProduct) : ''"
      @close="closeDetail"
      @add-to-cart="handleAddToCart"
    />

    <!-- Barra Flotante de Carrito en Móvil (Conversión E-commerce) -->
    <div 
      v-if="cartStore.cartItemCount > 0" 
      class="sm:hidden fixed bottom-4 left-4 right-4 z-30 animate-pop"
    >
      <button
        type="button"
        @click="cartStore.openDrawer()"
        class="w-full bg-[#2A321B]/95 hover:bg-[#4A5D23] text-white backdrop-blur-md px-4 py-3 rounded-full shadow-2xl flex items-center justify-between border border-[#F4F1E1]/20 active:scale-98 transition-all duration-300 cursor-pointer"
        aria-label="Abrir carrito de compras"
      >
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-full bg-[#4A5D23] flex items-center justify-center text-white shrink-0">
            <Icon name="lucide:shopping-bag" class="w-4 h-4" />
          </div>
          <div class="text-left leading-tight">
            <p class="text-[11px] font-bold text-[#F4F1E1]/90">
              {{ cartStore.cartItemCount }} {{ cartStore.cartItemCount === 1 ? 'postre' : 'postres' }} en tu pedido
            </p>
            <p class="text-sm font-black font-inter text-white">
              S/ {{ cartStore.cartTotal.toFixed(2) }}
            </p>
          </div>
        </div>

        <span class="inline-flex items-center gap-1.5 text-xs font-black bg-[#F4F1E1] text-[#2A321B] px-3.5 py-1.5 rounded-full shadow-sm">
          <span>Ver Pedido</span>
          <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
        </span>
      </button>
    </div>
  </div>
</template>
