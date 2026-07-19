<script setup lang="ts">
// 1. Verificamos que el usuario tenga sesión activa. Si no, lo rebotamos al login.
const user = useSupabaseUser()
if (!user.value) {
  navigateTo('/login')
}

// 2. Traemos el catálogo y extraemos la función 'refresh' para recargar la tabla sin refrescar la página
const { data: catalog, refresh, pending } = await useFetch('/api/products')

// 3. Estado para el formulario de nuevo pastel
const newProduct = ref({
  name: '',
  price: '',
  stock: ''
})
const isSubmitting = ref(false)
const errorMessage = ref('')

// 4. Función para CREAR producto (Consume tu POST /api/products)
async function handleCreate() {
  if (!newProduct.value.name || !newProduct.value.price) {
    errorMessage.value = 'El nombre y el precio son obligatorios.'
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/products', {
      method: 'POST',
      body: {
        name: newProduct.value.name,
        price: Number(newProduct.value.price),
        stock: Number(newProduct.value.stock || 0)
      }
    })

    // Limpiamos los inputs y actualizamos la tabla al milisegundo
    newProduct.value = { name: '', price: '', stock: '' }
    await refresh()
  } catch (err: any) {
    errorMessage.value = err.data?.statusMessage || 'Error al guardar en la nube.'
  } finally {
    isSubmitting.value = false
  }
}

// 5. Función para ELIMINAR producto (Consume tu DELETE /api/products/[id])
async function handleDelete(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) return

  try {
    await $fetch(`/api/products/${id}`, {
      method: 'DELETE'
    })
    await refresh() // Refrescamos la tabla
  } catch (err: any) {
    alert('Error al eliminar: ' + (err.data?.statusMessage || err.message))
  }
}

// 6. Función para cerrar sesión y salir del panel
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
            <h1 class="text-xl font-playfair font-black tracking-tight text-[#2A321B]">Dulce Fe</h1>
            <p class="text-[9px] font-bold text-[#4A5D23] uppercase tracking-[0.25em] mt-0.5">Gestión de Inventario</p>
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

    <main class="relative z-10 max-w-7xl mx-auto py-10 px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      <!-- COLUMNA IZQUIERDA: Formulario para Agregar Pastel -->
      <section class="bg-white p-8 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] h-fit transition-all duration-300">
        <div class="flex items-center gap-3 mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
          <Icon name="lucide:plus-circle" class="w-5 h-5 text-[#4A5D23]" />
          <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Nuevo Producto</h2>
        </div>
        
        <div v-if="errorMessage" class="mb-5 bg-white border-2 border-red-800 text-red-900 p-4 rounded-xl text-sm flex items-start gap-3 shadow-[4px_4px_0px_#991B1B]">
          <Icon name="lucide:triangle-alert" class="w-5 h-5 shrink-0 mt-0.5" />
          <span class="font-medium leading-relaxed">{{ errorMessage }}</span>
        </div>

        <form @submit.prevent="handleCreate" class="space-y-5">
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

          <button 
            type="submit"
            :disabled="isSubmitting"
            class="group w-full mt-2 relative inline-flex items-center justify-center px-5 py-3.5 text-sm font-bold text-[#F4F1E1] bg-[#4A5D23] hover:bg-[#3C4A1C] border border-[#2A321B] rounded-xl overflow-hidden transition-all duration-300 shadow-[4px_4px_0px_#2A321B] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="relative z-10 flex items-center gap-2">
              <Icon v-if="isSubmitting" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <Icon v-else name="lucide:plus" class="w-4 h-4 transition-transform group-hover:scale-110" />
              {{ isSubmitting ? 'Guardando...' : 'Agregar al Catálogo' }}
            </span>
          </button>
        </form>
      </section>

      <!-- COLUMNA DERECHA: Tabla de Inventario -->
      <section class="lg:col-span-2 bg-white p-8 rounded-[2rem] border-2 border-[#4A5D23] shadow-[6px_6px_0px_#4A5D23] transition-all duration-300">
        <div class="flex items-center justify-between mb-6 pb-4 border-b border-dashed border-[#4A5D23]/30">
          <div class="flex items-center gap-3">
            <Icon name="lucide:library" class="w-5 h-5 text-[#4A5D23]" />
            <h2 class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight">Inventario Actual</h2>
          </div>
          
          <button @click="refresh" class="w-8 h-8 rounded-lg text-[#4A5D23] hover:bg-[#F4F1E1] flex items-center justify-center transition-all duration-300" title="Actualizar">
            <Icon name="lucide:refresh-cw" :class="['w-4 h-4', pending ? 'animate-spin' : '']" />
          </button>
        </div>

        <!-- State: Loading -->
        <div v-if="pending && (!catalog?.data)" class="flex flex-col items-center justify-center py-16">
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
                <td class="py-4 px-4 text-right">
                  <button 
                    @click="handleDelete(item.id, item.name)"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-700 hover:text-white hover:bg-red-800 hover:shadow-[2px_2px_0px_#991B1B] hover:border hover:border-[#4A0000] transition-all duration-300 focus:outline-none"
                    title="Eliminar producto"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

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