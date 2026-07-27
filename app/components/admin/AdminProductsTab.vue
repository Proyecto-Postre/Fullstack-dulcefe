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

// Modal State
const showModal = ref(false)
const productToEdit = ref<any | null>(null)

function openNewProductModal() {
  productToEdit.value = null
  showModal.value = true
}

function handleEditProduct(item: any) {
  productToEdit.value = item
  showModal.value = true
}

function handleProductSaved(savedProduct: any, isNew: boolean) {
  emit('refresh')
  if (isNew) {
    emit('view-recipe', savedProduct)
  }
}

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

const paginatedCatalog = computed(() => {
  if (!props.catalog?.data) return []
  // Solo mostrar en vitrina los productos que ya tienen precio (publicados)
  const publishedProducts = props.catalog.data.filter((p: any) => p.price > 0)
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return publishedProducts.slice(start, end)
})

const totalPages = computed(() => {
  if (!props.catalog?.data) return 1
  const publishedProducts = props.catalog.data.filter((p: any) => p.price > 0)
  return Math.ceil(publishedProducts.length / itemsPerPage)
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
  <div class="space-y-6">
    <!-- Catálogo Completo -->
    <section class="bg-white p-8 rounded-[2rem] border border-[#4A5D23]/10 shadow-sm transition-all duration-300">
      <div class="flex items-center justify-between mb-8 pb-4 border-b border-[#4A5D23]/10">
        <div class="flex items-center gap-3">
          <Icon name="lucide:library-big" class="w-5 h-5 text-[#4A5D23]" />
          <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Catálogo Publicado</h2>
        </div>
        <div class="flex items-center gap-4">
          <button @click="emit('refresh')" class="text-[#4A5D23]/60 hover:text-[#4A5D23] transition-colors" title="Actualizar">
            <Icon name="lucide:refresh-cw" :class="['w-5 h-5', pendingCatalog ? 'animate-spin' : '']" />
          </button>
          <button @click="openNewProductModal" class="bg-[#4A5D23] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#3C4A1C] transition-colors shadow-sm flex items-center gap-2">
            <Icon name="lucide:plus" class="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div v-if="pendingCatalog" class="flex justify-center py-12">
        <Icon name="lucide:loader-2" class="w-8 h-8 animate-spin text-[#4A5D23]" />
      </div>

      <div v-else-if="!catalog?.data?.length" class="text-center py-12 bg-[#F4F1E1]/30 rounded-2xl border border-dashed border-[#4A5D23]/20">
        <Icon name="lucide:cake-slice" class="w-12 h-12 text-[#4A5D23]/20 mx-auto mb-4" />
        <p class="text-[#4A5D23] font-medium">No hay productos en el catálogo.</p>
        <button @click="openNewProductModal" class="mt-4 text-sm font-bold text-[#4A5D23] hover:underline">
          Crear el primer producto
        </button>
      </div>

      <div v-else class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest border-b border-[#4A5D23]/10">
              <th class="pb-4 pl-4">Producto</th>
              <th class="pb-4 text-center">Precio</th>
              <th class="pb-4 text-center">Stock</th>
              <th class="pb-4 text-right pr-4">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#4A5D23]/10">
            <tr v-for="item in paginatedCatalog" :key="item.id" class="hover:bg-[#F4F1E1]/30 transition-colors group">
              <td class="py-4 pl-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-white border border-[#4A5D23]/10 overflow-hidden shrink-0 shadow-sm flex items-center justify-center text-[#4A5D23]/50">
                    <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                    <Icon v-else :name="getProductIcon(item.name)" class="w-5 h-5" />
                  </div>
                  <span class="font-bold text-[#2A321B]">{{ item.name }}</span>
                </div>
              </td>
              <td class="py-4 text-center font-bold text-[#2A321B]">
                S/ {{ Number(item.price).toFixed(2) }}
              </td>
              <td class="py-4 text-center">
                <span v-if="item.stock > 5" class="px-3 py-1 rounded-md text-xs font-bold bg-white border border-[#4A5D23]/20 text-[#4A5D23]">
                  {{ item.stock }}
                </span>
                <span v-else-if="item.stock > 0" class="px-3 py-1 rounded-md text-xs font-bold bg-amber-50 border border-amber-200 text-amber-700">
                  {{ item.stock }}
                </span>
                <span v-else class="px-3 py-1 rounded-md text-xs font-bold bg-red-50 border border-red-200 text-red-700">
                  Agotado
                </span>
              </td>
              <td class="py-4 text-right pr-4">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="emit('view-recipe', item)" class="w-8 h-8 rounded-full bg-white border border-[#4A5D23]/20 text-[#4A5D23] flex items-center justify-center hover:bg-[#4A5D23] hover:text-white transition-colors" title="Ver Receta">
                    <Icon name="lucide:chef-hat" class="w-4 h-4" />
                  </button>
                  <button @click="handleEditProduct(item)" class="w-8 h-8 rounded-full bg-white border border-[#4A5D23]/20 text-[#4A5D23] flex items-center justify-center hover:bg-[#4A5D23] hover:text-white transition-colors" title="Editar">
                    <Icon name="lucide:pencil" class="w-4 h-4" />
                  </button>
                  <button @click="handleDeleteProduct(item.id, item.name)" class="w-8 h-8 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors" title="Eliminar">
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Paginación -->
      <div v-if="totalPages > 1" class="flex items-center justify-between mt-6 pt-6 border-t border-[#4A5D23]/10">
        <span class="text-xs font-bold text-[#4A5D23] uppercase tracking-widest">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <div class="flex gap-2">
          <button 
            @click="prevPage" 
            :disabled="currentPage === 1"
            class="px-4 py-2 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] hover:bg-[#F4F1E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Icon name="lucide:chevron-left" class="w-4 h-4" />
            Atrás
          </button>
          <button 
            @click="nextPage" 
            :disabled="currentPage === totalPages"
            class="px-4 py-2 rounded-xl border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] hover:bg-[#F4F1E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            Siguiente
            <Icon name="lucide:chevron-right" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>

    <!-- Modal de Producto -->
    <AdminProductModal 
      :show="showModal"
      :productToEdit="productToEdit"
      @close="showModal = false"
      @saved="handleProductSaved"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  height: 6px;
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
