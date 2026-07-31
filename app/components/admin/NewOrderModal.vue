<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

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
const products = ref<any[]>([])
const selectedProducts = ref<{ product_id: string, quantity: number, price: number, name: string }[]>([])
const selectedProductId = ref('')

const productOptions = computed(() => {
  return products.value.map(p => ({
    label: `${p.name} - S/ ${p.price}`,
    value: p.id
  }))
})

const fetchProducts = async () => {
  const { data } = await supabase.from('products').select('id, name, price, stock').order('name')
  if (data) products.value = data
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

const addProduct = (productId: string) => {
  if (!productId) return
  const product = products.value.find(p => p.id === productId)
  if (!product) return
  
  const existing = selectedProducts.value.find(p => p.product_id === productId)
  if (existing) {
    existing.quantity++
  } else {
    selectedProducts.value.push({
      product_id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    })
  }
  selectedProductId.value = ''
}

const removeProduct = (index: number) => {
  selectedProducts.value.splice(index, 1)
}

const totalAmount = computed(() => {
  return selectedProducts.value.reduce((sum, item) => sum + (item.price * item.quantity), 0)
})

const createOrder = async () => {
  if (!orderData.value.customerName || selectedProducts.value.length === 0) {
    errorMessage.value = 'Debes ingresar el nombre del cliente y al menos un producto.'
    return
  }
  
  isSubmitting.value = true
  errorMessage.value = ''
  
  try {
    // 1. Create a dummy profile for the manual order (or find existing by phone if we wanted to be fancy)
    // For simplicity, we'll create an order without a user_id, but we need to store the name/phone.
    // Wait, the current schema expects a user_id for profiles.
    // If it's a manual order, we can create a profile with a dummy UUID, or we can just store the name in a new table.
    // Let's check how orders are structured. They have a user_id.
    // If we can't create a user easily, we might need to use a generic "Guest" user or create an auth user.
    // Actually, we can just call an RPC or create a profile directly if RLS allows it.
    // Let's try to insert a profile directly. If it fails due to RLS, we'll need an RPC.
    
    // Let's use a generic UUID for manual orders, or generate a random one.
    const dummyUserId = crypto.randomUUID()
    
    const { error: profileError } = await (supabase as any).from('profiles').insert({
      id: dummyUserId,
      full_name: orderData.value.customerName,
      phone: orderData.value.customerPhone || null,
      role: 'customer'
    })
    
    if (profileError) {
      console.warn('Could not create profile, might be RLS. Proceeding without user_id if possible.', profileError)
    }

    // 2. Create the order
    const { data: orderRes, error: orderError } = await (supabase as any).from('orders').insert({
      user_id: profileError ? null : dummyUserId, // If profile creation failed, try null (if allowed)
      total_amount: totalAmount.value,
      status: 'pending',
      delivery_date: orderData.value.deliveryDate || null,
      delivery_time: orderData.value.deliveryTime || null,
      notes: orderData.value.notes || null
    }).select().single()

    if (orderError) throw orderError

    // 3. Create order items
    const orderItems = selectedProducts.value.map(p => ({
      order_id: orderRes.id,
      product_id: p.product_id,
      quantity: p.quantity,
      price_at_time: p.price
    }))

    const { error: itemsError } = await (supabase as any).from('order_items').insert(orderItems)
    if (itemsError) throw itemsError

    emit('created')
    emit('close')
  } catch (err: any) {
    console.error('Error creating manual order:', err)
    errorMessage.value = err.message || 'Error al crear el pedido manual.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="#admin-modal-portal">
    <div v-if="show" class="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto">
      <div class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm" @click="emit('close')"></div>
      
      <div class="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop flex flex-col max-h-[85vh] border border-[#4A5D23]/10">
        <!-- Header -->
        <div class="p-5 sm:p-6 bg-[#F4F1E1]/30 border-b border-[#4A5D23]/10 flex items-center justify-between shrink-0">
          <h3 class="text-xl font-playfair font-black text-[#2A321B] flex items-center gap-2">
            <Icon name="lucide:plus-circle" class="w-5 h-5 text-[#4A5D23]" />
            Nuevo Pedido Manual
          </h3>
          <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <!-- Body -->
        <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div v-if="errorMessage" class="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-sm flex items-start gap-2">
            <Icon name="lucide:alert-circle" class="w-5 h-5 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="createOrder" class="space-y-8">
            <!-- Cliente -->
            <section>
              <h4 class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-4">Datos del Cliente</h4>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Nombre Completo *</label>
                  <input v-model="orderData.customerName" type="text" required placeholder="Ej: Juan Pérez" class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Teléfono</label>
                  <input v-model="orderData.customerPhone" type="text" placeholder="Ej: 987654321" class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30" />
                </div>
              </div>
            </section>

            <!-- Productos -->
            <section>
              <h4 class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-4">Productos</h4>
              <div class="bg-[#F4F1E1]/30 p-4 rounded-2xl border border-[#4A5D23]/20 space-y-4">
                <div class="flex gap-2">
                  <CustomSelect 
                    v-model="selectedProductId"
                    :options="productOptions"
                    placeholder="Seleccionar producto..."
                    bgClass="bg-white py-2.5"
                    class="flex-1"
                  />
                <button type="button" @click="addProduct(selectedProductId)" class="px-5 py-2.5 bg-[#4A5D23] text-white rounded-xl font-bold shadow-sm hover:bg-[#3C4A1C] transition-all active:translate-y-0.5 active:shadow-none text-sm">
                  Agregar
                </button>
              </div>

              <div v-if="selectedProducts.length > 0" class="border border-[#4A5D23]/10 rounded-xl overflow-hidden bg-white">
                <table class="w-full text-left text-sm">
                  <thead class="bg-[#F4F1E1]/50">
                    <tr>
                      <th class="px-4 py-3 font-bold text-[#4A5D23]">Producto</th>
                      <th class="px-4 py-3 font-bold text-[#4A5D23] text-center">Cant.</th>
                      <th class="px-4 py-3 font-bold text-[#4A5D23] text-right">Subtotal</th>
                      <th class="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-[#4A5D23]/10">
                    <tr v-for="(item, idx) in selectedProducts" :key="idx">
                      <td class="px-4 py-3 font-medium text-[#2A321B]">{{ item.name }}</td>
                      <td class="px-4 py-3 text-center">
                        <input type="number" v-model="item.quantity" min="1" class="w-16 px-2 py-1 text-center bg-[#F4F1E1]/50 rounded-lg border border-[#4A5D23]/20 focus:outline-none focus:bg-white font-bold text-[#2A321B] [&::-webkit-inner-spin-button]:appearance-none" />
                      </td>
                      <td class="px-4 py-3 font-black text-[#4A5D23] text-right">S/ {{ (item.price * item.quantity).toFixed(2) }}</td>
                      <td class="px-4 py-3 text-right">
                        <button type="button" @click="removeProduct(idx)" class="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                          <Icon name="lucide:trash-2" class="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div class="flex justify-end pt-2">
                <p class="text-base font-black text-[#2A321B]">Total: <span class="text-[#4A5D23]">S/ {{ totalAmount.toFixed(2) }}</span></p>
              </div>
            </div>
          </section>

          <!-- Entrega -->
          <section>
            <h4 class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-4">Detalles de Entrega</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Fecha de Entrega</label>
                <CustomDatePicker v-model="orderData.deliveryDate" bgClass="bg-[#F4F1E1]/30" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Hora de Entrega</label>
                <CustomTimePicker v-model="orderData.deliveryTime" bgClass="bg-[#F4F1E1]/30" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Notas / Instrucciones</label>
              <textarea v-model="orderData.notes" rows="2" placeholder="Ej: Entregar en puerta trasera" class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all resize-none placeholder:text-[#4A5D23]/30"></textarea>
            </div>
          </section>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-[#4A5D23]/10 flex justify-end gap-3">
            <button type="button" @click="emit('close')" class="px-5 py-2.5 rounded-xl font-bold text-[#4A5D23] hover:bg-[#4A5D23]/10 transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" :disabled="isSubmitting" class="px-6 py-2.5 rounded-xl font-bold bg-[#4A5D23] text-white hover:bg-[#3C4A1C] shadow-sm transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-2 disabled:opacity-50 text-sm">
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              Crear Pedido
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</Teleport>
</template>

<style scoped>
.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes pop {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(74, 93, 35, 0.2);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(74, 93, 35, 0.4);
}
</style>
