<script setup lang="ts">
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()

defineEmits<{
  (e: 'open-mobile-menu'): void
}>()
</script>

<template>
  <!-- Header Sticky Unificado (Boutique Dulce Fe - Reutilizable y Alineado) -->
  <header class="z-40 sticky top-0 w-full bg-brand-cream/95 backdrop-blur-md border-b border-brand-primary/10 transition-all duration-300 shadow-soft-sm">
    <div class="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-4 flex justify-between items-center">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-3 sm:gap-3.5 group cursor-pointer">
        <div class="w-10 h-10 sm:w-11 sm:h-11 border border-brand-primary/20 bg-surface rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm group-hover:scale-105 transition-transform shrink-0">
          <Icon name="lucide:wheat" class="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <span class="text-xl sm:text-2xl font-playfair font-black tracking-tight text-brand-secondary group-hover:text-brand-primary transition-colors leading-tight block">
            Dulce Fe
          </span>
          <p class="text-[8px] sm:text-[9px] font-bold text-brand-primary uppercase tracking-[0.25em] mt-0.5">Pastelería Fina</p>
        </div>
      </NuxtLink>

      <!-- Navegación Central (Desktop >= md) -->
      <nav class="hidden md:flex items-center gap-3 lg:gap-5 text-sm font-bold tracking-wide">
        <NuxtLink 
          to="/" 
          active-class="text-brand-primary font-black bg-brand-primary/10 shadow-xs"
          class="px-3.5 py-2 rounded-full text-brand-secondary/85 hover:text-brand-primary hover:bg-brand-primary/10 hover:shadow-soft-sm transition-all duration-200 cursor-pointer"
        >
          Inicio
        </NuxtLink>
        <NuxtLink 
          to="/menu" 
          active-class="text-brand-primary font-black bg-brand-primary/10 shadow-xs"
          class="px-3.5 py-2 rounded-full text-brand-secondary/85 hover:text-brand-primary hover:bg-brand-primary/10 hover:shadow-soft-sm transition-all duration-200 cursor-pointer"
        >
          Carta & Menú
        </NuxtLink>
        <NuxtLink 
          to="/perfil?tab=pedidos" 
          active-class="text-brand-primary font-black bg-brand-primary/10 shadow-xs"
          class="px-3.5 py-2 rounded-full text-brand-secondary/85 hover:text-brand-primary hover:bg-brand-primary/10 hover:shadow-soft-sm transition-all duration-200 cursor-pointer"
        >
          Mis Pedidos
        </NuxtLink>
      </nav>

      <!-- Acciones: Carrito, Perfil (Desktop) y Botón Hamburguesa (Móvil) -->
      <div class="flex items-center gap-2 sm:gap-3">
        <!-- Botón de Carrito (Visible en desktop y móvil) -->
        <button 
          @click="cartStore.openDrawer()" 
          class="group relative flex items-center gap-1.5 sm:gap-2 bg-surface hover:bg-[#EDE8D5] border border-brand-primary/20 hover:border-brand-primary px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-soft-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer text-brand-secondary hover:text-brand-primary"
          aria-label="Ver carrito"
        >
          <Icon name="lucide:shopping-bag" class="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary group-hover:scale-110 transition-transform" />
          <span class="font-bold text-xs hidden sm:inline">Carrito</span>
          <span 
            v-if="cartStore.cartItemCount > 0" 
            class="w-5 h-5 bg-brand-primary text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pop group-hover:scale-105 transition-transform"
          >
            {{ cartStore.cartItemCount }}
          </span>
        </button>

        <!-- Acciones de Usuario (Solo Desktop >= md) -->
        <div class="hidden md:flex items-center gap-2.5 sm:gap-3">
          <ClientOnly>
            <template v-if="authStore.isLoggedIn">
              <!-- Acceso a Panel Admin si es Administrador (Solo Desktop) -->
              <NuxtLink 
                v-if="authStore.isAdmin"
                to="/admin" 
                class="flex items-center gap-1.5 bg-brand-secondary text-white hover:bg-brand-primary border border-transparent px-4 py-2.5 rounded-full font-bold text-xs shadow-soft-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Icon name="lucide:shield-check" class="w-4 h-4 text-status-success shrink-0" />
                <span>Panel Admin</span>
              </NuxtLink>

              <!-- Acceso a Mi Perfil / Datos Personales (Solo Desktop) -->
              <NuxtLink 
                to="/perfil?tab=personal" 
                class="group flex items-center gap-2 bg-surface hover:bg-[#EDE8D5] border border-brand-primary/20 hover:border-brand-primary px-3.5 py-2.5 rounded-full shadow-soft-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer text-brand-secondary hover:text-brand-primary"
              >
                <Icon name="lucide:user" class="w-4 h-4 text-brand-primary group-hover:scale-110 transition-transform" />
                <span class="font-bold text-xs max-w-[130px] truncate">
                  {{ authStore.profile?.full_name || authStore.user?.user_metadata?.full_name || 'Mi Perfil' }}
                </span>
              </NuxtLink>
            </template>

            <template v-else>
              <NuxtLink 
                to="/login" 
                class="flex items-center gap-1.5 bg-brand-primary text-white hover:bg-brand-secondary border border-transparent px-4 py-2.5 rounded-full font-bold text-xs shadow-soft-sm hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-200 cursor-pointer active:translate-y-0 active:scale-95"
              >
                <Icon name="lucide:user" class="w-4 h-4" />
                <span>Ingresar</span>
              </NuxtLink>
            </template>

            <template #fallback>
              <div class="h-9 w-24 bg-brand-primary/10 rounded-full animate-pulse"></div>
            </template>
          </ClientOnly>
        </div>

        <!-- Botón Menú Hamburguesa (Exclusivo Mobile / Tablet < md) -->
        <button 
          type="button" 
          @click="$emit('open-mobile-menu')"
          class="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-brand-primary/20 bg-surface hover:bg-brand-cream text-brand-secondary transition-all shadow-soft-sm active:scale-95 cursor-pointer"
          aria-label="Abrir menú de navegación"
        >
          <Icon name="lucide:menu" class="w-5 h-5 text-brand-primary" />
        </button>
      </div>
    </div>
  </header>
</template>
