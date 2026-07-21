<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  catalog: any
  pendingCatalog: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'view-recipe', product: any): void
}>()

const newProduct = ref({ name: '', price: '', stock: '', image_url: '' })
const editingProductId = ref<string | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

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
  document.getElementById('productImageInput')?.click()
}

// Pagination
const currentPage = ref(1)
const itemsPerPage = 6

const paginatedCatalog = computed(() => {
  if (!props.catalog?.data) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.catalog.data.slice(start, end)
})

const totalPages = computed(() => {
  if (!props.catalog?.data) return 1
  return Math.ceil(props.catalog.data.length / itemsPerPage)
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

watch(() => props.catalog?.data?.length, () => {
  currentPage.value = 1
})

async function handleCreateProduct() {
  if (!newProduct.value.name || !newProduct.value.price) {
    errorMessage.value = 'El nombre y el precio son obligatorios.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    // 1. Si hay una imagen seleccionada, la subimos primero a Cloudinary
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

    // 2. Guardamos el producto en Supabase
    const method = editingProductId.value ? 'PUT' : 'POST'
    const endpoint = editingProductId.value ? `/api/products/${editingProductId.value}` : '/api/products'
    
    await $fetch(endpoint, {
      method,
      body: {
        name: newProduct.value.name,
        price: Number(newProduct.value.price),
        stock: Number(newProduct.value.stock || 0),
        image_url: uploadedImageUrl
      }
    })
    
    cancelEditProduct()
    emit('refresh')
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Error al guardar producto.'
  } finally {
    isSubmitting.value = false
  }
}

function handleEditProduct(item: any) {
  errorMessage.value = ''
  editingProductId.value = item.id
  newProduct.value = { 
    name: item.name, 
    price: item.price, 
    stock: item.stock,
    image_url: item.image_url || ''
  }
  selectedFile.value = null
  previewUrl.value = item.image_url || null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditProduct() {
  editingProductId.value = null
  newProduct.value = { name: '', price: '', stock: '', image_url: '' }
  errorMessage.value = ''
  selectedFile.value = null
  previewUrl.value = null
}

async function handleDeleteProduct(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) return
  try {
    await $fetch(`/api/products/${id}`, { method: 'DELETE' })
    emit('refresh')
  } catch (err: any) {
    alert('Error al eliminar: ' + (err.data?.statusMessage || err.message))
  }
}

function getProductIcon(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('brownie') || n.includes('box') || n.includes('caja')) return 'lucide:package'
  if (n.includes('alfajor') || n.includes('galleta') || n.includes('cookie')) return 'lucide:cookie'
  if (n.includes('torta') || n.includes('pastel') || n.includes('cake') || n.includes('keke') || n.includes('queque')) return 'lucide:cake-slice'
  if (n.includes('pie') || n.includes('tart') || n.includes('kuchen')) return 'lucide:pie-chart'
  if (n.includes('cafe') || n.includes('café') || n.includes('coffee')) return 'lucide:coffee'
  if (n.includes('helado') || n.includes('ice cream')) return 'lucide:ice-cream'
  return 'lucide:croissant'
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div v-if="errorMessage" class="col-span-full mb-4 bg-white border-2 border-red-800 text-red-900 p-4 rounded-xl text-sm flex items-start gap-3 shadow-[4px_4px_0px_#991B1B]">
      <Icon name="lucide:triangle-alert" class="w-5 h-5 shrink-0 mt-0.5" />
      <span class="font-medium leading-relaxed">{{ errorMessage }}</span>
    </div>

    <!-- COLUMNA IZQUIERDA: Formulario para Agregar/Editar Pastel -->
    <section class="bg-white p-8 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] h-fit transition-all duration-300">
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
        <div class="flex items-center gap-3">
          <Icon :name="editingProductId ? 'lucide:pencil' : 'lucide:plus-circle'" class="w-5 h-5 text-[#4A5D23]" />
          <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">
            {{ editingProductId ? 'Editar Producto' : 'Nuevo Producto' }}
          </h2>
        </div>
        <span v-if="editingProductId" class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-amber-200">
          Modo Edición
        </span>
      </div>

      <form @submit.prevent="handleCreateProduct" class="space-y-5">
        
        <!-- Zona de subida de imagen -->
        <div>
          <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Fotografía (Opcional)</label>
          <div 
            @click="triggerFileInput"
            class="w-full h-32 border-2 border-dashed border-[#4A5D23]/30 rounded-xl bg-[#F4F1E1]/30 hover:bg-[#F4F1E1] transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden relative group"
          >
            <input 
              type="file" 
              id="productImageInput" 
              accept="image/*" 
              class="hidden" 
              @change="handleFileChange" 
            />
            
            <template v-if="previewUrl">
              <img :src="previewUrl" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span class="text-white text-xs font-bold bg-[#2A321B]/80 px-3 py-1.5 rounded-lg border border-white/20">Cambiar Foto</span>
              </div>
            </template>
            <template v-else>
              <div class="w-10 h-10 rounded-full bg-white border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23]/50 mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <Icon name="lucide:camera" class="w-5 h-5" />
              </div>
              <span class="text-xs font-medium text-[#4A5D23]/60 group-hover:text-[#4A5D23] transition-colors">Haz clic para subir una foto</span>
            </template>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Nombre del postre</label>
          <input 
            v-model="newProduct.name"
            type="text" 
            required
            placeholder="Ej: Box Brownies x6"
            class="w-full px-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-medium text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Precio (S/)</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 font-bold text-sm">S/</span>
              <input 
                v-model="newProduct.price"
                type="number" 
                step="0.10"
                required
                placeholder="0.00"
                class="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Stock Inicial</label>
            <input 
              v-model="newProduct.stock"
              type="number" 
              placeholder="0"
              class="w-full px-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
            />
          </div>
        </div>

        <div class="flex gap-3 mt-2">
          <button 
            type="submit"
            :disabled="isSubmitting"
            class="flex-1 group relative inline-flex items-center justify-center px-5 py-3.5 text-sm font-bold text-[#F4F1E1] bg-[#4A5D23] hover:bg-[#3C4A1C] border border-[#2A321B] rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_#2A321B] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="relative z-10 flex items-center gap-2">
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else :name="editingProductId ? 'lucide:save' : 'lucide:plus'" class="w-4 h-4 transition-transform group-hover:scale-110" />
              {{ isSubmitting ? 'Procesando...' : (editingProductId ? 'Guardar Cambios' : 'Agregar al Catálogo') }}
            </span>
          </button>
          
          <button 
            v-if="editingProductId"
            type="button"
            @click="cancelEditProduct"
            class="relative inline-flex items-center justify-center px-5 py-3.5 text-sm font-bold text-[#2A321B] bg-white hover:bg-gray-50 border border-[#2A321B] rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_#2A321B] active:translate-y-1 active:shadow-none"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>

    <!-- COLUMNA DERECHA: Tabla de Inventario -->
    <section class="lg:col-span-2 bg-white p-8 pb-5 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] transition-all duration-300 flex flex-col">
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
        <div class="flex items-center gap-3">
          <Icon name="lucide:library" class="w-5 h-5 text-[#4A5D23]" />
          <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Inventario Actual</h2>
        </div>
        
        <button @click="$emit('refresh')" class="w-8 h-8 rounded-lg text-[#4A5D23] hover:bg-[#F4F1E1] flex items-center justify-center transition-all duration-300" title="Actualizar">
          <Icon name="lucide:refresh-cw" :class="['w-4 h-4', pendingCatalog ? 'animate-spin' : '']" />
        </button>
      </div>

      <!-- State: Loading -->
      <div v-if="pendingCatalog && (!catalog?.data)" class="flex flex-col items-center justify-center py-16">
        <div class="relative w-12 h-12 mb-4 text-[#4A5D23]">
           <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
        </div>
        <p class="text-[11px] font-bold tracking-widest uppercase text-[#4A5D23] animate-pulse">Cargando inventario...</p>
      </div>

      <!-- State: Empty -->
      <div v-else-if="!catalog?.data || catalog.data.length === 0" class="text-center py-20 bg-[#F4F1E1] rounded-3xl border-2 border-[#4A5D23] shadow-[4px_4px_0px_#4A5D23] m-4">
        <Icon name="lucide:inbox" class="w-12 h-12 text-[#4A5D23]/50 mx-auto mb-4" />
        <h3 class="text-lg font-playfair font-bold text-[#2A321B] mb-2 tracking-tight">Inventario vacío</h3>
        <p class="text-[#4A5D23]/80 font-medium text-sm max-w-sm mx-auto text-balance leading-relaxed">
          Aún no tienes productos registrados. Utiliza el formulario de la izquierda para agregar tu primera creación.
        </p>
      </div>

      <!-- State: Table Grid -->
      <div v-else class="flex-1 flex flex-col overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="border-b-2 border-[#4A5D23]/20 text-[10px] uppercase tracking-widest text-[#4A5D23]/80 font-bold">
              <th class="py-4 px-4">Producto</th>
              <th class="py-4 px-4 text-right">Precio</th>
              <th class="py-4 px-4 text-center">Stock</th>
              <th class="py-4 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#4A5D23]/10 text-sm">
            <tr v-for="item in paginatedCatalog" :key="item.id" class="group hover:bg-[#F4F1E1]/50 transition-colors duration-200">
              <td class="py-4 px-4 font-medium text-[#2A321B] flex items-center gap-3">
                <div v-if="item.image_url" class="w-8 h-8 rounded-full border-2 border-[#4A5D23] overflow-hidden shadow-[2px_2px_0px_#4A5D23] shrink-0">
                  <img :src="item.image_url" :alt="item.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-8 h-8 rounded-full bg-white border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23] group-hover:border-[#4A5D23] transition-all shrink-0">
                  <Icon :name="getProductIcon(item.name)" class="w-3.5 h-3.5" />
                </div>
                <span class="truncate max-w-[150px]">{{ item.name }}</span>
              </td>
              <td class="py-4 px-4 text-right font-inter">
                <span class="text-[#4A5D23]/60 text-xs mr-0.5">S/</span>
                <span class="font-bold text-[#2A321B]">{{ Number(item.price).toFixed(2) }}</span>
              </td>
              <td class="py-4 px-4 text-center">
                <span 
                  :class="[
                    'inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-bold tracking-wide border-2',
                    item.stock > 5 ? 'bg-white text-[#4A5D23] border-[#4A5D23] shadow-[2px_2px_0px_#4A5D23]' : 
                    item.stock > 0 ? 'bg-white text-amber-700 border-amber-700 shadow-[2px_2px_0px_#B45309]' : 
                    'bg-white text-red-800 border-red-800 shadow-[2px_2px_0px_#991B1B]'
                  ]"
                >
                  {{ item.stock > 0 ? item.stock : 'Agotado' }}
                </span>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="$emit('view-recipe', item)"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#4A5D23] hover:text-[#2A321B] hover:bg-[#F4F1E1] hover:shadow-[2px_2px_0px_#4A5D23] hover:border hover:border-[#4A5D23] transition-all duration-300 focus:outline-none"
                    title="Ver Receta"
                  >
                    <Icon name="lucide:chef-hat" class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleEditProduct(item)"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#4A5D23] hover:text-[#2A321B] hover:bg-[#F4F1E1] hover:shadow-[2px_2px_0px_#4A5D23] hover:border hover:border-[#4A5D23] transition-all duration-300 focus:outline-none"
                    title="Editar producto"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleDeleteProduct(item.id, item.name)"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-700 hover:text-white hover:bg-red-800 hover:shadow-[2px_2px_0px_#991B1B] hover:border hover:border-[#4A0000] transition-all duration-300 focus:outline-none"
                    title="Eliminar producto"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination Controls -->
        <div v-if="totalPages > 1" class="flex items-center justify-between mt-auto pt-6 px-4 py-3 bg-[#F4F1E1]/50 rounded-2xl border-2 border-[#4A5D23]/20">
          <p class="text-xs font-bold text-[#4A5D23]/80 uppercase tracking-widest">
            Página {{ currentPage }} de {{ totalPages }}
          </p>
          <div class="flex items-center gap-3">
            <button 
              @click="prevPage" 
              :disabled="currentPage === 1"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 border-2 shadow-[2px_2px_0px_rgba(74,93,35,1)] text-[#2A321B] bg-white border-[#2A321B] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
            >
              <Icon name="lucide:chevron-left" class="w-4 h-4" />
              Atrás
            </button>
            <button 
              @click="nextPage" 
              :disabled="currentPage === totalPages"
              class="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 border-2 shadow-[2px_2px_0px_rgba(74,93,35,1)] text-[#2A321B] bg-white border-[#2A321B] hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
            >
              Siguiente
              <Icon name="lucide:chevron-right" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
