<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps<{
  catalog: any
  materials: any
  modelValue: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: any): void
  (e: 'refresh-catalog'): void
}>()

const activeProduct = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// ── Refs: ALL declared before any watch ──
const recipeItems = ref<any[]>([])
const recipeTotalCost = ref(0)
const additionalCosts = ref({ packaging: 0, utilities: 0, labor: 0 })
const newRecipeItem = ref({ raw_material_id: '', quantity_used: '' })
const isSubmittingRecipe = ref(false)
const recipeErrorMessage = ref('')
const pendingRecipe = ref(false)
const isExporting = ref(false)
const publishData = ref({ price: 0, stock: 0 })
const isPublishing = ref(false)
const showModal = ref(false)

// ── Computed ──
const computedTotalCost = computed(() => {
  return recipeTotalCost.value + Number(additionalCosts.value.packaging || 0) + Number(additionalCosts.value.utilities || 0) + Number(additionalCosts.value.labor || 0)
})

const selectedMaterialUnit = computed(() => {
  if (!newRecipeItem.value.raw_material_id || !props.materials?.data) return ''
  const mat = props.materials.data.find((m: any) => m.id === newRecipeItem.value.raw_material_id)
  return mat ? mat.unit : ''
})

// ── Recipe API ──
async function fetchRecipe() {
  if (!activeProduct.value?.id) return
  pendingRecipe.value = true
  recipeErrorMessage.value = ''
  additionalCosts.value = { packaging: 0, utilities: 0, labor: 0 }
  try {
    const res = await $fetch(`/api/recipes/${activeProduct.value.id}`)
    if (res && res.success) {
      recipeItems.value = res.data
      recipeTotalCost.value = res.total_cost
    }
  } catch (err: any) {
    recipeErrorMessage.value = err.data?.statusMessage || 'Error al cargar receta.'
  } finally {
    pendingRecipe.value = false
  }
}

async function handleAddRecipeItem() {
  if (!newRecipeItem.value.raw_material_id || !newRecipeItem.value.quantity_used) {
    recipeErrorMessage.value = 'Selecciona un insumo e ingresa la cantidad.'
    return
  }
  isSubmittingRecipe.value = true
  recipeErrorMessage.value = ''
  try {
    await $fetch('/api/recipes', {
      method: 'POST',
      body: {
        product_id: activeProduct.value.id,
        raw_material_id: newRecipeItem.value.raw_material_id,
        quantity_used: Number(newRecipeItem.value.quantity_used)
      }
    })
    newRecipeItem.value = { raw_material_id: '', quantity_used: '' }
    await fetchRecipe()
  } catch (err: any) {
    recipeErrorMessage.value = err.data?.statusMessage || 'Error al agregar insumo.'
  } finally {
    isSubmittingRecipe.value = false
  }
}

async function handleDeleteRecipeItem(id: string, name: string) {
  if (!confirm(`¿Estás seguro de quitar "${name}" de la receta?`)) return
  recipeErrorMessage.value = ''
  try {
    await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    await fetchRecipe()
  } catch (err: any) {
    recipeErrorMessage.value = err.data?.statusMessage || 'Error al quitar insumo.'
  }
}

// ── Export ──
function exportToExcel() {
  if (!activeProduct.value) return
  isExporting.value = true
  
  const params = new URLSearchParams({
    productId: activeProduct.value.id,
    packaging: additionalCosts.value.packaging.toString(),
    utilities: additionalCosts.value.utilities.toString(),
    labor: additionalCosts.value.labor.toString()
  })
  
  const url = `/api/recipes/export?${params.toString()}`
  window.location.href = url
  
  setTimeout(() => {
    isExporting.value = false
  }, 1000)
}

// ── Publish ──
async function publishProduct() {
  if (!activeProduct.value) return
  isPublishing.value = true
  try {
    const res: any = await $fetch(`/api/products/${activeProduct.value.id}`, {
      method: 'PUT',
      body: {
        name: activeProduct.value.name,
        price: Number(publishData.value.price),
        stock: Number(publishData.value.stock),
        image_url: activeProduct.value.image_url
      }
    })
    if (res.success) {
      activeProduct.value = null
      emit('refresh-catalog')
      alert('Producto actualizado y publicado en vitrina.')
    }
  } catch (err: any) {
    alert('Error al publicar: ' + (err.data?.statusMessage || err.message))
  } finally {
    isPublishing.value = false
  }
}

