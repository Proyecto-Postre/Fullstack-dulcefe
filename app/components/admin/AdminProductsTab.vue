<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { ProductRow } from "~/types/catalog";
import ProductModal from "./ProductModal.vue";

const props = defineProps<{
  catalog: { success: boolean; data: ProductRow[] } | null | undefined;
  pendingCatalog: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "view-recipe", product: ProductRow): void;
}>();

// Modal State
const showModal = ref(false);
const productToEdit = ref<ProductRow | null>(null);

function openNewProductModal(): void {
  productToEdit.value = null;
  showModal.value = true;
}

function handleEditProduct(item: ProductRow): void {
  productToEdit.value = item;
  showModal.value = true;
}

function handleProductSaved(savedProduct: ProductRow, isNew: boolean): void {
  emit("refresh");
  if (isNew) {
    emit("view-recipe", savedProduct);
  }
}

// Local state for Optimistic UI
const localCatalog = ref<ProductRow[]>([]);

watch(() => props.catalog?.data, (newData) => {
  if (newData) {
    localCatalog.value = [...newData];
  }
}, { immediate: true });

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;

const paginatedCatalog = computed<ProductRow[]>(() => {
  if (!localCatalog.value.length) return [];
  // Solo mostrar en vitrina los productos que ya tienen precio (publicados)
  const publishedProducts = localCatalog.value.filter((p: ProductRow) => Number(p.price) > 0);
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return publishedProducts.slice(start, end);
});

const totalPages = computed<number>(() => {
  if (!localCatalog.value.length) return 1;
  const publishedProducts = localCatalog.value.filter((p: ProductRow) => Number(p.price) > 0);
  return Math.ceil(publishedProducts.length / itemsPerPage);
});

function nextPage(): void {
  if (currentPage.value < totalPages.value) currentPage.value++;
}

function prevPage(): void {
  if (currentPage.value > 1) currentPage.value--;
}

watch(
  () => props.catalog?.data?.length,
  () => {
    currentPage.value = 1;
  },
);

async function handleDeleteProduct(id: number | string, name: string): Promise<void> {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) return;
  
  // Optimistic UI update: Eliminar localmente primero para disparar la animación al instante
  const numId = Number(id);
  const index = localCatalog.value.findIndex((p: ProductRow) => p.id === numId);
  let deletedItem: ProductRow | null = null;
  if (index !== -1) {
    deletedItem = localCatalog.value[index] ?? null;
    localCatalog.value.splice(index, 1);
  }

  try {
    await $fetch(`/api/products/${id}`, { method: "DELETE" });
  } catch (err: unknown) {
    // Si falla, revertimos el cambio local
    if (deletedItem && index !== -1) {
      localCatalog.value.splice(index, 0, deletedItem);
    }
    const fetchErr = err as { data?: { statusMessage?: string }; message?: string };
    alert("Error al eliminar: " + (fetchErr.data?.statusMessage || fetchErr.message || "Error desconocido"));
  }
}

