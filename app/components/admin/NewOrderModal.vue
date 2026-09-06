<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import type { ProductRow } from '~/types/catalog'
import type { SelectedProductItem } from '~/types/admin-orders'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const isSubmitting = ref(false)
const errorMessage = ref('')

// Form state
const orderData = ref({
  customerName: '',
  customerPhone: '',
  deliveryDate: '',
  deliveryTime: '',
  notes: ''
})

// Products selection
const products = ref<ProductRow[]>([])
const selectedProducts = ref<SelectedProductItem[]>([])
const selectedProductId = ref<number | string>('')

const productOptions = computed(() => {
  return products.value.map((p: ProductRow) => ({
    label: `${p.name} - S/ ${Number(p.price).toFixed(2)}`,
    value: p.id
  }))
})

const fetchProducts = async (): Promise<void> => {
  try {
    const res = await $fetch<{ success: boolean; data: ProductRow[] }>('/api/products')
    if (res?.data) products.value = res.data
  } catch {
    // Si falla la consulta del catálogo, mantener array vacío
  }
}

onMounted(() => {
  fetchProducts()
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    orderData.value = { customerName: '', customerPhone: '', deliveryDate: '', deliveryTime: '', notes: '' }
    selectedProducts.value = []
    errorMessage.value = ''
  }
})

const addProduct = (productId: number | string): void => {
  if (!productId) return
  const idNum = Number(productId)
  const product = products.value.find((p: ProductRow) => p.id === idNum)
  if (!product) return
  
  const existing = selectedProducts.value.find((p: SelectedProductItem) => p.product_id === idNum)
  if (existing) {
    existing.quantity++
  } else {
    selectedProducts.value.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1
    })
  }
  selectedProductId.value = ''
}

const removeProduct = (index: number): void => {
  selectedProducts.value.splice(index, 1)
}