// ── Modal ──
function handleProductSaved(savedProduct: any, isNew: boolean) {
  emit('refresh-catalog')
  if (isNew && savedProduct?.id) {
    activeProduct.value = savedProduct
  }
}

// ── Watch: AFTER all refs are declared ──
watch(() => props.modelValue, (newVal) => {
  if (newVal?.id) {
    fetchRecipe()
    publishData.value.price = Number(newVal.price) || 0
    publishData.value.stock = Number(newVal.stock) || 0
  } else {
    recipeItems.value = []
    recipeTotalCost.value = 0
    additionalCosts.value = { packaging: 0, utilities: 0, labor: 0 }
    publishData.value = { price: 0, stock: 0 }
  }
}, { immediate: true })

</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <!-- COLUMNA IZQUIERDA: Selector y Formulario -->
    <div class="space-y-6 flex flex-col h-full">
      <!-- Selector de Producto -->
      <section class="bg-white p-6 rounded-[2rem] border border-[#4A5D23]/20 shadow-md transition-all duration-300">
        <h3 class="font-playfair font-bold text-lg text-[#2A321B] flex items-center gap-2 border-b border-dashed border-[#4A5D23]/30 pb-3 mb-4">
          <Icon name="lucide:cake-slice" class="w-4 h-4 text-[#4A5D23]" />
          Producto a Analizar
        </h3>
        
        <div class="flex items-center gap-2">
          <CustomSelect 
            v-model="activeProduct"
            :options="(catalog?.data || []).map((p: any) => ({ label: p.name, value: p }))"
            placeholder="Selecciona un producto del catálogo..."
            bgClass="bg-[#F4F1E1]"
            class="flex-1 min-w-0"
          />
          <button @click="showModal = true" class="w-12 h-12 shrink-0 bg-[#4A5D23] text-white rounded-xl flex items-center justify-center hover:bg-[#3C4A1C] transition-colors shadow-sm" title="Nuevo Producto">
            <Icon name="lucide:plus" class="w-5 h-5" />
          </button>
        </div>
      </section>

      <!-- Formulario Agregar Insumo (solo visible si hay producto) -->
      <section v-if="activeProduct" class="bg-white p-6 rounded-[2rem] border border-[#4A5D23]/20 shadow-md transition-all duration-300 flex-1">
        <div v-if="recipeErrorMessage" class="mb-4 bg-white border-2 border-red-800 text-red-900 p-3 rounded-xl text-sm flex items-start gap-3 shadow-sm">
          <Icon name="lucide:triangle-alert" class="w-4 h-4 shrink-0 mt-0.5" />
          <span class="font-medium leading-relaxed">{{ recipeErrorMessage }}</span>
        </div>

        <form @submit.prevent="handleAddRecipeItem" class="space-y-5">
          <h3 class="font-playfair font-bold text-lg text-[#2A321B] flex items-center gap-2 border-b border-dashed border-[#4A5D23]/30 pb-3 mb-2">
            <Icon name="lucide:plus-circle" class="w-4 h-4 text-[#4A5D23]" />
            Agregar Insumo
          </h3>
          
          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Insumo del Almacén</label>
            <CustomSelect 
              v-model="newRecipeItem.raw_material_id"
              :options="(materials?.data || []).map((m: any) => ({ label: `${m.name} (${m.unit})`, value: m.id }))"
              placeholder="Selecciona un insumo..."
              bgClass="bg-white"
            />
          </div>

          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-2">Cantidad Usada</label>
            <div class="relative">
              <input 
                v-model="newRecipeItem.quantity_used"
                type="number" 
                step="any"
                required
                :placeholder="`Ej: 150`"
                class="w-full px-4 py-3 bg-white rounded-xl border border-[#4A5D23]/20/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] placeholder:text-[#4A5D23]/30 transition-all"
              />
              <span class="absolute right-4 top-1/2 -translate-y-1/2 font-black text-[#4A5D23]/40 text-sm pointer-events-none">
                {{ selectedMaterialUnit }}
              </span>
            </div>
          </div>

          <button 
            type="submit"
            :disabled="isSubmittingRecipe"
            class="w-full group relative inline-flex items-center justify-center px-5 py-3 text-sm font-bold text-[#F4F1E1] bg-[#4A5D23] hover:bg-[#3C4A1C] text-white border-transparent rounded-xl overflow-hidden transition-all duration-300 shadow-sm active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            <span class="relative z-10 flex items-center gap-2">
              <Icon v-if="isSubmittingRecipe" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:plus" class="w-4 h-4 transition-transform group-hover:scale-110" />
              {{ isSubmittingRecipe ? 'Agregando...' : 'Agregar a la Receta' }}
            </span>
          </button>
        </form>
      </section>

      <!-- Publicación en Vitrina (Movido a la izquierda) -->
      <section v-if="activeProduct" class="bg-white p-6 rounded-[2rem] border border-[#4A5D23]/20 shadow-md transition-all duration-300">
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-[#4A5D23]/30">
          <div class="flex items-center gap-2">
            <Icon name="lucide:store" class="w-4 h-4 text-[#4A5D23]" />
            <h3 class="font-playfair font-bold text-lg text-[#2A321B]">Vitrina</h3>
          </div>
          <span v-if="activeProduct?.price > 0" class="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4A5D23]/10 text-[#4A5D23]">
            Publicado
          </span>
          <span v-else class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            Borrador
          </span>
        </div>

        <form @submit.prevent="publishProduct" class="space-y-4">
          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Precio Final (S/)</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 font-bold text-sm">S/</span>
              <input 
                v-model="publishData.price"
                type="number" 
                step="0.01"
                required
                class="w-full pl-8 pr-3 py-2.5 bg-[#F4F1E1]/50 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] transition-all"
              />
            </div>
            <p class="text-[9px] text-[#4A5D23]/70 mt-1 font-medium">Sugerido: S/ {{ (computedTotalCost * 1.428).toFixed(2) }}</p>
          </div>

          <div>
            <label class="block text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Stock Inicial</label>
            <input 
              v-model="publishData.stock"
              type="number" 
              min="0"
              required
              class="w-full px-3 py-2.5 bg-[#F4F1E1]/50 rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] transition-all"
            />
          </div>

          <button 
            type="submit" 
            :disabled="isPublishing" 
            class="w-full bg-[#4A5D23] text-white font-bold py-2.5 rounded-xl hover:bg-[#3C4A1C] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm mt-2"
          >
            <Icon v-if="isPublishing" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            {{ isPublishing ? 'Guardando...' : 'Guardar y Publicar' }}
          </button>
        </form>
      </section>
    </div>

    <!-- COLUMNA DERECHA: Resumen y Tabla -->
    <div class="lg:col-span-2 space-y-6">
      
      <div v-if="!activeProduct" class="h-full flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-[#4A5D23]/20 shadow-md transition-all duration-300">
         <Icon name="lucide:pointer" class="w-12 h-12 text-[#4A5D23]/30 mx-auto mb-4" />
         <h3 class="text-lg font-playfair font-bold text-[#2A321B] mb-2 tracking-tight">Ningún producto seleccionado</h3>
         <p class="text-[#4A5D23]/80 font-medium text-sm max-w-sm mx-auto text-balance leading-relaxed text-center">
           Selecciona un producto en el menú desplegable de la izquierda para comenzar su escandallo.
         </p>
      </div>

      <template v-else>
        <!-- Panel de Rentabilidad -->
        <section class="bg-[#4A5D23] p-8 rounded-[2rem] border border-[#4A5D23]/20 shadow-md text-[#F4F1E1] relative flex flex-col justify-center">
          <div class="absolute inset-0 overflow-hidden rounded-[2rem] pointer-events-none z-0">
            <Icon name="lucide:calculator" class="absolute -right-8 -bottom-8 w-40 h-40 text-white/5 rotate-12 pointer-events-none" />
          </div>
          <div class="relative z-10 grid grid-cols-2 gap-8">
            <div>
              <div class="flex items-center gap-1.5 mb-1 group relative w-max">
                <span class="text-[11px] font-bold uppercase tracking-widest text-[#F4F1E1]/70 block">Costo Total Producción</span>
                <Icon name="lucide:info" class="w-4 h-4 text-[#F4F1E1]/40 cursor-help" />
                <div class="absolute left-0 bottom-full mb-2 w-56 p-3 bg-white text-[#2A321B] text-[10px] font-medium leading-relaxed rounded-xl shadow-lg border border-[#4A5D23]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none">
                  Es la suma de los costos de todos los ingredientes de la ficha técnica y los costos fijos.
                  <div class="absolute -bottom-1.5 left-6 w-3 h-3 bg-white border-b border-r border-[#4A5D23]/20 rotate-45"></div>
                </div>
              </div>
              <div class="flex items-baseline gap-1">
                <span class="text-2xl font-bold text-[#F4F1E1]/80">S/</span>
                <span class="text-5xl font-black font-inter tracking-tight">{{ computedTotalCost.toFixed(2) }}</span>
              </div>
            </div>
            <div class="space-y-4">
              <div class="flex justify-between items-center text-sm font-medium border-b border-white/10 pb-2">
                <div class="flex items-center gap-1.5 group relative">
                  <span class="text-white/70 uppercase tracking-widest text-[10px] font-bold">Precio de Venta</span>
                  <Icon name="lucide:info" class="w-4 h-4 text-white/40 cursor-help" />
                  <div class="absolute right-0 bottom-full mb-2 w-48 p-3 bg-white text-[#2A321B] text-[10px] font-medium leading-relaxed rounded-xl shadow-lg border border-[#4A5D23]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none text-left">
                    Precio al público. Para cambiarlo, regresa a la Vitrina Comercial y edita el producto.
                    <div class="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-[#4A5D23]/20 rotate-45"></div>
                  </div>
                </div>
                <span class="font-bold text-lg">S/ {{ Number(activeProduct?.price || 0).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between items-center text-sm font-medium">
                <div class="flex items-center gap-1.5 group relative">
                  <span class="text-white/70 uppercase tracking-widest text-[10px] font-bold">Margen Bruto</span>
                  <Icon name="lucide:info" class="w-4 h-4 text-white/40 cursor-help" />
                  <div class="absolute right-0 bottom-full mb-2 w-52 p-3 bg-white text-[#2A321B] text-[10px] font-medium leading-relaxed rounded-xl shadow-lg border border-[#4A5D23]/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] pointer-events-none text-left">
                    Tu ganancia directa (Precio Venta menos Costo Producción). Mientras más alto, más rentable es vender este pastel.
                    <div class="absolute -bottom-1.5 right-6 w-3 h-3 bg-white border-b border-r border-[#4A5D23]/20 rotate-45"></div>
                  </div>
                </div>
                <span :class="(Number(activeProduct?.price || 0) - computedTotalCost) > 0 ? 'text-[#a3e635] font-black text-xl' : 'text-red-300 font-black text-xl'">
                  S/ {{ (Number(activeProduct?.price || 0) - computedTotalCost).toFixed(2) }}
                </span>
              </div>
            </div>
            
            <!-- Controles de Costos Fijos e Indirectos -->
            <div class="col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 mt-2 border-t border-white/10 relative z-20">
              <div>
                <label class="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Empaques y Bases</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold text-xs">S/</span>
                  <input type="number" v-model="additionalCosts.packaging" step="0.10" class="w-full pl-8 pr-3 py-2.5 bg-[#2A321B]/30 rounded-xl border border-white/10 focus:outline-none focus:border-white/40 focus:ring-4 focus:ring-white/5 text-sm font-bold text-white placeholder-white/20 transition-all shadow-inner" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Servicios</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold text-xs">S/</span>
                  <input type="number" v-model="additionalCosts.utilities" step="0.10" class="w-full pl-8 pr-3 py-2.5 bg-[#2A321B]/30 rounded-xl border border-white/10 focus:outline-none focus:border-white/40 focus:ring-4 focus:ring-white/5 text-sm font-bold text-white placeholder-white/20 transition-all shadow-inner" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-bold text-white/70 uppercase tracking-widest mb-1.5">Mano de Obra</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-bold text-xs">S/</span>
                  <input type="number" v-model="additionalCosts.labor" step="0.10" class="w-full pl-8 pr-3 py-2.5 bg-[#2A321B]/30 rounded-xl border border-white/10 focus:outline-none focus:border-white/40 focus:ring-4 focus:ring-white/5 text-sm font-bold text-white placeholder-white/20 transition-all shadow-inner" placeholder="0.00" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Tabla de Insumos -->
        <section class="bg-white p-8 rounded-[2rem] border border-[#4A5D23]/20 shadow-md transition-all duration-300 flex flex-col min-h-[400px]">
          <div class="flex items-center justify-between mb-4 pb-4 border-b border-dashed border-[#4A5D23]/30 shrink-0">
            <div class="flex items-center gap-3">
              <Icon name="lucide:list-checks" class="w-5 h-5 text-[#4A5D23]" />
              <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Ficha Técnica</h2>
            </div>
            <div class="flex items-center gap-3">
              <button 
                @click="exportToExcel"
                :disabled="isExporting || recipeItems.length === 0"
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 border border-transparent shadow-sm text-white bg-[#4A5D23] hover:bg-[#3C4A1C] disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-0.5 active:shadow-none"
                title="Exportar a Excel"
              >
                <Icon v-if="isExporting" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
                <Icon v-else name="lucide:file-spreadsheet" class="w-3.5 h-3.5" />
                Exportar Excel
              </button>
              <span class="text-[11px] font-inter font-black text-[#4A5D23]/80 bg-[#F4F1E1] px-3 py-1.5 rounded-lg border border-[#4A5D23]/20/20 shadow-sm uppercase tracking-widest">
                {{ recipeItems.length }} insumo(s)
              </span>
            </div>
          </div>

          <!-- Loading State -->
          <div v-if="pendingRecipe" class="flex-1 flex flex-col items-center justify-center py-16">
            <div class="relative w-12 h-12 mb-4 text-[#4A5D23]">
               <Icon name="lucide:loader-2" class="w-full h-full animate-spin" />
            </div>
            <p class="text-[11px] font-bold tracking-widest uppercase text-[#4A5D23] animate-pulse">Cargando receta...</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="recipeItems.length === 0" class="flex-1 flex flex-col items-center justify-center py-20 text-center bg-[#F4F1E1]/50 rounded-3xl border border-dashed border-[#4A5D23]/30">
            <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 border border-[#4A5D23]/20/20 shadow-sm">
              <Icon name="lucide:utensils-crossed" class="w-7 h-7 text-[#4A5D23]/40" />
            </div>
            <p class="text-lg font-playfair font-bold text-[#2A321B] mb-2">Receta sin insumos</p>
            <p class="text-xs font-medium text-[#4A5D23]/70 max-w-[200px]">Usa el formulario de la izquierda para comenzar a costear este producto.</p>
          </div>

          <!-- Table -->
          <div v-else class="flex-1 overflow-x-auto overflow-y-auto pr-2 custom-scrollbar">
            <table class="w-full text-left border-collapse whitespace-nowrap">
              <thead class="sticky top-0 bg-white z-10 shadow-[0_4px_6px_-6px_#4A5D23]">
                <tr class="border-b border-[#4A5D23]/20 text-[10px] uppercase tracking-widest text-[#4A5D23]/80 font-bold">
                  <th class="py-4 px-3">Insumo</th>
                  <th class="py-4 px-3 text-center">Cantidad</th>
                  <th class="py-4 px-3 text-right">Costo Parcial</th>
                  <th class="py-4 px-3 text-right"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#4A5D23]/10 text-sm">
                <tr v-for="item in recipeItems" :key="item.id" class="group hover:bg-[#F4F1E1]/50 transition-colors">
                  <td class="py-2.5 px-3">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-[#2A321B]">{{ item.name }}</span>
                      <span class="text-[9px] text-[#4A5D23]/60 font-black uppercase tracking-widest bg-[#4A5D23]/5 px-1.5 py-0.5 rounded">S/ {{ item.cost_per_unit?.toFixed(2) }} x {{ item.unit }}</span>
                    </div>
                  </td>
                  <td class="py-2.5 px-3 text-center">
                    <span class="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-[11px] font-bold border bg-white text-[#4A5D23] border-[#4A5D23]/20 shadow-sm">
                      {{ item.quantity_used }} {{ item.unit }}
                    </span>
                  </td>
                  <td class="py-2.5 px-3 text-right font-black text-[#2A321B] font-inter text-base">
                    <span class="text-[#4A5D23]/50 text-xs mr-0.5">S/</span>{{ item.item_total_cost?.toFixed(2) }}
                  </td>
                  <td class="py-2.5 px-3">
                    <div class="flex items-center justify-end">
                      <button 
                        @click="handleDeleteRecipeItem(item.id, item.name)"
                        class="inline-flex items-center justify-center w-7 h-7 rounded-lg text-red-700 hover:text-white hover:bg-red-800 hover:shadow-sm hover:border border-transparent hover:border-[#4A0000] transition-all duration-300 focus:outline-none"
                        title="Quitar de la receta"
                      >
                        <Icon name="lucide:x" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </div>

    <!-- Modal de Producto -->
    <AdminProductModal 
      :show="showModal"
      :productToEdit="null"
      @close="showModal = false"
      @saved="handleProductSaved"
    />
  </div>
</template>
