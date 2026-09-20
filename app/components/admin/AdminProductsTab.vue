<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
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

// Search State
const searchQuery = ref("");
const isSearchFocused = ref(false);

function handleSearchBlur(): void {
  setTimeout(() => {
    isSearchFocused.value = false;
  }, 150);
}

function clearSearch(): void {
  searchQuery.value = "";
  currentPage.value = 1;
  isSearchFocused.value = false;
}

function selectSuggestion(item: ProductRow): void {
  searchQuery.value = item.name || "";
  isSearchFocused.value = false;
}

// Published products with price > 0
const publishedProducts = computed<ProductRow[]>(() => {
  if (!localCatalog.value.length) return [];
  return localCatalog.value.filter((p: ProductRow) => Number(p.price) > 0);
});

// Filtered products by search query
const filteredProducts = computed<ProductRow[]>(() => {
  const list = publishedProducts.value;
  if (!list.length) return [];
  if (!searchQuery.value.trim()) return list;

  const q = searchQuery.value.toLowerCase().trim();
  return list.filter((p: ProductRow) => {
    const name = p.name ? p.name.toLowerCase() : "";
    return name.includes(q);
  });
});

const searchSuggestions = computed<ProductRow[]>(() => {
  if (!searchQuery.value.trim()) return [];
  return filteredProducts.value.slice(0, 5);
});

// Paginación adaptativa según altura de pantalla (itemsPerPage = 7 base)
const currentPage = ref(1);
const itemsPerPage = ref(7);

function updateDynamicProductsPerPage(): void {
  if (typeof window === "undefined") return;
  if (window.innerWidth < 768) {
    itemsPerPage.value = 6;
    return;
  }
  // Altura disponible = window.innerHeight - header ERP, tarjeta de buscador, thead y pie de tabla (~340px de elementos fijos)
  const availableHeight = window.innerHeight - 340;
  const rowHeight = 68;
  // Restamos 1 elemento para que la barra de paginación tenga suficiente holgura inferior
  const calculated = Math.floor(availableHeight / rowHeight) - 1;
  itemsPerPage.value = Math.max(5, Math.min(calculated, 10));
}

onMounted(() => {
  updateDynamicProductsPerPage();
  window.addEventListener("resize", updateDynamicProductsPerPage);
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateDynamicProductsPerPage);
  }
});

watch(itemsPerPage, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = Math.max(1, totalPages.value);
  }
});

watch(searchQuery, () => {
  currentPage.value = 1;
});

const paginatedCatalog = computed<ProductRow[]>(() => {
  if (!filteredProducts.value.length) return [];
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredProducts.value.slice(start, end);
});

