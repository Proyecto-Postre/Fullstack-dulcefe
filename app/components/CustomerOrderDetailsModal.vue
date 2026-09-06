<script setup lang="ts">
import { computed } from "vue";
import type { ProfileOrder } from "~/types/profile";

const props = defineProps<{
  show: boolean;
  order: ProfileOrder | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

function closeModal() {
  emit("close");
}

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getStatusText = (status: string | null) => {
  if (!status) return 'Desconocido'
  const map: Record<string, string> = {
    pending: 'Pendiente',
    processing: 'En Preparación',
    completed: 'Completado',
    cancelled: 'Cancelado'
  }
  return map[status] || status
}

const getStatusColor = (status: string | null) => {
  if (!status) return 'bg-gray-100 text-gray-800'
  const map: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}
</script>

<template>
  <div
    v-if="show && order"
    class="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar"
  >
    <div
      class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm"
      @click="closeModal"
    ></div>

    <div
      class="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop flex flex-col max-h-[85vh]"
    >
      <!-- Header -->
      <div
        class="p-5 sm:p-6 bg-[#F4F1E1]/30 border-b border-[#4A5D23]/10 flex items-center justify-between shrink-0"
      >
        <div>
          <h3
            class="text-xl font-playfair font-black text-[#2A321B] flex items-center gap-2"
          >
            <Icon name="lucide:receipt" class="w-5 h-5 text-[#4A5D23]" />
            Detalle de tu Pedido
          </h3>
          <p class="text-xs text-[#4A5D23]/70 font-bold mt-1">
            ID: {{ order.id.split("-")[0] }} •
            {{ formatDate(order.created_at) }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span :class="['px-3 py-1 rounded-lg text-xs font-bold shadow-sm', getStatusColor(order.status)]">
            {{ getStatusText(order.status) }}
          </span>
          <button
            @click="closeModal"
            class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <Icon name="lucide:x" class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
        
        <!-- Datos de Entrega -->
        <section v-if="order.delivery_date || order.delivery_time || order.notes">
          <h4
            class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-3"
          >
            Datos de Entrega
          </h4>
          <div class="bg-[#F4F1E1]/50 p-5 rounded-2xl border border-[#4A5D23]/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div v-if="order.delivery_date || order.delivery_time">
              <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1">Entrega Programada</p>
              <p class="text-sm font-bold text-[#2A321B] flex items-center gap-1.5">
                <Icon name="lucide:calendar-clock" class="w-4 h-4 text-[#4A5D23]" />
                {{ order.delivery_date || 'Sin fecha' }} {{ order.delivery_time ? `a las ${order.delivery_time}` : '' }}
              </p>
            </div>
            <div v-if="order.notes">
              <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1">Tus Notas</p>
              <p class="text-sm font-medium text-[#2A321B] bg-white p-2.5 rounded-lg border border-[#4A5D23]/10 whitespace-pre-wrap">
                {{ order.notes }}
              </p>
            </div>
          </div>
        </section>

        <!-- Productos -->
        <section>
          <h4
            class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-3"
          >
            Productos Solicitados
          </h4>
          <div class="border border-[#4A5D23]/10 rounded-xl overflow-hidden">
            <table class="w-full text-left text-sm">
              <thead class="bg-[#F4F1E1]/50">
                <tr>
                  <th class="px-4 py-3 font-bold text-[#4A5D23]">Cant.</th>
                  <th class="px-4 py-3 font-bold text-[#4A5D23]">Producto</th>
                  <th class="px-4 py-3 font-bold text-[#4A5D23] text-right">Precio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-[#4A5D23]/10">
                <tr
                  v-for="(item, index) in order.order_items"
                  :key="index"
                  class="bg-white"
                >
                  <td class="px-4 py-3 font-black text-[#2A321B] w-16">
                    {{ item.quantity }}x
                  </td>
                  <td class="px-4 py-3 font-medium text-[#2A321B]">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-md bg-[#F4F1E1] overflow-hidden shrink-0 hidden sm:block">
                        <img v-if="item.products?.image_url" :src="item.products.image_url" class="w-full h-full object-cover" />
                        <div v-else class="w-full h-full flex items-center justify-center text-[#4A5D23]/50">
                          <Icon name="lucide:croissant" class="w-4 h-4" />
                        </div>
                      </div>
                      {{ item.products?.name || "Producto Desconocido" }}
                    </div>
                  </td>
                  <td class="px-4 py-3 font-bold text-[#2A321B] text-right">
                    S/ {{ Number(item.price_at_time).toFixed(2) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Resumen Financiero -->
        <section>
          <h4
            class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-3"
          >
            Resumen Financiero
          </h4>
          <div
            class="bg-[#4A5D23] text-white p-5 rounded-xl shadow-sm flex items-center justify-between"
          >
            <div>
              <p class="text-white/70 text-xs font-medium mb-1">Total del Pedido</p>
              <p class="text-2xl font-black">
                S/ {{ Number(order.total_amount).toFixed(2) }}
              </p>
            </div>
            <div
              class="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center"
            >
              <Icon name="lucide:banknote" class="w-6 h-6 text-white" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-pop {
  animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
}
@keyframes pop {
  0% {
    opacity: 0;
    transform: scale(0.95);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.custom-scrollbar::-webkit-scrollbar {
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
