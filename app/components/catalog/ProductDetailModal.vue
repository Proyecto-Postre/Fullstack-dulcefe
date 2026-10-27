<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import type { CatalogProduct } from '~/types/catalog'
import { toast } from 'vue-sonner'

const props = defineProps<{
  product: CatalogProduct | null
  isOpen: boolean
  imageUrl: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'addToCart', product: CatalogProduct, quantity: number): void
}>()

const quantity = ref(1)
const isCopied = ref(false)

// Gesto táctil nativo tipo iOS/Android Bottom Sheet (1:1 en tiempo real)
const dragOffsetY = ref(0)
const isDragging = ref(false)
const isClosingByDrag = ref(false)
let startY = 0

// Reset de posición
watch(() => [props.isOpen, props.product?.id], ([open]) => {
  if (open) {
    quantity.value = 1
    isCopied.value = false
    dragOffsetY.value = 0
    isDragging.value = false
    isClosingByDrag.value = false
  }
})

function onTouchMoveWindow(e: TouchEvent) {
  if (!isDragging.value || e.touches.length !== 1) return
  const touch = e.touches[0]
  if (!touch) return
  const currentY = touch.clientY
  const delta = currentY - startY
  if (delta > 0) {
    dragOffsetY.value = delta
    if (e.cancelable) e.preventDefault()
  } else {
    // Amortiguación elástica si intenta jalar hacia arriba
    dragOffsetY.value = delta * 0.15
  }
}

function onTouchEndWindow() {
  if (!isDragging.value) return
  isDragging.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('touchmove', onTouchMoveWindow)
    window.removeEventListener('touchend', onTouchEndWindow)
    window.removeEventListener('touchcancel', onTouchEndWindow)
  }

  const DISMISS_THRESHOLD = 95 // Umbral en px para confirmar el cierre al soltar
  if (dragOffsetY.value > DISMISS_THRESHOLD) {
    isClosingByDrag.value = true
    dragOffsetY.value = 600 // Anima hacia abajo saliendo de la pantalla
    setTimeout(() => {
      emit('close')
      dragOffsetY.value = 0
      isClosingByDrag.value = false
    }, 240)
  } else {
    // Si no superó el umbral, rebota suavemente a su posición original
    dragOffsetY.value = 0
  }
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const touch = e.touches[0]
  if (!touch) return
  isDragging.value = true
  startY = touch.clientY
  if (typeof window !== 'undefined') {
    window.addEventListener('touchmove', onTouchMoveWindow, { passive: false })
    window.addEventListener('touchend', onTouchEndWindow)
    window.addEventListener('touchcancel', onTouchEndWindow)
  }
}

// Soporte también para mouse (escritorio y emulador de navegador)
function onMouseMoveWindow(e: MouseEvent) {
  if (!isDragging.value) return
  const delta = e.clientY - startY
  if (delta > 0) {
    dragOffsetY.value = delta
  } else {
    dragOffsetY.value = delta * 0.15
  }
}

function onMouseUpWindow() {
  if (!isDragging.value) return
  isDragging.value = false
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', onMouseMoveWindow)
    window.removeEventListener('mouseup', onMouseUpWindow)
  }

  const DISMISS_THRESHOLD = 95
  if (dragOffsetY.value > DISMISS_THRESHOLD) {
    isClosingByDrag.value = true
    dragOffsetY.value = 600
    setTimeout(() => {
      emit('close')
      dragOffsetY.value = 0
      isClosingByDrag.value = false
    }, 240)
  } else {
    dragOffsetY.value = 0
  }
}

function onMouseDown(e: MouseEvent) {
  isDragging.value = true
  startY = e.clientY
  if (typeof window !== 'undefined') {
    window.addEventListener('mousemove', onMouseMoveWindow)
    window.addEventListener('mouseup', onMouseUpWindow)
  }
}

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('touchmove', onTouchMoveWindow)
    window.removeEventListener('touchend', onTouchEndWindow)
    window.removeEventListener('touchcancel', onTouchEndWindow)
    window.removeEventListener('mousemove', onMouseMoveWindow)
    window.removeEventListener('mouseup', onMouseUpWindow)
  }
})

const modalSheetStyle = computed(() => {
  const currentY = Math.max(0, dragOffsetY.value)
  if (currentY === 0 && !isClosingByDrag.value && !isDragging.value) {
    return {}
  }
  return {
    transform: `translate3d(0, ${currentY}px, 0)`,
    // Cuando el usuario arrastra, NO hay transición: sigue el dedo 1:1 en tiempo real
    transition: isDragging.value ? 'none' : 'transform 0.25s cubic-bezier(0.18, 0.89, 0.32, 1)',
    willChange: 'transform'
  }
})

