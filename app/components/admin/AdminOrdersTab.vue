<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useSupabaseClient } from "#imports";

const supabase = useSupabaseClient();

const orders = ref<any[]>([]);
const isLoading = ref(true);
const viewMode = ref<"kanban" | "list">("kanban");

// Modal state
const showOrderModal = ref(false);
const selectedOrder = ref<any>(null);
const showNewOrderModal = ref(false);

function openOrderDetails(order: any) {
  selectedOrder.value = order;
  showOrderModal.value = true;
}

// Definición de las columnas del Kanban
const columns = [
  {
    id: "pending",
    title: "Pendientes",
    color:
      "bg-gradient-to-b from-yellow-50 to-yellow-100/50 border-yellow-200 text-yellow-800",
    icon: "lucide:clock",
    headerColor: "bg-yellow-100/80",
  },
  {
    id: "processing",
    title: "Horneando",
    color:
      "bg-gradient-to-b from-orange-50 to-orange-100/50 border-orange-200 text-orange-800",
    icon: "lucide:chef-hat",
    headerColor: "bg-orange-100/80",
  },
  {
    id: "ready",
    title: "Listo para Despacho",
    color:
      "bg-gradient-to-b from-blue-50 to-blue-100/50 border-blue-200 text-blue-800",
    icon: "lucide:package",
    headerColor: "bg-blue-100/80",
  },
  {
    id: "completed",
    title: "Entregado",
    color:
      "bg-gradient-to-b from-green-50 to-green-100/50 border-green-200 text-green-800",
    icon: "lucide:check-circle",
    headerColor: "bg-green-100/80",
  },
];

const fetchOrders = async () => {
  isLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        profiles ( full_name, phone ),
        order_items (
          quantity,
          products ( name )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    orders.value = data || [];
  } catch (err) {
    console.error("Error fetching orders:", err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  fetchOrders();
});

// Lógica de Drag and Drop
const draggedOrder = ref<any>(null);

const onDragStart = (order: any, event: DragEvent) => {
  draggedOrder.value = order;
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", order.id);
  }
};

const onDrop = async (columnId: string, event: DragEvent) => {
  if (!draggedOrder.value) return;

  const orderId = draggedOrder.value.id;
  const oldStatus = draggedOrder.value.status;
  const newStatus = columnId;

  if (oldStatus === newStatus) return;

  // Optimistic UI update
  const orderIndex = orders.value.findIndex((o) => o.id === orderId);
  if (orderIndex !== -1) {
    orders.value[orderIndex].status = newStatus;
  }

  try {
    // 1. Actualizar estado en la BD
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) throw error;

    // 2. Si pasa a "Horneando" (processing), ejecutar el trigger de inventario
    if (newStatus === "processing" && oldStatus === "pending") {
      const { error: rpcError } = await supabase.rpc(
        "process_order_inventory",
        {
          order_uuid: orderId,
        },
      );
      if (rpcError) {
        console.error("Error al descontar inventario:", rpcError);
        alert(
          "El pedido se movió a Horneando, pero hubo un error al descontar el inventario. Revisa la consola.",
        );
      }
    }

    // 3. Si pasa a "Entregado" (completed), otorgar puntos de lealtad
    if (newStatus === "completed" && oldStatus !== "completed") {
      const { error: pointsError } = await supabase.rpc(
        "award_loyalty_points",
        {
          order_uuid: orderId,
        },
      );
      if (pointsError) {
        console.error("Error al otorgar puntos de lealtad:", pointsError);
        // No mostramos alert para no interrumpir el flujo, pero queda registrado
      }
    }
  } catch (err) {
    console.error("Error updating order status:", err);
    // Revertir cambio en UI si falla
    if (orderIndex !== -1) {
      orders.value[orderIndex].status = oldStatus;
    }
    alert("Hubo un error al mover el pedido.");
  } finally {
    draggedOrder.value = null;
  }
};

