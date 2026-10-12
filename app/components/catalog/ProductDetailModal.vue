<script setup lang="ts">
import { ref, computed } from 'vue'
import type { CatalogProduct } from '~/types/catalog'

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

function increment() {
  if (!props.product) return
  if (props.product.stock && quantity.value < props.product.stock) {
    quantity.value++
  } else if (!props.product.stock) {
    quantity.value++
  }
}

function decrement() {
  if (quantity.value > 1) {
    quantity.value--
  }
}

function handleAdd() {
  if (!props.product) return
  emit('addToCart', props.product, quantity.value)
  quantity.value = 1
  emit('close')
}

// Reset cantidad al abrir un nuevo producto
watch(() => props.product, () => {
  quantity.value = 1
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div 
        v-if="isOpen && product" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-brand-secondary/60 backdrop-blur-md transition-opacity"
          @click="emit('close')"
        ></div>

        <!-- Panel del Modal -->
        <div 
          class="relative w-full max-w-2xl bg-surface rounded-3xl sm:rounded-[2.5rem] shadow-2xl border border-brand-primary/15 overflow-hidden flex flex-col md:flex-row z-10 animate-modal-pop max-h-[90vh]"
          @click.stop
        >
          <!-- Botón de Cerrar -->
          <button 
            @click="emit('close')"
            type="button"
            class="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-surface/90 hover:bg-surface border border-brand-primary/20 flex items-center justify-center text-brand-secondary hover:text-brand-primary shadow-soft-sm transition-all active:scale-95 cursor-pointer"
            aria-label="Cerrar detalle"
          >
            <Icon name="lucide:x" class="w-5 h-5" />
          </button>

          <!-- Imagen del Producto -->
          <div class="w-full md:w-1/2 h-56 sm:h-72 md:h-auto relative bg-brand-cream/50 overflow-hidden shrink-0">
            <img 
              :src="imageUrl" 
              :alt="product.name" 
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-brand-secondary/40 via-transparent to-transparent md:hidden"></div>

            <div 
              v-if="product.stock > 0" 
              class="absolute top-4 left-4 bg-surface/95 backdrop-blur-md text-brand-primary border border-brand-primary/20 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-soft-sm"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse"></span>
              <span>Horneado Diario</span>
            </div>
          </div>

          <!-- Contenido y Acciones -->
          <div class="p-6 sm:p-8 flex-1 flex flex-col justify-between overflow-y-auto">
            <div>
              <div class="flex items-center gap-2 text-brand-primary text-xs font-bold uppercase tracking-wider mb-2">
                <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
                <span>Especialidad Artesanal</span>
              </div>

              <h2 class="text-2xl sm:text-3xl font-playfair font-black text-brand-secondary mb-3 leading-tight">
                {{ product.name }}
              </h2>

              <p class="text-sm text-brand-secondary/80 leading-relaxed font-medium mb-6">
                {{ product.description || 'Elaborado con masa fresca e insumos seleccionados bajo rigurosos estándares de repostería fina. Ideal para celebraciones especiales y compartir momentos dulces.' }}
              </p>

              <!-- Características Clave -->
              <div class="grid grid-cols-2 gap-2.5 mb-6 text-xs font-semibold text-brand-secondary/85">
                <div class="flex items-center gap-2 p-2.5 rounded-xl bg-brand-cream/60 border border-brand-primary/10">
                  <Icon name="lucide:clock" class="w-4 h-4 text-brand-primary" />
                  <span>Consumo: 3-4 días</span>
                </div>
                <div class="flex items-center gap-2 p-2.5 rounded-xl bg-brand-cream/60 border border-brand-primary/10">
                  <Icon name="lucide:shield-check" class="w-4 h-4 text-brand-primary" />
                  <span>100% Artesanal</span>
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
                    class="w-8 h-8 rounded-full flex items-center justify-center text-brand-secondary hover:bg-surface hover:shadow-xs transition-all active:scale-90 cursor-pointer"
                    aria-label="Aumentar cantidad"
                  >
                    <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Botón Principal -->
                <button 
                  @click="handleAdd"
                  type="button"
                  :disabled="product.stock === 0"
                  class="flex-1 py-3.5 px-6 rounded-full bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-soft-sm hover:shadow-soft-md transition-all active:scale-95 cursor-pointer disabled:bg-brand-cream/80 disabled:text-brand-primary/40 disabled:cursor-not-allowed"
                >
                  <Icon name="lucide:shopping-bag" class="w-4 h-4" />
                  <span>{{ product.stock > 0 ? `Agregar (S/ ${(Number(product.price) * quantity).toFixed(2)})` : 'Agotado' }}</span>
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

@keyframes modalPop {
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.animate-modal-pop {
  animation: modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
