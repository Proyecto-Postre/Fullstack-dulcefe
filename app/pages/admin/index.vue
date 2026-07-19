<script setup lang="ts">
// 1. Protección de ruta por sesión
const user = useSupabaseUser()
if (!user.value) {
  navigateTo('/login')
}

// 2. Control de pestañas del panel ('products' | 'materials')
const currentTab = ref<'products' | 'materials'>('products')

// 3. Consultas simultáneas a Supabase (Productos e Insumos)
const { data: catalog, refresh: refreshCatalog, pending: pendingCatalog } = await useFetch('/api/products')
const { data: materials, refresh: refreshMaterials, pending: pendingMaterials } = await useFetch('/api/raw-materials')

// 4. Estados para formularios y edición
const newProduct = ref({ name: '', price: '', stock: '' })
const editingProductId = ref<string | null>(null)

const newMaterial = ref({ name: '', unit: 'g', purchase_price: '', purchase_quantity: '', stock: '' })
const editingMaterialId = ref<string | null>(null)

const isSubmitting = ref(false)
const errorMessage = ref('')

// 5. ACCIÓN: Crear o Actualizar Producto Comercial
async function handleCreateProduct() {
  if (!newProduct.value.name || !newProduct.value.price) {
    errorMessage.value = 'El nombre y el precio son obligatorios.'
    return
  }
  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const method = editingProductId.value ? 'PUT' : 'POST'
    const endpoint = editingProductId.value ? `/api/products/${editingProductId.value}` : '/api/products'
    
    await $fetch(endpoint, {
      method,
      body: {
        name: newProduct.value.name,
        price: Number(newProduct.value.price),
        stock: Number(newProduct.value.stock || 0)
      }
    })
    
    cancelEditProduct()
    await refreshCatalog()
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
    stock: item.stock 
  }
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function cancelEditProduct() {
  editingProductId.value = null
  newProduct.value = { name: '', price: '', stock: '' }
  errorMessage.value = ''
}

// 6. ACCIÓN: Crear o Actualizar Materia Prima o Empaque
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
    await refreshMaterials()
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

// 7. ACCIÓN: Eliminar Producto
async function handleDeleteProduct(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) return
  try {
    await $fetch(`/api/products/${id}`, { method: 'DELETE' })
    await refreshCatalog()
  } catch (err: any) {
    alert('Error al eliminar: ' + (err.data?.statusMessage || err.message))
  }
}