const backdropStyle = computed(() => {
  if (dragOffsetY.value <= 0) return {}
  const opacity = Math.max(0.1, 1 - (dragOffsetY.value / 380))
  return {
    opacity,
    transition: isDragging.value ? 'none' : 'opacity 0.25s ease'
  }
})

// Bloqueo estricto del scroll del body cuando el modal está activo
watch(() => props.isOpen, (open) => {
  if (typeof document === 'undefined') return
  if (open) {
    document.body.classList.add('overflow-hidden', 'overscroll-none')
  } else {
    document.body.classList.remove('overflow-hidden', 'overscroll-none')
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.classList.remove('overflow-hidden', 'overscroll-none')
  }
})

// Manejo accesible de tecla Escape
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeyDown)
  }
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeyDown)
  }
})

const maxStock = computed(() => {
  if (!props.product) return 0
  const stock = Number(props.product.stock)
  return isNaN(stock) ? 99 : Math.max(0, stock)
})

const isAvailable = computed(() => {
  return props.product && maxStock.value > 0 && Number(props.product.price) > 0
})

function increment() {
  if (!props.product) return
  if (quantity.value < maxStock.value) {
    quantity.value++
  } else {
    toast.info('Límite de disponibilidad', {
      description: `Disponemos de ${maxStock.value} unidades para entrega inmediata.`
    })
  }
}

function decrement() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function handleAdd() {
  if (!props.product || !isAvailable.value) return
  emit('addToCart', props.product, quantity.value)
  quantity.value = 1
  emit('close')
}