const totalAmount = computed<number>(() => {
  return selectedProducts.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const createOrder = async (): Promise<void> => {
  if (!orderData.value.customerName || selectedProducts.value.length === 0) {
    errorMessage.value = 'Debes ingresar el nombre del cliente y al menos un producto.'
    return
  }
  
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    const payload = {
      channel: 'admin' as const,
      customer_name: orderData.value.customerName.trim(),
      customer_phone: orderData.value.customerPhone?.trim() || undefined,
      delivery_date: orderData.value.deliveryDate || undefined,
      delivery_time: orderData.value.deliveryTime || undefined,
      notes: orderData.value.notes?.trim() || undefined,
      items: selectedProducts.value.map(p => ({
        product_id: p.product_id,
        quantity: p.quantity
      }))
    }

    await $fetch('/api/admin/orders', {
      method: 'POST',
      body: payload
    })

    emit('created')
    emit('close')
  } catch (err: unknown) {
    const fetchErr = err as { data?: { error?: { message?: string } }; message?: string }
    errorMessage.value = fetchErr.data?.error?.message || fetchErr.message || 'Error al crear el pedido manual.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="#admin-modal-portal">
    <div v-if="show" class="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto">
      <div class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm" @click="emit('close')"></div>
      
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-new-order-title"
        class="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop flex flex-col max-h-[85vh] border border-[#4A5D23]/10"
      >
        <!-- Header -->
        <div class="p-5 sm:p-6 bg-[#F4F1E1]/30 border-b border-[#4A5D23]/10 flex items-center justify-between shrink-0">
          <h3 id="modal-new-order-title" class="text-xl font-playfair font-black text-[#2A321B] flex items-center gap-2">
            <Icon name="lucide:plus-circle" class="w-5 h-5 text-[#4A5D23]" />
            Nuevo Pedido Manual
          </h3>
          <button
            @click="emit('close')"
            type="button"
            aria-label="Cerrar modal de nuevo pedido"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Form Body -->
        <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          <!-- Error Alert -->
          <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm flex items-start gap-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Customer Data -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold text-[#4A5D23] uppercase tracking-wider border-b border-[#4A5D23]/10 pb-2">
              Datos del Cliente
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Nombre Completo *</label>
                <input 
                  v-model="orderData.customerName" 
                  type="text" 
                  required
                  placeholder="Ej: Maria Lopez"
                  class="w-full px-3 py-2 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Teléfono (WhatsApp)</label>
                <input 
                  v-model="orderData.customerPhone" 
                  type="tel" 
                  placeholder="Ej: 987654321"
                  class="w-full px-3 py-2 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
            </div>
          </div>

          <!-- Delivery Data -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold text-[#4A5D23] uppercase tracking-wider border-b border-[#4A5D23]/10 pb-2">
              Entrega y Despacho
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Fecha de Entrega</label>
                <input 
                  v-model="orderData.deliveryDate" 
                  type="date" 
                  class="w-full px-3 py-2 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Hora de Entrega</label>
                <input 
                  v-model="orderData.deliveryTime" 
                  type="time" 
                  class="w-full px-3 py-2 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1">Notas / Especificaciones</label>
              <textarea 
                v-model="orderData.notes" 
                rows="2" 
                placeholder="Dedicatoria especial, empaque de regalo, etc."
                class="w-full px-3 py-2 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 text-sm font-medium text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
              ></textarea>
            </div>
          </div>

          <!-- Products Selection -->
          <div class="space-y-4">
            <h4 class="text-xs font-bold text-[#4A5D23] uppercase tracking-wider border-b border-[#4A5D23]/10 pb-2 flex items-center justify-between">
              <span>Productos del Pedido</span>
              <span class="text-[10px] font-medium text-[#4A5D23]/70">{{ selectedProducts.length }} seleccionados</span>
            </h4>
            
            <div class="flex gap-2">
              <select 
                v-model="selectedProductId" 
                class="flex-1 px-3 py-2 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
              >
                <option value="" disabled>Selecciona un producto...</option>
                <option v-for="opt in productOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <button 
                @click="addProduct(selectedProductId)" 
                type="button" 
                class="px-4 py-2 bg-[#4A5D23] text-white rounded-xl font-bold text-xs hover:bg-[#3C4A1C] transition-all flex items-center gap-1 shadow-sm shrink-0 cursor-pointer"
              >
                <Icon name="lucide:plus" class="w-4 h-4" />
                Agregar
              </button>
            </div>

            <!-- Products List -->
            <div v-if="selectedProducts.length > 0" class="border border-[#4A5D23]/10 rounded-xl overflow-hidden divide-y divide-[#4A5D23]/10">
              <div v-for="(item, idx) in selectedProducts" :key="idx" class="p-3 flex items-center justify-between bg-white">
                <div>
                  <p class="text-sm font-bold text-[#2A321B]">{{ item.name }}</p>
                  <p class="text-[10px] text-[#4A5D23]/70">S/ {{ item.price.toFixed(2) }} c/u</p>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center border border-[#4A5D23]/20 rounded-lg overflow-hidden">
                    <button @click="item.quantity > 1 ? item.quantity-- : removeProduct(idx)" type="button" class="px-2 py-1 bg-[#F4F1E1] hover:bg-[#e6e2cc] text-xs font-bold text-[#2A321B] transition-colors cursor-pointer">-</button>
                    <span class="px-3 py-1 text-xs font-black text-[#2A321B] bg-white">{{ item.quantity }}</span>
                    <button @click="item.quantity++" type="button" class="px-2 py-1 bg-[#F4F1E1] hover:bg-[#e6e2cc] text-xs font-bold text-[#2A321B] transition-colors cursor-pointer">+</button>
                  </div>
                  <span class="text-xs font-black text-[#2A321B] w-16 text-right">
                    S/ {{ (item.price * item.quantity).toFixed(2) }}
                  </span>
                  <button @click="removeProduct(idx)" type="button" class="text-red-500 hover:text-red-700 p-1 cursor-pointer">
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 bg-[#F4F1E1]/20 rounded-xl border border-dashed border-[#4A5D23]/20">
              <p class="text-xs text-[#4A5D23]/60 italic">Aún no has agregado productos al pedido</p>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 sm:p-6 bg-[#F4F1E1]/30 border-t border-[#4A5D23]/10 flex items-center justify-between shrink-0">
          <div>
            <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider">Total a Cobrar</p>
            <p class="text-2xl font-black text-[#2A321B]">S/ {{ totalAmount.toFixed(2) }}</p>
          </div>
          <div class="flex gap-2">
            <button @click="emit('close')" type="button" class="px-4 py-2.5 rounded-xl border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all cursor-pointer">
              Cancelar
            </button>
            <button 
              @click="createOrder" 
              :disabled="isSubmitting || selectedProducts.length === 0"
              type="button" 
              class="px-5 py-2.5 bg-[#4A5D23] text-white rounded-xl text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <span>{{ isSubmitting ? 'Creando Pedido...' : 'Confirmar Pedido' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
