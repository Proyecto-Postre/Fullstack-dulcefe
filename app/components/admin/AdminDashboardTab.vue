<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const props = defineProps<{
  catalog: any
  materials: any
}>()

// Computed properties for dashboard metrics
const totalProducts = computed(() => props.catalog?.data?.length || 0)
const totalMaterials = computed(() => props.materials?.data?.length || 0)

const lowStockProducts = computed(() => {
  if (!props.catalog?.data) return []
  return props.catalog.data.filter((p: any) => p.stock <= 5)
})

const lowStockMaterials = computed(() => {
  if (!props.materials?.data) return []
  // Assuming a threshold of 500g or 5 units for materials
  return props.materials.data.filter((m: any) => {
    if (m.unit === 'g' || m.unit === 'ml') return m.stock <= 500
    return m.stock <= 5
  })
})

const totalInventoryValue = computed(() => {
  if (!props.materials?.data) return 0
  return props.materials.data.reduce((sum: number, m: any) => {
    const costPerUnit = m.cost_per_unit || (m.purchase_price / m.purchase_quantity)
    return sum + (costPerUnit * m.stock)
  }, 0)
})
</script>

<template>
  <div class="space-y-8 animate-fade-in-up">
    <!-- Welcome Section -->
    <div class="bg-white/90 backdrop-blur-md rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-8 flex flex-col md:flex-row items-center justify-between gap-6">
      <div>
        <h2 class="text-3xl font-playfair font-black text-[#2A321B] mb-2">
          ¡Hola, {{ authStore.profile?.full_name?.split(' ')[0] || 'Administrador' }}!
        </h2>
        <p class="text-[#4A5D23]/80 font-medium">Aquí tienes un resumen del estado actual de tu pastelería.</p>
      </div>
      <div class="flex items-center gap-4">
        <div class="text-right">
          <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest">Valor del Almacén</p>
          <p class="text-2xl font-black text-[#2A321B]">S/ {{ totalInventoryValue.toFixed(2) }}</p>
        </div>
        <div class="w-12 h-12 rounded-full bg-[#F4F1E1] border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23]">
          <Icon name="lucide:wallet" class="w-6 h-6" />
        </div>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div class="bg-white rounded-2xl border border-[#4A5D23]/10 shadow-sm p-6 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center">
            <Icon name="lucide:cake-slice" class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest bg-[#4A5D23]/10 px-2 py-1 rounded-md">Vitrina</span>
        </div>
        <h3 class="text-3xl font-black text-[#2A321B] mb-1">{{ totalProducts }}</h3>
        <p class="text-sm font-medium text-[#4A5D23]/70">Productos activos</p>
      </div>

      <div class="bg-white rounded-2xl border border-[#4A5D23]/10 shadow-sm p-6 flex flex-col">
        <div class="flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center">
            <Icon name="lucide:scale" class="w-5 h-5" />
          </div>
          <span class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest bg-[#4A5D23]/10 px-2 py-1 rounded-md">Almacén</span>
        </div>
        <h3 class="text-3xl font-black text-[#2A321B] mb-1">{{ totalMaterials }}</h3>
        <p class="text-sm font-medium text-[#4A5D23]/70">Insumos registrados</p>
      </div>

      <div class="bg-white rounded-2xl border border-red-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-50 rounded-full z-0"></div>
        <div class="relative z-10 flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center">
            <Icon name="lucide:alert-triangle" class="w-5 h-5" />
          </div>
        </div>
        <h3 class="relative z-10 text-3xl font-black text-red-900 mb-1">{{ lowStockProducts.length }}</h3>
        <p class="relative z-10 text-sm font-medium text-red-700">Productos con stock bajo</p>
      </div>

      <div class="bg-white rounded-2xl border border-amber-200 shadow-sm p-6 flex flex-col relative overflow-hidden">
        <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full z-0"></div>
        <div class="relative z-10 flex items-center justify-between mb-4">
          <div class="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Icon name="lucide:package-minus" class="w-5 h-5" />
          </div>
        </div>
        <h3 class="relative z-10 text-3xl font-black text-amber-900 mb-1">{{ lowStockMaterials.length }}</h3>
        <p class="relative z-10 text-sm font-medium text-amber-700">Insumos por reponer</p>
      </div>
    </div>

    <!-- Alerts Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Low Stock Products -->
      <div class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-8">
        <h3 class="text-xl font-playfair font-bold text-[#2A321B] mb-6 flex items-center gap-2">
          <Icon name="lucide:store" class="w-5 h-5 text-[#4A5D23]" />
          Atención en Vitrina
        </h3>
        
        <div v-if="lowStockProducts.length === 0" class="text-center py-8 bg-[#F4F1E1]/30 rounded-2xl border border-dashed border-[#4A5D23]/20">
          <Icon name="lucide:check-circle-2" class="w-8 h-8 text-[#4A5D23]/40 mx-auto mb-2" />
          <p class="text-sm font-medium text-[#4A5D23]/70">Todos los productos tienen buen stock.</p>
        </div>
        
        <div v-else class="space-y-3">
          <div v-for="product in lowStockProducts" :key="product.id" class="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white border border-red-200 overflow-hidden shrink-0">
                <img v-if="product.image_url" :src="product.image_url" class="w-full h-full object-cover" />
                <Icon v-else name="lucide:cake-slice" class="w-5 h-5 m-2.5 text-red-400" />
              </div>
              <div>
                <p class="font-bold text-[#2A321B]">{{ product.name }}</p>
                <p class="text-xs font-medium text-red-700">Quedan {{ product.stock }} unidades</p>
              </div>
            </div>
            <button class="text-xs font-bold bg-white text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
              Actualizar
            </button>
          </div>
        </div>
      </div>

      <!-- Low Stock Materials -->
      <div class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm p-8">
        <h3 class="text-xl font-playfair font-bold text-[#2A321B] mb-6 flex items-center gap-2">
          <Icon name="lucide:package-open" class="w-5 h-5 text-[#4A5D23]" />
          Compras Necesarias
        </h3>
        
        <div v-if="lowStockMaterials.length === 0" class="text-center py-8 bg-[#F4F1E1]/30 rounded-2xl border border-dashed border-[#4A5D23]/20">
          <Icon name="lucide:check-circle-2" class="w-8 h-8 text-[#4A5D23]/40 mx-auto mb-2" />
          <p class="text-sm font-medium text-[#4A5D23]/70">El almacén está bien abastecido.</p>
        </div>
        
        <div v-else class="space-y-3">
          <div v-for="material in lowStockMaterials" :key="material.id" class="flex items-center justify-between p-4 rounded-xl border border-amber-100 bg-amber-50/50">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-white border border-amber-200 flex items-center justify-center shrink-0 text-amber-500">
                <Icon name="lucide:box" class="w-5 h-5" />
              </div>
              <div>
                <p class="font-bold text-[#2A321B]">{{ material.name }}</p>
                <p class="text-xs font-medium text-amber-700">Stock: {{ material.stock }} {{ material.unit }}</p>
              </div>
            </div>
            <button class="text-xs font-bold bg-white text-amber-700 border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors">
              Comprar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
</style>