async function copyProductShareLink() {
  if (!props.product || typeof window === 'undefined') return
  const url = new URL(window.location.origin + '/menu')
  url.searchParams.set('producto', String(props.product.id))
  const shareUrl = url.toString()

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `${props.product.name} — Dulce Fe`,
        text: `¡Mira este delicioso postre en Dulce Fe! ${props.product.name}`,
        url: shareUrl
      })
      return
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') return
    }
  }

  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    isCopied.value = true
    toast.success('¡Enlace copiado al portapapeles!', {
      description: `Listo para compartir ${props.product.name}`
    })
    setTimeout(() => {
      isCopied.value = false
    }, 2500)
  } catch {
    toast.error('No se pudo copiar el enlace')
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="isOpen && product" 
        class="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="product.name"
      >
        <!-- Backdrop con desenfoque suave -->
        <div 
          class="absolute inset-0 bg-brand-secondary/65 backdrop-blur-md transition-opacity"
          :style="backdropStyle"
          @click="emit('close')"
          aria-hidden="true"
        ></div>

        <!-- Panel del Modal (Adaptativo: Bottom Sheet en móvil, Diálogo en Desktop) -->
        <div 
          class="modal-sheet-panel relative w-full max-w-3xl bg-surface rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl border border-brand-primary/15 overflow-hidden flex flex-col md:flex-row z-10 max-h-[92dvh] sm:max-h-[88vh]"
          :style="modalSheetStyle"
          @click.stop
        >
          <!-- Acciones Superiores Flotantes: Compartir y Cerrar -->
          <div class="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              @click="copyProductShareLink"
              class="w-9 h-9 rounded-full bg-surface/90 hover:bg-brand-cream border border-brand-primary/20 flex items-center justify-center text-brand-secondary hover:text-brand-primary shadow-soft-sm transition-all active:scale-95 cursor-pointer"
              title="Compartir enlace de este postre"
              aria-label="Compartir postre"
            >
              <Icon :name="isCopied ? 'lucide:check' : 'lucide:share-2'" :class="['w-4 h-4', isCopied ? 'text-emerald-600' : 'text-brand-secondary']" />
            </button>

            <button 
              @click="emit('close')"
              type="button"
              class="w-9 h-9 rounded-full bg-surface/90 hover:bg-brand-cream border border-brand-primary/20 flex items-center justify-center text-brand-secondary hover:text-brand-primary shadow-soft-sm transition-all active:scale-95 cursor-pointer"
              aria-label="Cerrar detalle"
            >
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Tirador Táctil Móvil (Gesto nativo: arrastrar hacia abajo para cerrar) -->
          <div 
            class="sm:hidden w-full flex flex-col items-center justify-center pt-3 pb-2 shrink-0 bg-brand-cream/60 cursor-grab active:cursor-grabbing select-none touch-none"
            @touchstart.prevent="onTouchStart"
            @mousedown="onMouseDown"
            aria-label="Arrastrar hacia abajo para cerrar"
          >
            <div 
              class="w-12 h-1.5 rounded-full transition-colors duration-150"
              :class="isDragging ? 'bg-brand-primary' : 'bg-brand-primary/30'"
            ></div>
          </div>

          <!-- Imagen del Producto -->
          <div class="w-full md:w-1/2 h-56 sm:h-72 md:h-auto relative bg-brand-cream/50 overflow-hidden shrink-0">
            <img 
              :src="imageUrl" 
              :alt="product.name" 
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-brand-secondary/40 via-transparent to-transparent md:hidden"></div>

            <div 
              v-if="!isAvailable" 
              class="absolute top-4 left-4 bg-brand-secondary/95 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-soft-sm"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>Agotado por hoy</span>
            </div>
          </div>

          <!-- Contenido y Acciones -->
          <div class="p-6 sm:p-8 flex-1 flex flex-col justify-between overflow-y-auto overscroll-contain">
            <div>
              <div class="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-2">
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
                <span>Especialidad Artesanal</span>
              </div>

              <h2 class="text-2xl sm:text-3xl font-playfair font-black text-brand-secondary mb-3 leading-tight">
                {{ product.name }}
              </h2>

              <p class="text-sm text-brand-secondary/85 leading-relaxed font-medium mb-6">
                {{ product.description || 'Elaborado con masa fresca e insumos seleccionados bajo rigurosos estándares de repostería fina. Ideal para celebraciones especiales y compartir momentos dulces.' }}
              </p>

              <!-- Características Clave del Atelier -->
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6 text-xs font-semibold text-brand-secondary/85">
                <div class="flex items-center gap-2 p-2.5 rounded-xl bg-brand-cream/60 border border-brand-primary/10">
                  <Icon name="lucide:clock" class="w-4 h-4 text-brand-primary shrink-0" />
                  <span class="truncate">Consumo: {{ product.shelf_life || '3-4 días' }}</span>
                </div>
                <div v-if="product.portions" class="flex items-center gap-2 p-2.5 rounded-xl bg-brand-cream/60 border border-brand-primary/10">
                  <Icon name="lucide:users" class="w-4 h-4 text-brand-primary shrink-0" />
                  <span class="truncate">{{ product.portions }} {{ product.portions === 1 ? 'porción aprox.' : 'porciones aprox.' }}</span>
                </div>
                <div class="flex items-center gap-2 p-2.5 rounded-xl bg-brand-cream/60 border border-brand-primary/10" :class="{ 'col-span-2 sm:col-span-1': !product.portions }">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-brand-primary shrink-0" />
                  <span class="truncate">100% Artesanal</span>
                </div>
              </div>
            </div>

            <!-- Precios y Botón de Añadir -->
            <div class="pt-5 border-t border-brand-primary/15 mt-auto">
              <div class="flex items-baseline justify-between mb-4">
                <span class="text-xs font-bold text-brand-primary/70 uppercase tracking-wider">Precio Unitario</span>
                <div class="flex items-baseline gap-1">
                  <span class="text-xs font-bold text-brand-primary">S/</span>
                  <span class="text-2xl font-inter font-black text-brand-secondary">
                    {{ Number(product.price).toFixed(2) }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-3">
                <!-- Selector de Cantidad -->
                <div class="flex items-center border border-brand-primary/20 rounded-full bg-brand-cream/50 p-1 shrink-0">
                  <button 
                    @click="decrement"
                    type="button"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-brand-secondary hover:bg-surface hover:shadow-xs transition-all active:scale-90 cursor-pointer disabled:opacity-40"
                    :disabled="quantity <= 1"
                    aria-label="Disminuir cantidad"
                  >
                    <Icon name="lucide:minus" class="w-3.5 h-3.5" />
                  </button>
                  <span class="w-9 text-center font-bold text-sm font-inter text-brand-secondary">
                    {{ quantity }}
                  </span>
                  <button 
                    @click="increment"
                    type="button"
                    class="w-8 h-8 rounded-full flex items-center justify-center text-brand-secondary hover:bg-surface hover:shadow-xs transition-all active:scale-90 cursor-pointer disabled:opacity-40"
                    :disabled="!isAvailable || quantity >= maxStock"
                    aria-label="Aumentar cantidad"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Botón Principal -->
                <button 
                  @click="handleAdd"
                  type="button"
                  :disabled="!isAvailable"
                  class="flex-1 py-3.5 px-6 rounded-full bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer disabled:bg-brand-cream/80 disabled:text-brand-primary/40 disabled:cursor-not-allowed"
                >
                  <Icon name="lucide:shopping-bag" class="w-4 h-4" />
                  <span>{{ isAvailable ? `Agregar (S/ ${(Number(product.price) * quantity).toFixed(2)})` : 'Agotado por hoy' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.25s ease-out;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-sheet-panel,
.modal-fade-leave-active .modal-sheet-panel {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out;
}
.modal-fade-enter-from .modal-sheet-panel,
.modal-fade-leave-to .modal-sheet-panel {
  transform: translateY(100%);
  opacity: 0;
}
@media (min-width: 640px) {
  .modal-fade-enter-from .modal-sheet-panel,
  .modal-fade-leave-to .modal-sheet-panel {
    transform: scale(0.96);
    opacity: 0;
  }
}
</style>
