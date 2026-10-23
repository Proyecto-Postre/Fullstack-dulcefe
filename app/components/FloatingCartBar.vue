<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useCartStore } from '~/stores/cart'

const cartStore = useCartStore()
const bottomOffsetPx = ref(16)

let ticking = false

function updatePosition() {
  if (typeof document === 'undefined') return
  const footer = document.querySelector('footer')
  if (!footer) {
    bottomOffsetPx.value = 16
    return
  }

  const rect = footer.getBoundingClientRect()
  const windowHeight = window.innerHeight

  // Si el borde superior del footer entra en el viewport, elevamos la barra para que quede justo encima
  if (rect.top < windowHeight) {
    const overlap = windowHeight - rect.top
    bottomOffsetPx.value = Math.max(16, overlap + 16)
  } else {
    bottomOffsetPx.value = 16
  }
  ticking = false
}

function onScrollOrResize() {
  if (!ticking) {
    window.requestAnimationFrame(updatePosition)
    ticking = true
  }
}

onMounted(() => {
  updatePosition()
  window.addEventListener('scroll', onScrollOrResize, { passive: true })
  window.addEventListener('resize', onScrollOrResize, { passive: true })
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', onScrollOrResize)
    window.removeEventListener('resize', onScrollOrResize)
  }
})
</script>

<template>
  <!-- Barra Flotante de Carrito en Móvil (Alineación Dinámica Sobre el Footer) -->
  <Teleport to="body">
    <div 
      v-if="cartStore.cartItemCount > 0" 
      class="sm:hidden fixed left-4 right-4 z-40 animate-pop transition-[bottom] duration-150 ease-out pointer-events-none"
      :style="{ bottom: `${bottomOffsetPx}px` }"
    >
      <button
        type="button"
        @click="cartStore.openDrawer()"
        class="w-full bg-[#2A321B]/95 hover:bg-[#4A5D23] text-white backdrop-blur-md px-4 py-3 rounded-full shadow-2xl flex items-center justify-between border border-[#F4F1E1]/20 active:scale-98 transition-all duration-300 cursor-pointer pointer-events-auto"
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
  </Teleport>
</template>
