<script setup lang="ts">
import { ref, computed, watch } from "vue";

const props = defineProps<{
  catalog: any;
  pendingCatalog: boolean;
}>();

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "view-recipe", product: any): void;
}>();

// Modal State
const showModal = ref(false);
const productToEdit = ref<any | null>(null);

function openNewProductModal() {
  productToEdit.value = null;
  showModal.value = true;
}

function handleEditProduct(item: any) {
  productToEdit.value = item;
  showModal.value = true;
}

function handleProductSaved(savedProduct: any, isNew: boolean) {
  emit("refresh");
  if (isNew) {
    emit("view-recipe", savedProduct);
  }
}

// Local state for Optimistic UI
const localCatalog = ref<any[]>([]);

watch(() => props.catalog?.data, (newData) => {
  if (newData) {
    localCatalog.value = [...newData];
  }
}, { immediate: true });

// Pagination
const currentPage = ref(1);
const itemsPerPage = 10;

const paginatedCatalog = computed(() => {
  if (!localCatalog.value.length) return [];
  // Solo mostrar en vitrina los productos que ya tienen precio (publicados)
  const publishedProducts = localCatalog.value.filter((p: any) => p.price > 0);
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return publishedProducts.slice(start, end);
});

const totalPages = computed(() => {
  if (!localCatalog.value.length) return 1;
  const publishedProducts = localCatalog.value.filter((p: any) => p.price > 0);
  return Math.ceil(publishedProducts.length / itemsPerPage);
});

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++;
}

function prevPage() {
  if (currentPage.value > 1) currentPage.value--;
}

watch(
  () => props.catalog?.data?.length,
  () => {
    currentPage.value = 1;
  },
);

async function handleDeleteProduct(id: string, name: string) {
  if (!confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) return;
  
  // Optimistic UI update: Eliminar localmente primero para disparar la animación al instante
  const index = localCatalog.value.findIndex((p: any) => p.id === id);
  let deletedItem = null;
  if (index !== -1) {
    deletedItem = localCatalog.value[index];
    localCatalog.value.splice(index, 1);
  }

  try {
    await $fetch(`/api/products/${id}`, { method: "DELETE" });
    // No llamamos a emit("refresh") para evitar el spinner y el retraso
  } catch (err: any) {
    // Si falla, revertimos el cambio local
    if (deletedItem && index !== -1) {
      localCatalog.value.splice(index, 0, deletedItem);
    }
    alert("Error al eliminar: " + (err.data?.statusMessage || err.message));
  }
}

function getProductIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("brownie") || n.includes("box") || n.includes("caja"))
    return "lucide:package";
  if (n.includes("alfajor") || n.includes("galleta") || n.includes("cookie"))
    return "lucide:cookie";
  if (
    n.includes("torta") ||
    n.includes("pastel") ||
    n.includes("cake") ||
    n.includes("keke") ||
    n.includes("queque")
  )
    return "lucide:cake-slice";
  if (n.includes("pie") || n.includes("tart") || n.includes("kuchen"))
    return "lucide:pie-chart";
  if (n.includes("cafe") || n.includes("café") || n.includes("coffee"))
    return "lucide:coffee";
  if (n.includes("helado") || n.includes("ice cream"))
    return "lucide:ice-cream";
  return "lucide:croissant";
}
</script>