// 7.5 ACCIÓN: Eliminar Insumo
async function handleDeleteMaterial(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del inventario de insumos?`)) return
  try {
    await $fetch(`/api/raw-materials/${id}`, { method: 'DELETE' })
    await refreshMaterials()
  } catch (err: any) {
    alert('Error al eliminar: ' + (err.data?.statusMessage || err.message))
  }
}

// 8. Cerrar Sesión
const supabase = useSupabaseClient()
async function handleLogout() {
  await supabase.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter text-[#2A321B] selection:bg-[#4A5D23] selection:text-[#F4F1E1] relative overflow-hidden">
    
    <!-- Ambient Botanical Background Elements -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-[#4A5D23]/[0.03] -rotate-12" />
      <Icon name="lucide:leaf" class="absolute bottom-[20%] right-[-10%] w-[40rem] h-[40rem] text-[#4A5D23]/[0.03] rotate-45" />
      <Icon name="lucide:leaf" class="absolute top-[30%] left-[10%] w-64 h-64 text-[#4A5D23]/[0.02] rotate-[120deg]" />
      
      <div class="absolute top-0 right-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
      <div class="absolute top-0 left-10 w-px h-full bg-gradient-to-b from-transparent via-[#4A5D23]/10 to-transparent"></div>
    </div>

    <!-- Header -->
    <header class="relative z-50 sticky top-0 bg-[#F4F1E1]/95 backdrop-blur-sm border-b border-[#4A5D23]/30 transition-all duration-300">
      <div class="max-w-7xl mx-auto flex justify-between items-center py-4 px-6 lg:px-12">
        <div class="flex items-center space-x-4">
          <div class="w-10 h-10 border border-[#4A5D23] bg-white rounded-full flex items-center justify-center text-[#4A5D23] shadow-[2px_2px_0px_#4A5D23]">
            <Icon name="lucide:wheat" class="w-5 h-5" />
          </div>
          <div>
            <h1 class="text-xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe <span class="font-normal text-[#4A5D23] ml-1">| ERP</span></h1>
            <p class="text-[9px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Costos & Vitrina</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-6">
          <NuxtLink to="/" class="group flex items-center gap-1.5 text-[13px] font-bold text-[#4A5D23] hover:text-[#2A321B] transition-colors">
            <Icon name="lucide:store" class="w-4 h-4" />
            <span class="border-b border-transparent group-hover:border-[#2A321B] transition-colors">Ver Tienda</span>
          </NuxtLink>
          <button 
            @click="handleLogout"
            class="group flex items-center gap-2 bg-white hover:bg-red-50 text-red-700 text-[13px] px-4 py-2 rounded-xl font-bold transition-all duration-300 border-2 border-red-800 shadow-[3px_3px_0px_#991B1B] active:translate-y-1 active:shadow-none"
          >
            <Icon name="lucide:log-out" class="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Salir
          </button>
        </div>
      </div>
    </header>

    <!-- Navegación por Pestañas -->
    <div class="relative z-10 max-w-7xl mx-auto pt-8 px-6 lg:px-12">
      <div class="flex space-x-4 border-b-2 border-[#4A5D23]/20 pb-0">
        <button 
          @click="currentTab = 'products'; errorMessage = ''; cancelEditMaterial()"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border-2 border-b-0',
            currentTab === 'products' 
              ? 'bg-white border-[#4A5D23] text-[#2A321B] shadow-[6px_0px_0px_#4A5D23] relative translate-y-[2px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/30'
          ]"
        >
          <Icon name="lucide:cake-slice" class="w-4 h-4" />
          Vitrina Comercial
        </button>
        <button 
          @click="currentTab = 'materials'; errorMessage = ''; cancelEditProduct()"
          :class="[
            'flex items-center gap-2 py-3 px-6 font-bold text-sm rounded-t-[1.5rem] transition-all duration-300 border-2 border-b-0',
            currentTab === 'materials' 
              ? 'bg-white border-[#4A5D23] text-[#2A321B] shadow-[6px_0px_0px_#4A5D23] relative translate-y-[2px]' 
              : 'bg-transparent border-transparent text-[#4A5D23]/60 hover:text-[#4A5D23] hover:bg-white/30'
          ]"
        >
          <Icon name="lucide:scale" class="w-4 h-4" />
          Almacén de Insumos
        </button>
      </div>
    </div>

    <main class="relative z-10 max-w-7xl mx-auto py-8 px-6 lg:px-12">
      
      <div v-if="errorMessage" class="mb-8 bg-white border-2 border-red-800 text-red-900 p-4 rounded-xl text-sm flex items-start gap-3 shadow-[4px_4px_0px_#991B1B]">
        <Icon name="lucide:triangle-alert" class="w-5 h-5 shrink-0 mt-0.5" />
        <span class="font-medium leading-relaxed">{{ errorMessage }}</span>
      </div>

      <!-- VISTA 1: PRODUCTOS COMERCIALES -->
      <div v-if="currentTab === 'products'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
        <section class="lg:col-span-2 bg-white p-8 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] transition-all duration-300">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
            <div class="flex items-center gap-3">
              <Icon name="lucide:library" class="w-5 h-5 text-[#4A5D23]" />
              <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Inventario Actual</h2>
            </div>
            
            <button @click="refreshCatalog" class="w-8 h-8 rounded-lg text-[#4A5D23] hover:bg-[#F4F1E1] flex items-center justify-center transition-all duration-300" title="Actualizar">
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
          <div v-else class="overflow-x-auto">
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
                <tr v-for="item in catalog.data" :key="item.id" class="group hover:bg-[#F4F1E1]/50 transition-colors duration-200">
                  <td class="py-4 px-4 font-medium text-[#2A321B] flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-white border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23] group-hover:border-[#4A5D23] transition-all">
                      <Icon name="lucide:croissant" class="w-3.5 h-3.5" />
                    </div>
                    {{ item.name }}
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
          </div>
        </section>
      </div>

      <!-- VISTA 2: ALMACÉN DE INSUMOS -->
      <div v-if="currentTab === 'materials'" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                <!-- select styled to match other inputs -->
                <div class="relative">
                  <select v-model="newMaterial.unit" class="w-full pl-4 pr-10 py-3 bg-white rounded-xl border-2 border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] transition-all appearance-none cursor-pointer">
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilos (kg)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="l">Litros (l)</option>
                    <option value="und">Unidades (und)</option>
                  </select>
                  <Icon name="lucide:chevron-down" class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A5D23] pointer-events-none" />
                </div>
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
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-[#4A5D23]/80 uppercase tracking-widest mb-1.5">Precio Pagado</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 font-bold text-sm">S/</span>
                    <input 
                      v-model="newMaterial.purchase_price"
                      type="number" 
                      step="0.10"
                      required
                      placeholder="0.00"
                      class="w-full pl-8 pr-3 py-2.5 bg-white rounded-lg border-2 border-[#4A5D23]/10 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-[#4A5D23]/80 uppercase tracking-widest mb-1.5">Trae (g/kg/ml/l/und)</label>
                  <input 
                    v-model="newMaterial.purchase_quantity"
                    type="number" 
                    step="0.10"
                    required
                    placeholder="Ej: 1000"
                    class="w-full px-3 py-2.5 bg-white rounded-lg border-2 border-[#4A5D23]/10 focus:outline-none focus:border-[#4A5D23] focus:ring-4 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] transition-all"
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
        <section class="lg:col-span-2 bg-white p-8 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] transition-all duration-300">
          <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
            <div class="flex items-center gap-3">
              <Icon name="lucide:calculator" class="w-5 h-5 text-[#4A5D23]" />
              <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Cálculo de Costos Unitarios</h2>
            </div>
            
            <button @click="refreshMaterials" class="w-8 h-8 rounded-lg text-[#4A5D23] hover:bg-[#F4F1E1] flex items-center justify-center transition-all duration-300" title="Actualizar">
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
          <div v-else class="overflow-x-auto pb-4">
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
                <tr v-for="mat in materials.data" :key="mat.id" class="group hover:bg-[#F4F1E1]/50 transition-colors duration-200">
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
                      <span class="text-[#4A5D23]/60 text-xs mr-0.5">S/</span>{{ Number(mat.cost_per_unit || (mat.purchase_price / mat.purchase_quantity)).toFixed(4) }}
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
          </div>
        </section>
      </div>

    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,500&display=swap');

.font-inter {
  font-family: 'Inter', sans-serif;
}
.font-playfair {
  font-family: 'Playfair Display', serif;
}
</style>