const totalPages = computed<number>(() => {
  if (!filteredProducts.value.length) return 1;
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value);
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
  <div class="space-y-3.5 sm:space-y-4">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-white p-4 sm:p-5 rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-xl sm:text-2xl font-black font-playfair text-[#2A321B]">Vitrina Comercial</h2>
          <span v-if="publishedProducts.length" class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4A5D23]/10 text-[#4A5D23] border border-[#4A5D23]/15">
            {{ searchQuery ? `${filteredProducts.length} de ${publishedProducts.length} ${publishedProducts.length === 1 ? 'producto' : 'productos'}` : `${publishedProducts.length} ${publishedProducts.length === 1 ? 'producto' : 'productos'}` }}
          </span>
        </div>
        <p class="text-xs text-[#4A5D23]/70 font-medium mt-0.5">Gestiona los postres que se muestran públicamente a los clientes</p>
      </div>

      <!-- Barra de herramientas compacta: Búsqueda focalizada + Botón Nuevo Producto -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <!-- Search Bar with Suggestions -->
        <div class="relative w-full sm:w-64 md:w-72 lg:w-80">
          <div class="relative">
            <Icon name="lucide:search" class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#4A5D23]/40" />
            <input 
              v-model="searchQuery"
              @focus="isSearchFocused = true"
              @blur="handleSearchBlur"
              type="text" 
              placeholder="Buscar productos o postres..."
              class="w-full pl-10 pr-10 py-2.5 bg-[#F4F1E1]/40 hover:bg-[#F4F1E1]/70 focus:bg-white border border-[#4A5D23]/15 rounded-xl text-xs font-bold text-[#2A321B] placeholder:text-[#4A5D23]/40 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/15 transition-all shadow-xs"
            />
            <Transition name="fade">
              <button 
                v-if="searchQuery" 
                @click="clearSearch" 
                type="button" 
                class="absolute right-3 top-1/2 -translate-y-1/2 text-[#4A5D23]/40 hover:text-red-600 p-0.5 cursor-pointer transition-colors"
                aria-label="Limpiar búsqueda"
              >
                <Icon name="lucide:x" class="w-3.5 h-3.5" />
              </button>
            </Transition>
          </div>

          <!-- Dropdown de sugerencias -->
          <Transition name="dropdown">
            <div 
              v-if="isSearchFocused && searchSuggestions.length > 0 && searchQuery"
              class="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#4A5D23]/15 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-[#4A5D23]/5"
            >
              <button
                v-for="sugg in searchSuggestions"
                :key="sugg.id"
                @mousedown.prevent="selectSuggestion(sugg)"
                type="button"
                class="w-full text-left px-4 py-2 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1]/40 flex items-center justify-between cursor-pointer"
              >
                <span>{{ sugg.name }}</span>
                <span class="text-[10px] text-[#4A5D23]/60">S/ {{ Number(sugg.price).toFixed(2) }}</span>
              </button>
            </div>
          </Transition>
        </div>

        <button
          @click="openNewProductModal"
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="pendingCatalog" class="flex justify-center py-20">
      <Icon name="lucide:loader-2" class="w-8 h-8 text-[#4A5D23] animate-spin" />
    </div>

    <!-- Empty State General (Sin productos creados) -->
    <div v-else-if="!localCatalog.length" class="text-center py-16 bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 p-6 sm:p-8 shadow-soft-sm">
      <div class="w-16 h-16 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-4 text-[#4A5D23]">
        <Icon name="lucide:cake-slice" class="w-8 h-8" />
      </div>
      <h3 class="text-xl font-bold font-playfair text-[#2A321B] mb-1">Sin productos en la vitrina</h3>
      <p class="text-xs text-[#4A5D23]/70 max-w-sm mx-auto mb-6">Comienza agregando los postres artesanales de tu carta.</p>
      <button
        @click="openNewProductModal"
        type="button"
        class="px-5 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all cursor-pointer shadow-sm"
      >
        Crear Primer Producto
      </button>
    </div>

    <!-- Main Content: Mobile Cards (< md) & Desktop Table (>= md) -->
    <div v-else class="space-y-3 sm:space-y-4">
      <!-- Empty State para búsquedas sin resultados (Mobile & Desktop) -->
      <div 
        v-if="!paginatedCatalog.length"
        class="bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm text-center py-12 px-4 text-[#4A5D23]/60"
      >
        <div class="w-12 h-12 rounded-full bg-[#F4F1E1] flex items-center justify-center mx-auto mb-2 text-[#4A5D23]">
          <Icon name="lucide:search-x" class="w-6 h-6" />
        </div>
        <p class="text-xs sm:text-sm font-bold text-[#2A321B]">No se encontraron productos</p>
        <p class="text-[11px] sm:text-xs text-[#4A5D23]/60 mt-0.5">No hay productos en vitrina que coincidan con "{{ searchQuery }}"</p>
        <button 
          v-if="searchQuery" 
          @click="clearSearch" 
          type="button" 
          class="mt-3 px-3.5 py-1.5 text-xs font-bold text-[#4A5D23] bg-[#F4F1E1] hover:bg-[#4A5D23] hover:text-white rounded-xl transition-all cursor-pointer shadow-2xs"
        >
          Limpiar búsqueda
        </button>
      </div>

      <template v-else>
        <!-- Vista Móvil (< md): Mobile Cards Táctiles con Barra de Acciones Inferior (Opción 1) -->
        <TransitionGroup
          name="product-card"
          tag="div"
          class="space-y-3 md:hidden relative"
        >
          <div
            v-for="item in paginatedCatalog"
            :key="item.id"
            class="bg-white rounded-2xl border border-[#4A5D23]/10 shadow-soft-sm overflow-hidden flex flex-col justify-between transition-all hover:border-[#4A5D23]/25"
          >
            <!-- Cabecera de la Tarjeta (Top Body) -->
            <div class="p-3.5 flex items-start justify-between gap-3">
              <!-- Izquierda: Miniatura (48x48px) + Nombre + ID -->
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-12 h-12 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 overflow-hidden shrink-0 flex items-center justify-center">
                  <img 
                    v-if="item.image_url" 
                    :src="item.image_url" 
                    :alt="item.name" 
                    class="w-full h-full object-cover" 
                  />
                  <Icon v-else :name="getProductIcon(item.name)" class="w-6 h-6 text-[#4A5D23]/60" />
                </div>
                <div class="min-w-0">
                  <h4 class="font-bold text-sm text-[#2A321B] truncate leading-snug">{{ item.name }}</h4>
                  <p class="text-[11px] text-[#4A5D23]/60 font-mono mt-0.5">ID: #{{ item.id }}</p>
                </div>
              </div>

              <!-- Derecha: Precio destacado + Badge de disponibilidad -->
              <div class="text-right shrink-0 flex flex-col items-end gap-1">
                <span class="font-black text-sm text-[#2A321B] font-inter">
                  S/ {{ Number(item.price).toFixed(2) }}
                </span>
                <span 
                  :class="[
                    'inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border',
                    (item.stock ?? 0) <= 5 && (item.stock ?? 0) > 0 
                      ? 'bg-red-50 text-status-danger border-red-200' 
                      : (item.stock ?? 0) === 0 
                        ? 'bg-gray-100 text-gray-700 border-gray-200' 
                        : 'bg-brand-cream/60 text-brand-secondary border-brand-primary/20'
                  ]"
                >
                  {{ (item.stock ?? 0) === 0 ? 'Agotado' : `${item.stock ?? 0} disp.` }}
                </span>
              </div>
            </div>

            <!-- Pie de la Tarjeta: Barra de Acciones para el Pulgar -->
            <div class="border-t border-[#4A5D23]/10 bg-[#F4F1E1]/30 grid grid-cols-3 divide-x divide-[#4A5D23]/10">
              <!-- 1. Escandallo -->
              <button
                @click="emit('view-recipe', item)"
                type="button"
                class="h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-[#4A5D23] hover:bg-[#F4F1E1] active:bg-[#4A5D23]/15 transition-colors cursor-pointer"
                aria-label="Ver escandallo y receta del producto"
              >
                <Icon name="lucide:calculator" class="w-4 h-4" />
                <span>Escandallo</span>
              </button>

              <!-- 2. Editar -->
              <button
                @click="handleEditProduct(item)"
                type="button"
                class="h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-[#2A321B] hover:bg-[#F4F1E1] active:bg-[#4A5D23]/15 transition-colors cursor-pointer"
                aria-label="Editar producto"
              >
                <Icon name="lucide:pencil" class="w-3.5 h-3.5 text-[#4A5D23]" />
                <span>Editar</span>
              </button>

              <!-- 3. Eliminar -->
              <button
                @click="handleDeleteProduct(item.id, item.name)"
                type="button"
                class="h-10 flex items-center justify-center gap-1.5 text-xs font-bold text-status-danger hover:bg-red-50 active:bg-red-100 transition-colors cursor-pointer"
                aria-label="Eliminar producto"
              >
                <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Vista Escritorio (>= md): Tabla Completa -->
        <div class="hidden md:block bg-white rounded-2xl sm:rounded-[1.75rem] border border-[#4A5D23]/10 shadow-soft-sm overflow-hidden">
          <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-[#4A5D23]/10 bg-[#F4F1E1]/40">
                  <th class="py-3.5 px-5 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider">Producto</th>
                  <th class="py-3.5 px-5 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Precio</th>
                  <th class="py-3.5 px-5 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-center">Stock</th>
                  <th class="py-3.5 px-5 text-[11px] font-bold text-[#4A5D23] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <TransitionGroup
                name="product-row"
                tag="tbody"
                class="divide-y divide-[#4A5D23]/5 relative"
              >
                <tr 
                  v-for="item in paginatedCatalog" 
                  :key="item.id" 
                  class="hover:bg-[#F4F1E1]/20 transition-colors group"
                >
                  <!-- Producto: Imagen + Nombre -->
                  <td class="py-3 px-5">
                    <div class="flex items-center gap-3">
                      <div class="w-11 h-11 rounded-xl bg-[#F4F1E1] border border-[#4A5D23]/10 overflow-hidden shrink-0 flex items-center justify-center">
                        <img 
                          v-if="item.image_url" 
                          :src="item.image_url" 
                          :alt="item.name" 
                          class="w-full h-full object-cover" 
                        />
                        <Icon v-else :name="getProductIcon(item.name)" class="w-5 h-5 text-[#4A5D23]/60" />
                      </div>
                      <div>
                        <h4 class="font-bold text-sm text-[#2A321B]">{{ item.name }}</h4>
                        <p class="text-[11px] text-[#4A5D23]/60">ID: #{{ item.id }}</p>
                      </div>
                    </div>
                  </td>

                  <!-- Precio -->
                  <td class="py-3 px-5 text-right">
                    <span class="font-bold text-sm text-[#2A321B] font-inter">
                      S/ {{ Number(item.price).toFixed(2) }}
                    </span>
                  </td>

                  <!-- Stock -->
                  <td class="py-3 px-5 text-center">
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
                  <td class="py-3 px-5 text-right">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        @click="emit('view-recipe', item)"
                        type="button"
                        class="w-8 h-8 rounded-lg bg-[#F4F1E1]/60 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        aria-label="Ver Escandallo / Receta"
                      >
                        <Icon name="lucide:calculator" class="w-4 h-4" />
                      </button>
                      <button
                        @click="handleEditProduct(item)"
                        type="button"
                        class="w-8 h-8 rounded-lg bg-[#F4F1E1]/60 text-[#4A5D23] hover:bg-[#4A5D23] hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        aria-label="Editar"
                      >
                        <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
                      </button>
                      <button
                        @click="handleDeleteProduct(item.id, item.name)"
                        type="button"
                        class="w-8 h-8 rounded-lg bg-red-50 text-status-danger hover:bg-status-danger hover:text-white transition-all flex items-center justify-center shadow-xs cursor-pointer"
                        aria-label="Eliminar"
                      >
                        <Icon name="lucide:trash-2" class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </TransitionGroup>
            </table>
          </div>

          <!-- Pagination Footer de Tabla Desktop (después del 7mo elemento) -->
          <div v-if="totalPages > 1" class="flex items-center justify-between p-4 border-t border-[#4A5D23]/10 bg-[#F4F1E1]/20">
            <span class="text-xs text-[#4A5D23]/70 font-medium">
              Página {{ currentPage }} de {{ totalPages }}
            </span>
            <div class="flex items-center gap-2">
              <button
                @click="prevPage"
                :disabled="currentPage <= 1"
                type="button"
                class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Página anterior"
              >
                Anterior
              </button>
              <button
                @click="nextPage"
                :disabled="currentPage >= totalPages"
                type="button"
                class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Página siguiente"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        <!-- Paginación Mobile (< md) (después del 7mo elemento) -->
        <div 
          v-if="totalPages > 1" 
          class="flex md:hidden items-center justify-between p-3.5 rounded-2xl bg-white border border-[#4A5D23]/10 shadow-soft-sm"
        >
          <span class="text-xs text-[#4A5D23]/70 font-medium">
            Página {{ currentPage }} de {{ totalPages }}
          </span>
          <div class="flex items-center gap-1.5">
            <button
              @click="prevPage"
              :disabled="currentPage <= 1"
              type="button"
              class="px-3 py-1.5 rounded-xl border border-[#4A5D23]/20 bg-[#F4F1E1]/30 hover:bg-[#F4F1E1] text-xs font-bold text-[#2A321B] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Página anterior"
            >
              Anterior
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              type="button"
              class="px-3 py-1.5 rounded-xl border border-[#4A5D23]/20 bg-[#F4F1E1]/30 hover:bg-[#F4F1E1] text-xs font-bold text-[#2A321B] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              aria-label="Página siguiente"
            >
              Siguiente
            </button>
          </div>
        </div>
      </template>
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

<style scoped>
/* ==========================================================================
   Animación de Filtrado y Transiciones FLIP para Productos (Desktop & Mobile)
   ========================================================================== */

/* 1. Transición para filas de tabla (Desktop) */
.product-row-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.product-row-enter-active {
  transition: opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.product-row-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.product-row-leave-active {
  position: absolute;
  width: 100%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.05s ease;
}

/* 2. Transición FLIP para Mobile Cards (Mobile) */
.product-card-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

.product-card-enter-active {
  transition: opacity 0.25s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.product-card-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.product-card-leave-active {
  position: absolute;
  width: 100%;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.05s ease;
}

/* Transiciones para el botón de limpiar búsqueda */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Transición para el dropdown de sugerencias */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.22, 1, 0.36, 1);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

@media (prefers-reduced-motion: reduce) {
  .product-row-move,
  .product-row-enter-active,
  .product-row-leave-active,
  .product-card-move,
  .product-card-enter-active,
  .product-card-leave-active,
  .dropdown-enter-active,
  .dropdown-leave-active {
    transition: none !important;
    transform: none !important;
  }
}
</style>