<template>
  <div class="space-y-6">
    <!-- Catálogo Completo -->
    <section class="transition-all duration-300">
      <div
        class="flex items-center justify-between mb-8 pb-4 border-b border-[#4A5D23]/10"
      >
        <div class="flex items-center gap-3">
          <Icon name="lucide:library-big" class="w-5 h-5 text-[#4A5D23]" />
          <h2
            class="text-xl font-playfair font-bold text-[#2A321B] tracking-tight"
          >
            Catálogo Publicado
          </h2>
        </div>
        <div class="flex items-center gap-4">
          <button
            @click="emit('refresh')"
            class="text-[#4A5D23]/60 hover:text-[#4A5D23] transition-colors"
            title="Actualizar"
          >
            <Icon
              name="lucide:refresh-cw"
              :class="['w-5 h-5', pendingCatalog ? 'animate-spin' : '']"
            />
          </button>
          <button
            @click="openNewProductModal"
            class="bg-[#4A5D23] text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-[#3C4A1C] transition-colors shadow-sm flex items-center gap-2"
          >
            <Icon name="lucide:plus" class="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div v-if="pendingCatalog && (!catalog?.data)" class="flex justify-center py-12">
        <Icon
          name="lucide:loader-2"
          class="w-8 h-8 animate-spin text-[#4A5D23]"
        />
      </div>

      <div
        v-else-if="!catalog?.data?.length"
        class="text-center py-12 bg-[#F4F1E1]/30 rounded-2xl border border-dashed border-[#4A5D23]/20"
      >
        <Icon
          name="lucide:cake-slice"
          class="w-12 h-12 text-[#4A5D23]/20 mx-auto mb-4"
        />
        <p class="text-[#4A5D23] font-medium">
          No hay productos en el catálogo.
        </p>
        <button
          @click="openNewProductModal"
          class="mt-4 text-sm font-bold text-[#4A5D23] hover:underline"
        >
          Crear el primer producto
        </button>
      </div>

      <TransitionGroup
        v-else
        name="list"
        tag="div"
        class="grid grid-cols-1 lg:grid-cols-2 gap-4 relative"
      >
        <div
          v-for="item in paginatedCatalog"
          :key="item.id"
          class="bg-white rounded-2xl border border-[#4A5D23]/10 shadow-sm p-4 flex items-center gap-4 hover:shadow-md transition-shadow group"
        >
          <!-- Image Section -->
          <div class="w-20 h-20 rounded-xl bg-[#F4F1E1]/50 overflow-hidden shrink-0 relative flex items-center justify-center">
            <img
              v-if="item.image_url"
              :src="item.image_url"
              class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <Icon
              v-else
              :name="getProductIcon(item.name)"
              class="w-8 h-8 text-[#4A5D23]/20 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          <!-- Content Section -->
          <div class="flex-1 min-w-0 flex flex-col justify-center">
            <div class="flex items-center gap-2 mb-1">
              <h3 class="font-bold text-[#2A321B] text-base truncate">
                {{ item.name }}
              </h3>
              <!-- Stock Badge -->
              <span
                v-if="item.stock > 5"
                class="px-2 py-0.5 rounded-md text-[9px] font-black bg-[#F4F1E1] text-[#4A5D23] shrink-0"
              >
                {{ item.stock }} UND
              </span>
              <span
                v-else-if="item.stock > 0"
                class="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-800 shrink-0"
              >
                {{ item.stock }} UND
              </span>
              <span
                v-else
                class="px-2 py-0.5 rounded-md text-[9px] font-black bg-red-100 text-red-800 shrink-0"
              >
                AGOTADO
              </span>
            </div>
            <p class="text-lg font-black text-[#4A5D23]">
              S/ {{ Number(item.price).toFixed(2) }}
            </p>
          </div>

          <!-- Actions Section -->
          <div class="flex items-center gap-2 shrink-0">
            <button
              @click="emit('view-recipe', item)"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-[#4A5D23] bg-[#F4F1E1]/50 hover:bg-[#4A5D23] hover:text-white transition-colors"
              title="Ver Receta"
            >
              <Icon name="lucide:chef-hat" class="w-5 h-5" />
            </button>
            <button
              @click="handleEditProduct(item)"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-[#4A5D23] bg-[#F4F1E1]/50 hover:bg-[#4A5D23] hover:text-white transition-colors"
              title="Editar"
            >
              <Icon name="lucide:pencil" class="w-5 h-5" />
            </button>
            <button
              @click="handleDeleteProduct(item.id, item.name)"
              class="w-10 h-10 rounded-xl flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors"
              title="Eliminar"
            >
              <Icon name="lucide:trash-2" class="w-5 h-5" />
            </button>
          </div>
        </div>
      </TransitionGroup>

      <!-- Paginación -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between mt-6 pt-6 border-t border-[#4A5D23]/10"
      >
        <span
          class="text-xs font-bold text-[#4A5D23] uppercase tracking-widest"
        >
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

/* Animaciones de Lista (Pop y Deslizamiento) */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(20px);
}

.list-leave-active {
  position: absolute;
  /* Para que no colapse el ancho al salir del flujo */
  width: calc(100% - 1rem); 
}
@media (min-width: 1024px) {
  .list-leave-active {
    width: calc(50% - 0.5rem);
  }
}
</style>
