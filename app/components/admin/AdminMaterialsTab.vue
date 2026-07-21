<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  materials: any
  pendingMaterials: boolean
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()

const newMaterial = ref({ name: '', unit: 'g', purchase_price: '', purchase_quantity: '', stock: '' })
const editingMaterialId = ref<string | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')

// Pagination
const currentPage = ref(1)
const itemsPerPage = 6

const paginatedMaterials = computed(() => {
  if (!props.materials?.data) return []
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return props.materials.data.slice(start, end)
})

const totalPages = computed(() => {
  if (!props.materials?.data) return 1
  return Math.ceil(props.materials.data.length / itemsPerPage)
})

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

watch(() => props.materials?.data?.length, () => {
  currentPage.value = 1
})

async function handleCreateMaterial() {
  if (!newMaterial.value.name || !newMaterial.value.purchase_price || !newMaterial.value.purchase_quantity) {
    errorMessage.value = 'Completa el precio y la cantidad del paquete.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const method = editingMaterialId.value ? 'PUT' : 'POST'
    const endpoint = editingMaterialId.value ? `/api/raw-materials/${editingMaterialId.value}` : '/api/raw-materials'

    await $fetch(endpoint, {
      method,
      body: {
        name: newMaterial.value.name,
        unit: newMaterial.value.unit,
        purchase_price: Number(newMaterial.value.purchase_price),
        purchase_quantity: Number(newMaterial.value.purchase_quantity),
        stock: Number(newMaterial.value.stock || 0)
      }
    })
    
    cancelEditMaterial()
    emit('refresh')
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Error al guardar insumo.'
  } finally {
    isSubmitting.value = false
  }
}

