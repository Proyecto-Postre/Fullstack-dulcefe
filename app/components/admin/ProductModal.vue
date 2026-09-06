<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ProductRow, ProductUploadResponse } from '~/types/catalog'

const props = defineProps<{
  show: boolean
  productToEdit?: ProductRow | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', product: ProductRow, isNew: boolean): void
}>()

const newProduct = ref<{
  id: number | string
  name: string
  price: number | string
  stock: number | string
  image_url: string
}>({ id: '', name: '', price: '', stock: '', image_url: '' })

const isSubmitting = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.productToEdit) {
      newProduct.value = { 
        id: props.productToEdit.id,
        name: props.productToEdit.name, 
        price: props.productToEdit.price ?? '', 
        stock: props.productToEdit.stock ?? '',
        image_url: props.productToEdit.image_url || ''
      }
      previewUrl.value = props.productToEdit.image_url || null
    } else {
      newProduct.value = { id: '', name: '', price: '', stock: '', image_url: '' }
      previewUrl.value = null
    }
    errorMessage.value = ''
    selectedFile.value = null
  }
})

function closeModal(): void {
  emit('close')
}

function handleFileChange(event: Event): void {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  } else {
    selectedFile.value = null
    previewUrl.value = null
  }
}

async function saveProduct(): Promise<void> {
  if (!newProduct.value.name || (props.productToEdit && !newProduct.value.price)) {
    errorMessage.value = 'Faltan campos obligatorios.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    let uploadedImageUrl = newProduct.value.image_url
    if (selectedFile.value) {
      const formData = new FormData()
      formData.append('file', selectedFile.value)
      const uploadRes = await $fetch<ProductUploadResponse>('/api/products/upload', {
        method: 'POST',
        body: formData
      })
      if (uploadRes?.success && uploadRes.url) {
        uploadedImageUrl = uploadRes.url
      }
    }

    const method = props.productToEdit ? 'PUT' : 'POST'
    const endpoint = props.productToEdit ? `/api/products/${props.productToEdit.id}` : '/api/products'
    
    const res = await $fetch<{ success: boolean, data?: ProductRow[] }>(endpoint, {
      method,
      body: {
        name: newProduct.value.name,
        price: Number(newProduct.value.price || 0),
        stock: Number(newProduct.value.stock || 0),
        image_url: uploadedImageUrl
      }
    })
    
    const savedProduct: ProductRow = (res?.data && res.data[0]) 
      ? res.data[0] 
      : {
          id: Number(newProduct.value.id) || 0,
          name: newProduct.value.name,
          price: Number(newProduct.value.price || 0),
          stock: Number(newProduct.value.stock || 0),
          image_url: uploadedImageUrl || null,
          created_at: new Date().toISOString()
        }

    emit('saved', savedProduct, !props.productToEdit)
    closeModal()
  } catch (err: unknown) {
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string }
    errorMessage.value = fetchErr.data?.statusMessage || fetchErr.message || 'Error al guardar producto.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <Teleport to="#admin-modal-portal">
    <div v-if="show" class="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto">
      <div class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm" @click="closeModal"></div>
      
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-product-title"
        class="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10 max-h-[85vh] flex flex-col"
      >
        <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          <div class="flex items-center justify-between mb-6">
            <h3 id="modal-product-title" class="text-xl font-playfair font-black text-[#2A321B]">
              {{ productToEdit ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
            <button
              type="button"
              aria-label="Cerrar modal de producto"
              @click="closeModal"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm flex items-start gap-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="saveProduct" class="space-y-5">
            <!-- Imagen Upload -->
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Imagen del Producto</label>
              <div class="flex items-center gap-4">
                <div class="w-20 h-20 rounded-2xl bg-[#F4F1E1]/50 border-2 border-dashed border-[#4A5D23]/20 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
                  <Icon v-else name="lucide:cake" class="w-8 h-8 text-[#4A5D23]/40" />
                </div>
                <div class="flex-1">
                  <input type="file" ref="fileInput" accept="image/*" @change="handleFileChange" class="hidden" />
                  <button type="button" @click="fileInput?.click()" class="px-4 py-2 bg-[#F4F1E1] border border-[#4A5D23]/20 rounded-xl text-xs font-bold text-[#4A5D23] hover:bg-[#e6e2cc] transition-all flex items-center gap-2 shadow-sm">
                    <Icon name="lucide:upload" class="w-3.5 h-3.5" />
                    {{ previewUrl ? 'Cambiar Foto' : 'Subir Foto' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Nombre -->
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Nombre</label>
              <input v-model="newProduct.name" type="text" required placeholder="Ej. Torta de Chocolate" class="w-full bg-[#F4F1E1]/30 border border-[#4A5D23]/20 rounded-xl px-4 py-2.5 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23] transition-colors" />
            </div>

            <!-- Precio & Stock -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Precio (S/)</label>
                <input v-model="newProduct.price" type="number" step="0.01" min="0" placeholder="0.00" class="w-full bg-[#F4F1E1]/30 border border-[#4A5D23]/20 rounded-xl px-4 py-2.5 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23] transition-colors" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Stock</label>
                <input v-model="newProduct.stock" type="number" min="0" placeholder="0" class="w-full bg-[#F4F1E1]/30 border border-[#4A5D23]/20 rounded-xl px-4 py-2.5 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23] transition-colors" />
              </div>
            </div>

            <div class="pt-4 flex justify-end gap-3 border-t border-[#4A5D23]/10">
              <button type="button" @click="closeModal" class="px-5 py-2.5 rounded-xl border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] transition-all">
                Cancelar
              </button>
              <button type="submit" :disabled="isSubmitting" class="px-6 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm flex items-center gap-2">
                <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                <span>{{ isSubmitting ? 'Guardando...' : (productToEdit ? 'Actualizar' : 'Crear Producto') }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>
