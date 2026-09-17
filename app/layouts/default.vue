<script setup lang="ts">
import { ref, watch } from 'vue'
import { useCartStore } from '~/stores/cart'
import { useAuthStore } from '~/stores/auth'

const cartStore = useCartStore()
const authStore = useAuthStore()
const config = useRuntimeConfig()
const route = useRoute()

const isMobileMenuOpen = ref(false)

// Bloqueo de scroll del body al abrir el menú móvil
watch(isMobileMenuOpen, (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) {
    document.body.classList.add('overflow-hidden', 'overscroll-none')
  } else {
    document.body.classList.remove('overflow-hidden', 'overscroll-none')
  }
})

// Cerrar sidebar al cambiar de ruta automáticamente
watch(() => route.fullPath, () => {
  isMobileMenuOpen.value = false
})

async function handleLogout() {
  isMobileMenuOpen.value = false
  await authStore.signOut()
  navigateTo('/login')
}

const formattedWhatsApp = computed(() => {
  const digits = String(config.public.whatsappNumber || '51998265700').replace(/\D/g, '')
  if (digits.startsWith('51') && digits.length === 11) {
    return `+51 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  if (digits.length === 9) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return digits.startsWith('51') ? `+51 ${digits.slice(2)}` : `+${digits}`
})
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

    <!-- Contenido Central de la Vista con flex-grow para empujar footer al fondo -->
    <main class="flex-grow z-10 flex flex-col">
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
            class="absolute inset-0 bg-[#2A321B]/50 backdrop-blur-sm transition-opacity touch-none"
            @click="isMobileMenuOpen = false"
            @touchmove.prevent
          ></div>

          <!-- Sidebar Panel -->
          <aside 
            class="relative w-[85%] max-w-xs bg-brand-cream h-full h-[100dvh] max-h-[100dvh] shadow-2xl border-l border-brand-primary/20 flex flex-col z-10 animate-slide-in p-6 overscroll-contain overflow-hidden"
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
                to="/perfil?tab=pedidos" 
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
                  to="/perfil?tab=personal" 
                  @click="isMobileMenuOpen = false"
                  class="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-surface border border-brand-primary/15 text-xs font-bold text-brand-secondary"
                >
                  <Icon name="lucide:user" class="w-4 h-4 text-brand-primary" />
                  <span class="truncate">{{ authStore.profile?.full_name || authStore.user?.user_metadata?.full_name || authStore.user?.email || 'Mi Perfil' }}</span>
                </NuxtLink>
                <button 
                  @click="handleLogout" 
                  type="button"
                  class="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-status-danger bg-red-50/60 hover:bg-red-500 hover:text-white border border-red-200/60 hover:border-red-500 shadow-soft-sm hover:shadow-md active:scale-98 transition-all duration-200 cursor-pointer"
                  aria-label="Cerrar sesión"
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

    <!-- Footer de la Tienda (Elegante y Proporcionado) -->
    <footer class="z-20 bg-brand-secondary text-brand-cream py-5 sm:py-6 px-6 sm:px-8 lg:px-12 border-t border-brand-primary/20 mt-auto shrink-0">
      <div class="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
        <!-- Marca e Identidad -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 border border-white/20 bg-brand-primary/40 rounded-full flex items-center justify-center text-brand-cream shrink-0 shadow-soft-sm">
            <Icon name="lucide:wheat" class="w-4 h-4 text-brand-cream" />
          </div>
          <div class="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
            <span class="text-base sm:text-lg font-playfair font-black text-brand-cream tracking-tight">Dulce Fe</span>
            <span class="text-xs text-brand-cream/60 font-medium">Pastelería Fina Artesanal</span>
            <span class="text-xs text-brand-cream/40">© {{ new Date().getFullYear() }}</span>
          </div>
        </div>

        <!-- Atención y Contacto Directo WhatsApp -->
        <div class="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-5">
          <span class="text-xs text-brand-cream/60 font-medium hidden md:inline">
            Atención: Lun-Sáb 8am-8pm | Dom 9am-5pm
          </span>
          <a 
            :href="`https://wa.me/${config.public.whatsappNumber}`" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs sm:text-sm text-brand-cream font-bold transition-all shadow-soft-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-400" />
            <span>WhatsApp: {{ formattedWhatsApp }}</span>
          </a>
        </div>
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