function handleEditMaterial(item: any) {
  errorMessage.value = ''
  editingMaterialId.value = item.id
  newMaterial.value = { 
    name: item.name, 
    unit: item.unit, 
    purchase_price: item.purchase_price, 
    purchase_quantity: item.purchase_quantity, 
    stock: item.stock 
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditMaterial() {
  editingMaterialId.value = null
  newMaterial.value = { name: '', unit: 'g', purchase_price: '', purchase_quantity: '', stock: '' }
  errorMessage.value = ''
}

async function handleDeleteMaterial(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del inventario de insumos?`)) return
  try {
    await $fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
    emit('refresh')
  } catch (err: any) {
    alert('Error al eliminar: ' + (err.data?.statusMessage || err.message))
  }
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div v-if="errorMessage" class="col-span-full mb-4 bg-white border-2 border-red-800 text-red-900 p-4 rounded-xl text-sm flex items-start gap-3 shadow-[4px_4px_0px_#991B1B]">
      <Icon name="lucide:triangle-alert" class="w-5 h-5 shrink-0 mt-0.5" />
      <span class="font-medium leading-relaxed">{{ errorMessage }}</span>
    </div>

    <!-- COLUMNA IZQUIERDA: Formulario para Agregar/Editar Insumo -->
    <section class="bg-white p-8 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] h-fit transition-all duration-300">
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
        <div class="flex items-center gap-3">
          <Icon :name="editingMaterialId ? 'lucide:pencil' : 'lucide:package-plus'" class="w-5 h-5 text-[#4A5D23]" />
          <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">
            {{ editingMaterialId ? 'Editar Insumo' : 'Nuevo Insumo' }}
          </h2>
        </div>
        <span v-if="editingMaterialId" class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border border-amber-200">
          Modo Edición
        </span>
      </div>
      
      <form @submit.prevent="handleCreateMaterial" class="space-y-5">
        <div>
          <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Nombre del Insumo</label>
          <input 
            v-model="newMaterial.name"
            type="text" 
            required
            placeholder="Ej: Harina / Caja x6"
            class="w-full px-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-medium text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Unidad</label>
            <CustomSelect 
              v-model="newMaterial.unit"
              :options="[
                { label: 'Gramos (g)', value: 'g' },
                { label: 'Kilos (kg)', value: 'kg' },
                { label: 'Mililitros (ml)', value: 'ml' },
                { label: 'Litros (l)', value: 'l' },
                { label: 'Unidades (und)', value: 'und' }
              ]"
              bgClass="bg-white"
            />
          </div>
          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Stock Actual</label>
            <input 
              v-model="newMaterial.stock"
              type="number" 
              placeholder="0"
              class="w-full px-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
            />
          </div>
        </div>

        <!-- Datos de compra styled -->
        <div class="bg-[#F4F1E1]/50 p-5 rounded-2xl border-2 border-[#4A5D23]/20 space-y-4">
          <div class="flex items-center gap-2 mb-2">
             <Icon name="lucide:badge-dollar-sign" class="w-4 h-4 text-[#4A5D23]" />
             <span class="text-[11px] font-black text-[#4A5D23] uppercase tracking-widest block">Datos de Compra</span>
          </div>
          
          <div class="grid grid-cols-2 gap-4 items-end">
            <div>
              <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2 truncate">Precio Pagado</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 font-bold text-sm">S/</span>
                <input 
                  v-model="newMaterial.purchase_price"
                  type="number" 
                  step="0.10"
                  required
                  placeholder="0.00"
                  class="w-full pl-10 pr-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
                />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2 truncate">
                Cantidad <span v-if="newMaterial.unit" class="lowercase">({{ newMaterial.unit }})</span>
              </label>
              <input 
                v-model="newMaterial.purchase_quantity"
                type="number" 
                step="0.01"
                required
                placeholder="Ej: 1000"
                class="w-full px-4 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
              />
            </div>
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
              <Icon v-else :name="editingMaterialId ? 'lucide:save' : 'lucide:plus'" class="w-4 h-4 transition-transform group-hover:scale-110" />
              {{ isSubmitting ? 'Procesando...' : (editingMaterialId ? 'Guardar Cambios' : 'Guardar Insumo') }}
            </span>
          </button>
          
          <button 
            v-if="editingMaterialId"
            type="button"
            @click="cancelEditMaterial"
            class="relative inline-flex items-center justify-center px-5 py-3.5 text-sm font-bold text-[#2A321B] bg-white hover:bg-gray-50 border border-[#2A321B] rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_#2A321B] active:translate-y-1 active:shadow-none"
          >
            Cancelar
          </button>
        </div>
      </form>
    </section>

    <!-- COLUMNA DERECHA: Tabla de Insumos -->
    <section class="lg:col-span-2 bg-white p-8 pb-5 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] transition-all duration-300 flex flex-col">
      <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
        <div class="flex items-center gap-3">
          <Icon name="lucide:calculator" class="w-5 h-5 text-[#4A5D23]" />
          <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Cálculo de Costos Unitarios</h2>
        </div>
        
        <button @click="$emit('refresh')" class="w-8 h-8 rounded-lg text-[#4A5D23] hover:bg-[#F4F1E1] flex items-center justify-center transition-all duration-300" title="Actualizar">
          <Icon name="lucide:refresh-cw" :class="['w-4 h-4', pendingMaterials ? 'animate-spin' : '']" />
        </button>
      </div>

      <!-- State: Loading -->
      <div v-if="pendingMaterials && (!materials?.data)" class="flex flex-col items-center justify-center py-16">
        <div class="relative w-12 h-12 mb-4 text-[#4A5D23]">
           <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
        </div>
        <p class="text-[11px] font-bold tracking-widest uppercase text-[#4A5D23] animate-pulse">Calculando costos...</p>
      </div>

      <!-- State: Empty -->
      <div v-else-if="!materials?.data || materials.data.length === 0" class="text-center py-20 bg-[#F4F1E1] rounded-3xl border-2 border-[#4A5D23] shadow-[4px_4px_0px_#4A5D23] m-4">
        <Icon name="lucide:package-open" class="w-12 h-12 text-[#4A5D23]/50 mx-auto mb-4" />
        <h3 class="text-lg font-playfair font-bold text-[#2A321B] mb-2 tracking-tight">Sin Insumos Registrados</h3>
        <p class="text-[#4A5D23]/80 font-medium text-sm max-w-sm mx-auto text-balance leading-relaxed">
          Agrega tu primer insumo en el formulario para comenzar a calcular tus costos reales.
        </p>
      </div>

      <!-- State: Table Grid -->
      <div v-else class="flex-1 flex flex-col overflow-x-auto">
        <table class="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr class="border-b-2 border-[#4A5D23]/20 text-[10px] uppercase tracking-widest text-[#4A5D23]/80 font-bold">
              <th class="py-4 px-4">Insumo</th>
              <th class="py-4 px-4">Compra</th>
              <th class="py-4 px-4 text-center">Stock</th>
              <th class="py-4 px-4 bg-[#F4F1E1]/50 text-[#4A5D23] text-right rounded-t-lg">Costo Unitario</th>
              <th class="py-4 px-4 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#4A5D23]/10 text-sm">
            <tr v-for="mat in paginatedMaterials" :key="mat.id" class="group hover:bg-[#F4F1E1]/50 transition-colors duration-200">
              <td class="py-4 px-4 font-medium text-[#2A321B] flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-white border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23] group-hover:border-[#4A5D23] transition-all">
                  <Icon name="lucide:box" class="w-3.5 h-3.5" />
                </div>
                {{ mat.name }}
              </td>
              <td class="py-4 px-4 text-xs">
                <span class="font-bold text-[#2A321B]">S/ {{ Number(mat.purchase_price).toFixed(2) }}</span>
                <span class="text-[#4A5D23]/60 block mt-0.5">por {{ mat.purchase_quantity }}{{ mat.unit }}</span>
              </td>
              <td class="py-4 px-4 text-center">
                <span class="inline-flex items-center justify-center px-3 py-1 rounded-md text-[11px] font-bold tracking-wide border-2 bg-white text-[#4A5D23] border-[#4A5D23] shadow-[2px_2px_0px_#4A5D23]">
                  {{ mat.stock }} {{ mat.unit }}
                </span>
              </td>
              <td class="py-4 px-4 bg-[#F4F1E1]/30 text-right font-inter group-hover:bg-[#F4F1E1]/80 transition-colors">
                <div class="font-black text-[#2A321B]">
                  <span class="text-[#4A5D23]/60 text-xs mr-0.5">S/</span>{{ Number(mat.cost_per_unit || (mat.purchase_price / mat.purchase_quantity)).toFixed(2) }}
                </div>
                <span class="text-[#4A5D23]/60 text-[10px] font-bold block mt-0.5">por {{ mat.unit }}</span>
              </td>
              <td class="py-4 px-4">
                <div class="flex items-center justify-end gap-2">
                  <button 
                    @click="handleEditMaterial(mat)"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#4A5D23] hover:text-[#2A321B] hover:bg-[#F4F1E1] hover:shadow-[2px_2px_0px_#4A5D23] hover:border hover:border-[#4A5D23] transition-all duration-300 focus:outline-none"
                    title="Editar insumo"
                  >
                    <Icon name="lucide:pencil" class="w-4 h-4" />
                  </button>
                  <button 
                    @click="handleDeleteMaterial(mat.id, mat.name)"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-700 hover:text-white hover:bg-red-800 hover:shadow-[2px_2px_0px_#991B1B] hover:border hover:border-[#4A0000] transition-all duration-300 focus:outline-none"
                    title="Eliminar insumo"
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