const getOrdersByStatus = (status: string) => {
  return orders.value.filter((o) => o.status === status);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-2xl font-playfair font-black text-[#2A321B]">
        Gestión de Pedidos
      </h2>
      <div class="flex items-center gap-4">
        <button
          @click="showNewOrderModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-[#4A5D23] text-white rounded-xl font-bold text-sm shadow-sm hover:bg-[#3C4A1C] active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          Nuevo Pedido
        </button>
        <button
          @click="fetchOrders"
          class="flex items-center gap-2 px-4 py-2 bg-white border border-[#4A5D23]/20 rounded-xl font-bold text-sm shadow-sm hover:bg-[#F4F1E1] active:translate-y-0.5 active:shadow-none transition-all"
        >
          <Icon
            name="lucide:refresh-cw"
            :class="['w-4 h-4', isLoading ? 'animate-spin' : '']"
          />
          Actualizar
        </button>
        <div
          class="bg-white p-1 rounded-xl border border-[#4A5D23]/20 shadow-sm flex items-center"
        >
          <button
            @click="viewMode = 'list'"
            :class="[
              'px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2',
              viewMode === 'list'
                ? 'bg-[#4A5D23] text-white'
                : 'text-[#4A5D23]/60 hover:text-[#4A5D23]',
            ]"
          >
            <Icon name="lucide:list" class="w-4 h-4" />
            Lista
          </button>
          <button
            @click="viewMode = 'kanban'"
            :class="[
              'px-4 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-2',
              viewMode === 'kanban'
                ? 'bg-[#4A5D23] text-white'
                : 'text-[#4A5D23]/60 hover:text-[#4A5D23]',
            ]"
          >
            <Icon name="lucide:square-kanban" class="w-4 h-4" />
            Kanban
          </button>
        </div>
      </div>
    </div>

    <!-- Kanban Board -->
    <div
      v-if="viewMode === 'kanban'"
      class="grid grid-cols-1 lg:grid-cols-4 gap-6 pb-4 min-h-[600px]"
    >
      <!-- Columnas -->
      <div
        v-for="col in columns"
        :key="col.id"
        :class="[
          'border rounded-2xl flex flex-col shadow-sm overflow-hidden',
          col.color,
        ]"
        @dragover.prevent
        @dragenter.prevent
        @drop="onDrop(col.id, $event)"
      >
        <!-- Header de Columna -->
        <div
          :class="[
            'p-4 border-b border-current/10 flex items-center gap-3 backdrop-blur-sm',
            col.headerColor,
          ]"
        >
          <div class="p-1.5 bg-white/60 rounded-lg shadow-sm">
            <Icon :name="col.icon" class="w-4 h-4" />
          </div>
          <h3 class="font-bold uppercase tracking-wider text-xs flex-1">
            {{ col.title }}
          </h3>
          <span
            class="bg-white px-2.5 py-1 rounded-md text-xs font-black border border-current/10 shadow-sm"
          >
            {{ getOrdersByStatus(col.id).length }}
          </span>
        </div>

        <!-- Lista de Tarjetas -->
        <div class="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
          <div
            v-if="isLoading && getOrdersByStatus(col.id).length === 0"
            class="text-center py-8 opacity-50"
          >
            <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin mx-auto" />
          </div>

          <div
            v-else-if="getOrdersByStatus(col.id).length === 0"
            class="text-center py-8 opacity-50 border border-dashed border-[#4A5D23]/30 rounded-xl bg-white/50"
          >
            <p
              class="text-xs font-bold uppercase tracking-widest text-[#4A5D23]"
            >
              Vacío
            </p>
          </div>

          <!-- Tarjeta de Pedido -->
          <div
            v-for="order in getOrdersByStatus(col.id)"
            :key="order.id"
            draggable="true"
            @dragstart="onDragStart(order, $event)"
            @click="openOrderDetails(order)"
            class="bg-white border border-current/10 rounded-xl p-4 cursor-pointer hover:-translate-y-1 hover:shadow-md transition-all shadow-sm group flex flex-col gap-3"
          >
            <!-- Header: Nombre y Precio -->
            <div class="flex justify-between items-start">
              <div>
                <h4
                  class="font-bold text-[#2A321B] text-sm group-hover:text-current transition-colors leading-tight"
                >
                  {{ order.profiles?.full_name || "Cliente Anónimo" }}
                </h4>
                <p
                  v-if="order.profiles?.phone"
                  class="text-[10px] text-current/70 flex items-center gap-1 mt-1 font-medium"
                >
                  <Icon name="lucide:phone" class="w-3 h-3" />
                  {{ order.profiles.phone }}
                </p>
              </div>
              <span
                class="font-black text-[#2A321B] bg-[#F4F1E1] px-2 py-1 rounded-md text-xs border border-[#4A5D23]/10 shrink-0"
                >S/ {{ Number(order.total_amount).toFixed(2) }}</span
              >
            </div>

            <!-- Items del Pedido -->
            <div
              class="space-y-1.5 bg-current/5 p-2.5 rounded-lg border border-current/10"
            >
              <div
                v-for="(item, idx) in order.order_items"
                :key="idx"
                class="text-[11px] font-medium flex items-start gap-2 text-[#2A321B]"
              >
                <span
                  class="font-black text-current bg-white px-1.5 py-0.5 rounded shadow-sm shrink-0"
                  >{{ item.quantity }}x</span
                >
                <span class="leading-tight pt-0.5">{{
                  item.products?.name
                }}</span>
              </div>
            </div>

            <!-- Footer: Fechas -->
            <div
              class="flex flex-col gap-1.5 pt-2 border-t border-dashed border-current/10 mt-auto"
            >
              <div
                v-if="order.delivery_date || order.delivery_time"
                class="text-[10px] font-bold text-[#991B1B] flex items-center gap-1.5"
              >
                <Icon name="lucide:calendar-clock" class="w-3.5 h-3.5" />
                Para: {{ order.delivery_date }} {{ order.delivery_time }}
              </div>
              <div
                class="text-[9px] font-bold text-current/60 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Icon name="lucide:clock-4" class="w-3 h-3" />
                Creado: {{ formatDate(order.created_at) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- LIST VIEW -->
    <div
      v-else-if="viewMode === 'list'"
      class="bg-white rounded-[2rem] border border-[#4A5D23]/10 shadow-sm overflow-hidden"
    >
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-sm">
          <thead>
            <tr
              class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest border-b border-[#4A5D23]/10 bg-[#F4F1E1]/30"
            >
              <th class="py-4 pl-6">ID / Fecha</th>
              <th class="py-4">Cliente</th>
              <th class="py-4">Contacto</th>
              <th class="py-4 text-center">Total</th>
              <th class="py-4 text-center">Estado</th>
              <th class="py-4 text-right pr-6">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[#4A5D23]/10">
            <tr
              v-for="order in orders"
              :key="order.id"
              class="hover:bg-[#F4F1E1]/30 transition-colors cursor-pointer"
              @click="openOrderDetails(order)"
            >
              <td class="py-4 pl-6">
                <p class="font-bold text-[#2A321B]">
                  {{ order.id.split("-")[0] }}
                </p>
                <p class="text-[10px] text-[#4A5D23]/70 font-medium">
                  {{ new Date(order.created_at).toLocaleDateString("es-PE") }}
                </p>
              </td>
              <td class="py-4 font-bold text-[#2A321B]">
                {{ order.profiles?.full_name || "Sin nombre" }}
              </td>
              <td class="py-4 text-[#4A5D23]/80 font-medium">
                {{ order.profiles?.phone || "Sin teléfono" }}
              </td>
              <td class="py-4 text-center font-black text-[#4A5D23]">
                S/ {{ Number(order.total_amount).toFixed(2) }}
              </td>
              <td class="py-4 text-center">
                <span
                  :class="[
                    'px-3 py-1 rounded-md text-xs font-bold',
                    order.status === 'pending'
                      ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                      : order.status === 'processing'
                        ? 'bg-orange-50 text-orange-700 border border-orange-200'
                        : order.status === 'ready'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-green-50 text-green-700 border border-green-200',
                  ]"
                >
                  {{
                    columns.find((c) => c.id === order.status)?.title ||
                    order.status
                  }}
                </span>
              </td>
              <td class="py-4 text-right pr-6">
                <button
                  @click.stop="openOrderDetails(order)"
                  class="text-[#4A5D23] hover:bg-[#4A5D23]/10 p-2 rounded-lg transition-colors"
                  title="Ver Detalles"
                >
                  <Icon name="lucide:eye" class="w-5 h-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Detalles del Pedido -->
    <AdminOrderDetailsModal
      :show="showOrderModal"
      :order="selectedOrder"
      @close="showOrderModal = false"
      @updated="fetchOrders"
    />

    <!-- Modal de Nuevo Pedido Manual -->
    <AdminNewOrderModal
      :show="showNewOrderModal"
      @close="showNewOrderModal = false"
      @created="fetchOrders"
    />
  </div>
</template>

<style scoped>
/* Hide scrollbar for Chrome, Safari and Opera */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.hide-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}
</style>
