<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  show: boolean
  productToEdit?: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', product: any, isNew: boolean): void
}>()

const newProduct = ref({ id: '', name: '', price: '', stock: '', image_url: '' })
const isSubmitting = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

watch(() => props.show, (newVal) => {
  if (newVal) {
    if (props.productToEdit) {
      newProduct.value = { 
        id: props.productToEdit.id,
        name: props.productToEdit.name, 
        price: props.productToEdit.price, 
        stock: props.productToEdit.stock,
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

function closeModal() {
  emit('close')
}

function handleFileChange(event: any) {
  const file = event.target.files?.[0]
  if (file) {
    selectedFile.value = file
    previewUrl.value = URL.createObjectURL(file)
  } else {
    selectedFile.value = null
    previewUrl.value = null
  }
}

function triggerFileInput() {
  document.getElementById('productImageInputModal')?.click()
}

async function saveProduct() {
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
      const uploadRes: any = await $fetch('/api/products/upload', {
        method: 'POST',
        body: formData
      })
      if (uploadRes.success && uploadRes.url) {
        uploadedImageUrl = uploadRes.url
      }
    }

    const method = props.productToEdit ? 'PUT' : 'POST'
    const endpoint = props.productToEdit ? `/api/products/${props.productToEdit.id}` : '/api/products'
    
    const res: any = await $fetch(endpoint, {
      method,
      body: {
        name: newProduct.value.name,
        price: Number(newProduct.value.price || 0),
        stock: Number(newProduct.value.stock || 0),
        image_url: uploadedImageUrl
      }
    })
    
    const savedProduct = res.data && res.data[0] ? res.data[0] : newProduct.value
    emit('saved', savedProduct, !props.productToEdit)
    closeModal()
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Error al guardar producto.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
    <div class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm" @click="closeModal"></div>
    
    <div class="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop border border-[#4A5D23]/10">
      <div class="p-5 sm:p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-playfair font-black text-[#2A321B]">
            {{ productToEdit ? 'Editar Producto' : 'Nuevo Producto' }}
          </h3>
          <button @click="closeModal" class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm">
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>

        <div v-if="errorMessage" class="mb-4 bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-sm flex items-start gap-2">
          <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0 mt-0.5" />
          <span>{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="saveProduct" class="space-y-5">
          <!-- Imagen -->
          <div class="group">
            <div 
              @click="triggerFileInput"
              class="w-full h-48 border-2 border-dashed border-[#4A5D23]/20 rounded-2xl bg-[#F4F1E1]/50 hover:bg-[#F4F1E1] hover:border-[#4A5D23]/40 transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden relative"
            >
              <input type="file" id="productImageInputModal" accept="image/*" class="hidden" @change="handleFileChange" />
              <template v-if="previewUrl">
                <img :src="previewUrl" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div class="absolute inset-0 bg-[#2A321B]/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-[2px]">
                  <div class="flex items-center gap-2 bg-white text-[#2A321B] px-4 py-2 rounded-xl font-bold text-sm shadow-sm">
                    <Icon name="lucide:camera" class="w-4 h-4" />
                    Cambiar Foto
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="w-14 h-14 rounded-full bg-white border border-[#4A5D23]/10 flex items-center justify-center text-[#4A5D23]/40 mb-3 shadow-sm group-hover:scale-110 group-hover:text-[#4A5D23] transition-all">
                  <Icon name="lucide:image-plus" class="w-6 h-6" />
                </div>
                <span class="text-sm font-bold text-[#4A5D23]/60 group-hover:text-[#4A5D23] transition-colors">Subir fotografía</span>
                <span class="text-[10px] text-[#4A5D23]/40 mt-1">PNG, JPG hasta 5MB</span>
              </template>
            </div>
          </div>

          <!-- Nombre -->
          <div>
            <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Nombre del postre</label>
            <input 
              v-model="newProduct.name"
              type="text" 
              required
              placeholder="Ej: Box Brownies x6"
              class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30"
            />
          </div>

          <div v-if="productToEdit" class="grid grid-cols-2 gap-4">
            <!-- Precio -->
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Precio (S/)</label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 font-black text-sm">S/</span>
                <input 
                  v-model="newProduct.price"
                  type="number" 
                  step="0.01"
                  required
                  placeholder="0.00"
                  class="w-full pl-8 pr-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30 [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>

            <!-- Stock -->
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Stock Inicial</label>
              <input 
                v-model="newProduct.stock"
                type="number" 
                min="0"
                placeholder="0"
                class="w-full px-3 py-2.5 bg-[#F4F1E1]/30 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:bg-white focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all placeholder:text-[#4A5D23]/30 [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          <button 
            type="submit" 
            :disabled="isSubmitting" 
            class="w-full bg-[#4A5D23] border border-transparent text-white font-bold py-3 rounded-xl mt-4 shadow-sm transition-all duration-300 active:translate-y-0.5 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#3C4A1C] text-sm"
          >
            <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            {{ isSubmitting ? 'Guardando...' : (productToEdit ? 'Guardar Cambios' : 'Crear y Costear') }}
            <Icon v-if="!isSubmitting && !productToEdit" name="lucide:arrow-right" class="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes pop {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
