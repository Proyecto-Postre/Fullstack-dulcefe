<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
</script>

<template>
  <div class="min-h-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream relative overflow-hidden flex flex-col">
    
    <!-- Drawer Global del Carrito (Instancia Única) -->
    <CartDrawer />
    
    <!-- Elementos Botánicos Ambientales de Fondo -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-brand-primary/[0.02] -rotate-12 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-brand-primary/[0.02] rotate-45 pointer-events-none" />
    </div>

    <!-- Header Sticky Unificado -->
    <header class="z-40 sticky top-0 w-full bg-brand-cream/95 backdrop-blur-md border-b border-brand-primary/10 transition-all duration-300 shadow-soft-sm">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex justify-between items-center">
        <!-- Logo -->
        <NuxtLink to="/" class="flex items-center gap-3.5 group cursor-pointer">
          <div class="w-11 h-11 border border-brand-primary/20 bg-surface rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm group-hover:scale-105 transition-transform">
            <Icon name="lucide:wheat" class="w-6 h-6" />
          </div>
          <div>
            <span class="text-2xl font-playfair font-black tracking-tight text-brand-secondary group-hover:text-brand-primary transition-colors">
              Dulce Fe
            </span>
            <p class="text-[9px] font-bold text-brand-primary uppercase tracking-[0.25em] mt-0.5">Pastelería Fina</p>
          </div>
        </NuxtLink>

        <!-- Navegación Central (Desktop) -->
        <nav class="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide">
          <NuxtLink 
            to="/" 
            active-class="text-brand-primary font-black"
            class="text-brand-secondary/80 hover:text-brand-primary transition-colors cursor-pointer py-1"
          >
            Inicio
          </NuxtLink>
          <NuxtLink 
            to="/menu" 
            active-class="text-brand-primary font-black"
            class="text-brand-secondary/80 hover:text-brand-primary transition-colors cursor-pointer py-1"
          >
            Carta & Menú
          </NuxtLink>
          <NuxtLink 
            to="/perfil" 
            active-class="text-brand-primary font-black"
            class="text-brand-secondary/80 hover:text-brand-primary transition-colors cursor-pointer py-1"
          >
            Mis Pedidos
          </NuxtLink>
        </nav>

        <!-- Acciones: Carrito y Autenticación -->
        <div class="flex items-center gap-3">
          <!-- Botón de Carrito -->
          <button 
            @click="cartStore.openDrawer()" 
            class="relative flex items-center gap-2 bg-surface hover:bg-brand-cream border border-brand-primary/20 px-4 py-2.5 rounded-full shadow-soft-sm hover:shadow-soft-md transition-all active:translate-y-0.5 cursor-pointer text-brand-secondary"
            aria-label="Ver carrito"
          >
            <Icon name="lucide:shopping-bag" class="w-5 h-5 text-brand-primary" />
            <span class="font-bold text-xs hidden sm:inline">Carrito</span>
            <span 
              v-if="cartStore.cartItemCount > 0" 
              class="w-5 h-5 bg-brand-primary text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pop"
            >
              {{ cartStore.cartItemCount }}
            </span>
          </button>

          <!-- Acceso de Usuario / Perfil -->
          <template v-if="authStore.isLoggedIn">
            <!-- Acceso a Panel Admin si es Administrador -->
            <NuxtLink 
              v-if="authStore.isAdmin"
              to="/admin" 
              class="hidden sm:flex items-center gap-1.5 bg-brand-secondary text-white hover:bg-brand-primary border border-transparent px-4 py-2.5 rounded-full font-bold text-xs shadow-soft-sm transition-all cursor-pointer"
            >
              <Icon name="lucide:shield-check" class="w-4 h-4 text-status-success" />
              <span>Panel Admin</span>
            </NuxtLink>

            <!-- Acceso a Mi Perfil -->
            <NuxtLink 
              to="/perfil" 
              class="flex items-center gap-2 bg-surface hover:bg-brand-cream border border-brand-primary/20 px-3.5 py-2.5 rounded-full shadow-soft-sm transition-all cursor-pointer text-brand-secondary"
              title="Mi Perfil"
            >
              <Icon name="lucide:user" class="w-4 h-4 text-brand-primary" />
              <span class="font-bold text-xs hidden lg:inline max-w-[120px] truncate">
                {{ authStore.user?.user_metadata?.full_name || 'Mi Perfil' }}
              </span>
            </NuxtLink>
          </template>

          <template v-else>
            <NuxtLink 
              to="/login" 
              class="flex items-center gap-1.5 bg-brand-primary text-white hover:bg-brand-secondary border border-transparent px-4 py-2.5 rounded-full font-bold text-xs shadow-soft-sm transition-all cursor-pointer active:translate-y-0.5"
            >
              <Icon name="lucide:user" class="w-4 h-4" />
              <span>Ingresar</span>
            </NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <!-- Contenido Central de la Vista -->
    <main class="flex-grow z-10">
      <slot />
    </main>

    <!-- Footer Institucional Unificado -->
    <footer class="z-20 bg-brand-secondary text-brand-cream py-14 px-6 lg:px-12 border-t border-brand-primary/20 mt-auto">
      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <!-- Columna 1: Branding -->
        <div>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 border border-white/20 bg-brand-primary rounded-full flex items-center justify-center text-white">
              <Icon name="lucide:wheat" class="w-5 h-5" />
            </div>
            <span class="text-2xl font-playfair font-black text-brand-cream">Dulce Fe</span>
          </div>
          <p class="text-xs text-brand-cream/70 leading-relaxed max-w-sm">
            Pastelería fina y repostería artesanal de alta gama. Creamos experiencias inolvidables para endulzar cada uno de tus momentos especiales.
          </p>
        </div>

        <!-- Columna 2: Enlaces Rápidos -->
        <div>
          <h4 class="font-playfair font-bold text-base text-brand-cream mb-4">Navegación</h4>
          <ul class="space-y-2.5 text-xs text-brand-cream/80 font-medium">
            <li>
              <NuxtLink to="/" class="hover:text-status-success transition-colors">Inicio</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/menu" class="hover:text-status-success transition-colors">Carta & Menú Completo</NuxtLink>
            </li>
            <li>
              <NuxtLink to="/perfil" class="hover:text-status-success transition-colors">Historial de Pedidos</NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Columna 3: Contacto & Horarios -->
        <div>
          <h4 class="font-playfair font-bold text-base text-brand-cream mb-4">Contacto & Pedidos</h4>
          <p class="text-xs text-brand-cream/80 mb-2 flex items-center gap-2">
            <Icon name="lucide:message-circle" class="w-4 h-4 text-status-success" />
            <span>WhatsApp: +{{ config.public.whatsappNumber }}</span>
          </p>
          <p class="text-xs text-brand-cream/70 leading-relaxed">
            Atención: Lunes a Sábado de 8:00 am a 8:00 pm.<br>
            Domingos de 9:00 am a 5:00 pm.
          </p>
        </div>
      </div>

      <div class="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center text-[11px] text-brand-cream/50 gap-4">
        <span>© {{ new Date().getFullYear() }} Dulce Fe Pastelería Fina. Todos los derechos reservados.</span>
        <span>Hecho con amor y precisión artesanal.</span>
      </div>
    </footer>

  </div>
</template>
