<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()

const isMobileMenuOpen = ref(false)

// Cerrar sidebar al cambiar de ruta automáticamente
watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

async function handleLogout() {
  isMobileMenuOpen.value = false
  await authStore.signOut()
  navigateTo('/login')
}
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
      <div class="max-w-7xl mx-auto px-5 sm:px-6 lg:px-12 py-3.5 sm:py-4 flex justify-between items-center">
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

        <!-- Acciones: Carrito, Perfil (Desktop) y Botón Hamburguesa (Móvil) -->
        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Botón de Carrito (Visible en desktop y móvil) -->
          <button 
            @click="cartStore.openDrawer()" 
            class="relative flex items-center gap-1.5 sm:gap-2 bg-surface hover:bg-brand-cream border border-brand-primary/20 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-soft-sm hover:shadow-soft-md transition-all active:translate-y-0.5 cursor-pointer text-brand-secondary"
            aria-label="Ver carrito"
          >
            <Icon name="lucide:shopping-bag" class="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
            <span class="font-bold text-xs hidden sm:inline">Carrito</span>
            <span 
              v-if="cartStore.cartItemCount > 0" 
              class="w-5 h-5 bg-brand-primary text-white text-[10px] font-black rounded-full flex items-center justify-center animate-pop"
            >
              {{ cartStore.cartItemCount }}
            </span>
          </button>

          <!-- Acciones de Usuario (Solo Desktop >= md) -->
          <div class="hidden md:flex items-center gap-3">
            <template v-if="authStore.isLoggedIn">
              <!-- Acceso a Panel Admin si es Administrador (Solo Desktop) -->
              <NuxtLink 
                v-if="authStore.isAdmin"
                to="/admin" 
                class="flex items-center gap-1.5 bg-brand-secondary text-white hover:bg-brand-primary border border-transparent px-4 py-2.5 rounded-full font-bold text-xs shadow-soft-sm transition-all cursor-pointer"
                title="Panel de Administración ERP"
              >
                <Icon name="lucide:shield-check" class="w-4 h-4 text-status-success shrink-0" />
                <span>Panel Admin</span>
              </NuxtLink>

              <!-- Acceso a Mi Perfil (Solo Desktop) -->
              <NuxtLink 
                to="/perfil" 
                class="flex items-center gap-2 bg-surface hover:bg-brand-cream border border-brand-primary/20 px-3.5 py-2.5 rounded-full shadow-soft-sm transition-all cursor-pointer text-brand-secondary"
                title="Mi Perfil"
              >
                <Icon name="lucide:user" class="w-4 h-4 text-brand-primary" />
                <span class="font-bold text-xs max-w-[120px] truncate">
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

          <!-- Botón Menú Hamburguesa (Exclusivo Mobile / Tablet < md) -->
          <button 
            type="button" 
            @click="isMobileMenuOpen = true"
            class="md:hidden flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-brand-primary/20 bg-surface hover:bg-brand-cream text-brand-secondary transition-all shadow-soft-sm active:scale-95 cursor-pointer"
            aria-label="Abrir menú de navegación"
          >
            <Icon name="lucide:menu" class="w-5 h-5 text-brand-primary" />
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido Central de la Vista -->
    <main class="flex-grow z-10">
      <slot />
    </main>

    <!-- Sidebar Móvil de Navegación (Drawer exclusivo para móviles < md) -->
    <Teleport to="body">
      <Transition name="drawer-fade">
        <div 
          v-if="isMobileMenuOpen" 
          class="fixed inset-0 z-[9999] flex justify-end md:hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Backdrop -->
          <div 
            class="absolute inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity"
            @click="isMobileMenuOpen = false"
          ></div>

          <!-- Sidebar Panel -->
          <aside 
            class="relative w-[85%] max-w-xs bg-brand-cream h-full shadow-2xl border-l border-brand-primary/20 flex flex-col z-10 animate-slide-in p-6"
            @click.stop
          >
            <!-- Cabecera del Sidebar -->
            <div class="flex items-center justify-between pb-5 border-b border-brand-primary/10">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 border border-brand-primary/20 bg-surface rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm">
                  <Icon name="lucide:wheat" class="w-5 h-5" />
                </div>
                <div>
                  <span class="text-xl font-playfair font-black text-brand-secondary">Dulce Fe</span>
                  <p class="text-[9px] font-bold text-brand-primary uppercase tracking-[0.2em]">Pastelería Fina</p>
                </div>
              </div>
              <button 
                type="button"
                @click="isMobileMenuOpen = false"
                class="w-9 h-9 rounded-full bg-surface border border-brand-primary/15 flex items-center justify-center text-brand-secondary hover:text-brand-primary transition-colors cursor-pointer"
                aria-label="Cerrar menú"
              >
                <Icon name="lucide:x" class="w-5 h-5" />
              </button>
            </div>

            <!-- Navegación Principal del Sidebar -->
            <div class="flex-1 overflow-y-auto py-5 space-y-2">
              <NuxtLink 
                to="/" 
                @click="isMobileMenuOpen = false"
                active-class="bg-surface text-brand-primary font-black border-brand-primary/20 shadow-soft-sm"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all"
              >
                <Icon name="lucide:home" class="w-5 h-5 text-brand-primary" />
                <span>Inicio</span>
              </NuxtLink>

              <NuxtLink 
                to="/menu" 
                @click="isMobileMenuOpen = false"
                active-class="bg-surface text-brand-primary font-black border-brand-primary/20 shadow-soft-sm"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all"
              >
                <Icon name="lucide:book-open" class="w-5 h-5 text-brand-primary" />
                <span>Carta & Menú</span>
              </NuxtLink>

              <NuxtLink 
                to="/perfil" 
                @click="isMobileMenuOpen = false"
                active-class="bg-surface text-brand-primary font-black border-brand-primary/20 shadow-soft-sm"
                class="flex items-center gap-3.5 px-4 py-3 rounded-2xl font-bold text-sm text-brand-secondary hover:bg-surface/80 border border-transparent transition-all"
              >
                <Icon name="lucide:shopping-bag" class="w-5 h-5 text-brand-primary" />
                <span>Mis Pedidos</span>
              </NuxtLink>

              <!-- Opción Destacada de Panel Admin (Solo Administradores) -->
              <div v-if="authStore.isAdmin" class="pt-4 mt-4 border-t border-brand-primary/10">
                <p class="text-[10px] font-black uppercase tracking-wider text-brand-primary/60 px-4 mb-2">Administración</p>
                <NuxtLink 
                  to="/admin" 
                  @click="isMobileMenuOpen = false"
                  class="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-bold text-sm bg-brand-secondary text-white hover:bg-brand-primary shadow-soft-sm transition-all"
                >
                  <Icon name="lucide:shield-check" class="w-5 h-5 text-status-success shrink-0" />
                  <div class="min-w-0">
                    <span class="block text-sm font-black">Panel de Administración</span>
                    <span class="block text-[10px] text-brand-cream/70 font-normal">Vitrina, insumos y pedidos</span>
                  </div>
                </NuxtLink>
              </div>
            </div>

            <!-- Footer del Sidebar Móvil -->
            <div class="pt-4 border-t border-brand-primary/10 space-y-3">
              <template v-if="authStore.isLoggedIn">
                <NuxtLink 
                  to="/perfil" 
                  @click="isMobileMenuOpen = false"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-brand-primary/15 text-xs font-bold text-brand-secondary"
                >
                  <Icon name="lucide:user" class="w-4 h-4 text-brand-primary" />
                  <span class="truncate">{{ authStore.user?.user_metadata?.full_name || authStore.user?.email || 'Mi Perfil' }}</span>
                </NuxtLink>
                <button 
                  @click="handleLogout" 
                  type="button"
                  class="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-status-danger hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <Icon name="lucide:log-out" class="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </template>
              <template v-else>
                <NuxtLink 
                  to="/login" 
                  @click="isMobileMenuOpen = false"
                  class="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-soft-sm hover:bg-brand-secondary transition-all"
                >
                  <Icon name="lucide:user" class="w-4 h-4" />
                  <span>Iniciar Sesión</span>
                </NuxtLink>
              </template>
            </div>
          </aside>
        </div>
      </Transition>
    </Teleport>

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
          <h4 class="font-playfair font-bold text-base text-brand-cream mb-4">Explora</h4>
          <ul class="space-y-2 text-xs text-brand-cream/80">
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

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.animate-slide-in {
  animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