function getProductIcon(name: string): string {
  if (!name) return 'lucide:croissant'
  const n = name.toLowerCase()
  
  // 1. Panadería, Masas y Salados
  if (n.includes('pan') || n.includes('panes') || n.includes('baguette') || n.includes('ciabatta') || n.includes('brioche') || n.includes('miga')) return 'lucide:sandwich'
  if (n.includes('hojaldre') || n.includes('empanada') || n.includes('croissant') || n.includes('medialuna') || n.includes('milhojas') || n.includes('cachito')) return 'lucide:croissant'
  if (n.includes('pizza') || n.includes('focaccia') || n.includes('quiche') || n.includes('tarta salada') || n.includes('calzone')) return 'lucide:pizza'
  if (n.includes('sandwich') || n.includes('sándwich') || n.includes('butifarra') || n.includes('bocadito') || n.includes('canape') || n.includes('mixto') || n.includes('hamburguesa') || n.includes('burger')) return 'lucide:sandwich'
  
  // 2. Carnes, Pollo, Jamón y Salados
  if (n.includes('carne') || n.includes('res') || n.includes('lomo') || n.includes('asado') || n.includes('jamon') || n.includes('jamón') || n.includes('tocino') || n.includes('chicharron') || n.includes('chorizo')) return 'lucide:beef'
  if (n.includes('pollo') || n.includes('gallina') || n.includes('pavo') || n.includes('alita') || n.includes('pechuga')) return 'lucide:drumstick'
  if (n.includes('pescado') || n.includes('atun') || n.includes('atún') || n.includes('salmon') || n.includes('salmón')) return 'lucide:fish'
  if (n.includes('queso') || n.includes('cheese') || n.includes('mozzarella')) return 'lucide:milk'

  // 3. Pastelería, Tortas y Tartas Dulces
  if (n.includes('torta') || n.includes('pastel') || n.includes('cake') || n.includes('keke') || n.includes('queque') || n.includes('bizcochuelo') || n.includes('mousse')) return 'lucide:cake'
  if (n.includes('porcion') || n.includes('porción') || n.includes('tajada') || n.includes('slice')) return 'lucide:cake-slice'
  if (n.includes('cupcake') || n.includes('muffin') || n.includes('magdalena')) return 'lucide:cake-slice'
  if (n.includes('tartaleta') || n.includes('tarta') || n.includes('pie') || n.includes('pay')) return 'lucide:pie-chart'
  if (n.includes('cheesecake') || n.includes('cheese cake')) return 'lucide:heart'
  if (n.includes('brownie') || n.includes('alfajor') || n.includes('galleta') || n.includes('cookie') || n.includes('macaron') || n.includes('trufa') || n.includes('bombón') || n.includes('bombon')) return 'lucide:cookie'
  if (n.includes('postre') || n.includes('dulce') || n.includes('crema') || n.includes('flan') || n.includes('pudin') || n.includes('pudding') || n.includes('suspiro')) return 'lucide:sparkles'

  // Default
  return 'lucide:croissant'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm">
      <div>
        <h2 class="text-2xl font-black font-playfair text-[#2A321B]">Vitrina Comercial</h2>
        <p class="text-xs text-[#4A5D23]/70 font-medium mt-0.5">Gestiona los postres que se muestran públicamente a los clientes</p>
      </div>
      <button
        @click="openNewProductModal"
        type="button"
        class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm active:scale-95 cursor-pointer self-start sm:self-auto"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Nuevo Producto</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="pendingCatalog" class="flex justify-center py-20">
      <Icon name="lucide:loader-2" class="w-8 h-8 text-[#4A5D23] animate-spin" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!localCatalog.length" class="text-center py-20 bg-white rounded-[2rem] border border-[#4A5D23]/10 p-8 shadow-soft-sm">
      <div class="w-16 h-16 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-4 text-[#4A5D23]">
        <Icon name="lucide:cake-slice" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold font-playfair text-[#2A321B] mb-1">Sin productos en la vitrina</h3>
      <p class="text-xs text-[#4A5D23]/70 max-w-sm mx-auto mb-6">Comienza agregando los postres artesanales de tu carta.</p>
      <button
        @click="openNewProductModal"
        type="button"
        class="px-5 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all"
      >
        Crear Primer Producto
      </button>
    </div>

    <!-- Table Section -->
    <div v-else class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-soft-sm overflow-hidden">
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-[#4A5D23]/10 bg-[#F4F1E1]/40">
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider">Producto</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Precio</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-center">Stock</th>
              <th class="py-4 px-6 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#4A5D23]/5">
            <tr 
              v-for="item in paginatedCatalog" 
              :key="item.id" 
              class="hover:bg-[#F4F1E1]/20 transition-colors group"
            >
              <!-- Producto: Imagen + Nombre -->
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 overflow-hidden shrink-0 flex items-center justify-center">
                    <img 
                      v-if="item.image_url" 
                      :src="item.image_url" 
                      :alt="item.name" 
                      class="w-full h-full object-cover" 
                    />
                    <Icon v-else :name="getProductIcon(item.name)" class="w-6 h-6 text-[#4A5D23]/60" />
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-[#2A321B]">{{ item.name }}</h4>
                    <p class="text-[11px] text-[#4A5D23]/60">ID: #{{ item.id }}</p>
                  </div>
                </div>
              </td>

              <!-- Precio -->
              <td class="py-4 px-6 text-right">
                <span class="font-bold text-sm text-[#2A321B] font-inter">
                  S/ {{ Number(item.price).toFixed(2) }}
                </span>
              </td>

              <!-- Stock -->
              <td class="py-4 px-6 text-center">
                <span 
                  :class="[
                    'inline-block px-3 py-1 rounded-full text-xs font-bold border',
                    (item.stock ?? 0) <= 5 && (item.stock ?? 0) > 0 
                      ? 'bg-red-50 text-status-danger border-red-200' 
                      : (item.stock ?? 0) === 0 
                        ? 'bg-gray-100 text-gray-700 border-gray-200' 
                        : 'bg-brand-cream/60 text-brand-secondary border-brand-primary/20'
                  ]"
                >
                  {{ item.stock ?? 0 }} disp.
                </span>
              </td>

              <!-- Acciones -->
              <td class="py-4 px-6 text-right">
                <div class="inline-flex items-center gap-1.5">
                  <button
                    @click="emit('view-recipe', item)"
                    type="button"
                    class="w-8 h-8 rounded-lg bg-[#F4F1E1]/60 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                    title="Ver Escandallo / Receta"
                  >
                    <Icon name="lucide:calculator" class="w-4 h-4" />
                  </button>
                  <button
                    @click="handleEditProduct(item)"
                    type="button"
                    class="w-8 h-8 rounded-lg bg-[#F4F1E1]/60 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                    title="Editar"
                  >
                    <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
                  </button>
                  <button
                    @click="handleDeleteProduct(item.id, item.name)"
                    type="button"
                    class="w-8 h-8 rounded-lg bg-red-50 text-status-danger hover:bg-status-danger hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                    title="Eliminar"
                  >
                    <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="flex items-center justify-between p-4 border-t border-[#4A5D23]/10 bg-[#F4F1E1]/20">
        <span class="text-xs text-[#4A5D23]/70 font-medium">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <div class="flex items-center gap-2">
          <button
            @click="prevPage"
            :disabled="currentPage <= 1"
            class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            @click="nextPage"
            :disabled="currentPage >= totalPages"
            class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Edición / Creación -->
    <ProductModal
      :show="showModal"
      :product-to-edit="productToEdit"
      @close="showModal = false"
      @saved="handleProductSaved"
    />
  </div>
</template>
