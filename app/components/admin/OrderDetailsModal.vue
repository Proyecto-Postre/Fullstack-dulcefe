<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { AdminOrder } from "~/types/admin-orders";

const props = defineProps<{
  show: boolean;
  order: AdminOrder | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const isEditing = ref(false);
const isSaving = ref(false);
const editData = ref({
  full_name: "",
  phone: "",
  delivery_date: "",
  delivery_time: "",
  notes: "",
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal && props.order) {
      isEditing.value = false;
      editData.value = {
        full_name: props.order.profiles?.full_name || props.order.customer_name || "",
        phone: props.order.profiles?.phone || props.order.customer_phone || "",
        delivery_date: props.order.delivery_date || "",
        delivery_time: props.order.delivery_time || "",
        notes: props.order.notes || "",
      };
    }
  },
);

function closeModal(): void {
  isEditing.value = false;
  emit("close");
}

async function saveChanges(): Promise<void> {
  if (!props.order) return;
  isSaving.value = true;

  try {
    await $fetch(`/api/admin/orders/${props.order.id}`, {
      method: "PATCH",
      body: {
        customer_name: editData.value.full_name,
        customer_phone: editData.value.phone,
        full_name: editData.value.full_name,
        phone: editData.value.phone,
        delivery_date: editData.value.delivery_date || null,
        delivery_time: editData.value.delivery_time || null,
        notes: editData.value.notes || null,
      },
    });

    // Update local state optimistically
    if (props.order.profiles) {
      props.order.profiles.full_name = editData.value.full_name;
      props.order.profiles.phone = editData.value.phone;
    }
    props.order.customer_name = editData.value.full_name;
    props.order.customer_phone = editData.value.phone;
    props.order.delivery_date = editData.value.delivery_date;
    props.order.delivery_time = editData.value.delivery_time;
    props.order.notes = editData.value.notes;

    isEditing.value = false;
    emit("updated");
  } catch (error: unknown) {
    const fetchErr = error as { data?: { error?: { message?: string } }; message?: string };
    const msg = fetchErr.data?.error?.message || fetchErr.message || "Hubo un error al guardar los cambios.";
    alert(msg);
  } finally {
    isSaving.value = false;
  }
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const customerName = computed<string>(
  () => props.order?.profiles?.full_name || props.order?.customer_name || "Cliente sin nombre",
);
const customerPhone = computed<string>(
  () => props.order?.profiles?.phone || props.order?.customer_phone || "",
);

const openWhatsApp = (): void => {
  if (!customerPhone.value) return;
  const phone = customerPhone.value.replace(/\D/g, "");
  const message = encodeURIComponent(
    `Hola ${customerName.value}, te escribimos de Dulce Fe sobre tu pedido.`,
  );
  window.open(`https://wa.me/51${phone}?text=${message}`, "_blank");
};
</script>

<template>
  <Teleport to="#admin-modal-portal">
    <div
      v-if="show && order"
      class="absolute inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto custom-scrollbar pointer-events-auto"
    >
      <div
        class="absolute inset-0 bg-[#2A321B]/40 backdrop-blur-sm"
        @click="closeModal"
      ></div>

      <div
        class="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-pop flex flex-col max-h-[85vh]"
      >
        <!-- Header del Modal -->
        <div
          class="p-6 bg-[#F4F1E1]/30 border-b border-[#4A5D23]/10 flex items-center justify-between shrink-0"
        >
          <div>
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]"
              >Detalles del Pedido</span
            >
            <h3 class="text-xl font-playfair font-black text-[#2A321B]">
              #{{ order.id.split("-")[0] }}
            </h3>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!isEditing"
              @click="isEditing = true"
              type="button"
              class="px-3 py-1.5 rounded-lg border border-[#4A5D23]/20 bg-white text-xs font-bold text-[#4A5D23] hover:bg-[#F4F1E1] transition-all flex items-center gap-1 cursor-pointer"
            >
              <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              @click="closeModal"
              type="button"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] hover:bg-[#e6e2cc] hover:scale-105 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Contenido -->
        <div class="p-6 overflow-y-auto custom-scrollbar space-y-6 flex-1">
          <!-- Modo Edición Formulario -->
          <div
            v-if="isEditing"
            class="space-y-4 bg-[#F4F1E1]/20 p-4 rounded-xl border border-[#4A5D23]/10"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                  >Nombre del Cliente</label
                >
                <input
                  v-model="editData.full_name"
                  type="text"
                  class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                  >Teléfono (WhatsApp)</label
                >
                <input
                  v-model="editData.phone"
                  type="text"
                  class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                  >Fecha de Entrega</label
                >
                <input
                  v-model="editData.delivery_date"
                  type="date"
                  class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                  >Hora de Entrega</label
                >
                <input
                  v-model="editData.delivery_time"
                  type="time"
                  class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
            </div>

            <div>
              <label
                class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                >Notas del Pedido</label
              >
              <textarea
                v-model="editData.notes"
                rows="2"
                class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-medium text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
              ></textarea>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                @click="isEditing = false"
                class="px-4 py-2 rounded-lg border border-[#4A5D23]/20 text-xs font-bold text-[#2A321B] hover:bg-white transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                @click="saveChanges"
                :disabled="isSaving"
                class="px-4 py-2 rounded-lg bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Icon
                  v-if="isSaving"
                  name="lucide:loader-2"
                  class="w-4 h-4 animate-spin"
                />
                {{ isSaving ? "Guardando..." : "Guardar Cambios" }}
              </button>
            </div>
          </div>

          <!-- Información del Cliente (Modo Vista) -->
          <div
            v-else
            class="bg-[#F4F1E1]/30 p-4 rounded-xl border border-[#4A5D23]/10 flex items-center justify-between"
          >
            <div>
              <p
                class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]/60"
              >
                Cliente
              </p>
              <h4 class="font-bold text-[#2A321B] text-base">
                {{ customerName }}
              </h4>
              <p
                v-if="customerPhone"
                class="text-xs text-[#4A5D23] font-medium mt-0.5"
              >
                {{ customerPhone }}
              </p>
            </div>
            <button
              v-if="customerPhone"
              @click="openWhatsApp"
              type="button"
              class="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <Icon name="lucide:message-circle" class="w-4 h-4" />
              WhatsApp
            </button>
          </div>

          <!-- Entrega y Notas -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              class="p-4 rounded-xl border border-[#4A5D23]/10 bg-white shadow-xs"
            >
              <p
                class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]/60 mb-1"
              >
                Fecha y Hora de Entrega
              </p>
              <p
                v-if="order.delivery_date || order.delivery_time"
                class="font-bold text-[#991B1B] text-sm flex items-center gap-1.5"
              >
                <Icon name="lucide:calendar-clock" class="w-4 h-4" />
                {{ order.delivery_date }} {{ order.delivery_time }}
              </p>
              <p v-else class="text-xs text-gray-400 italic">No especificada</p>
            </div>

            <div
              class="p-4 rounded-xl border border-[#4A5D23]/10 bg-white shadow-xs"
            >
              <p
                class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]/60 mb-1"
              >
                Dirección
              </p>
              <p v-if="order.address" class="text-xs font-bold text-[#2A321B]">
                {{ order.address }}
              </p>
              <p v-else class="text-xs text-gray-400 italic">
                Recojo en tienda / No especificada
              </p>
            </div>
          </div>

          <!-- Notas -->
          <div
            v-if="order.notes"
            class="p-4 rounded-xl border border-[#4A5D23]/10 bg-amber-50/50"
          >
            <p
              class="text-[10px] font-bold uppercase tracking-wider text-amber-800/60 mb-1"
            >
              Notas del Cliente
            </p>
            <p class="text-xs text-amber-900 font-medium whitespace-pre-wrap">
              {{ order.notes }}
            </p>
          </div>

          <!-- Lista de Productos -->
          <div>
            <h4
              class="font-bold text-[#2A321B] text-sm mb-3 flex items-center justify-between"
            >
              <span>Productos Solicitados</span>
              <span class="text-xs font-medium text-[#4A5D23]/70"
                >{{ order.order_items?.length || 0 }} items</span
              >
            </h4>
            <div
              class="border border-[#4A5D23]/10 rounded-xl overflow-hidden divide-y divide-[#4A5D23]/10"
            >
              <div
                v-for="item in order.order_items"
                :key="item.id"
                class="p-3 flex items-center justify-between bg-white hover:bg-[#F4F1E1]/20 transition-colors"
              >
                <div class="flex items-center gap-3">
                  <span
                    class="w-6 h-6 rounded-md bg-[#F4F1E1] border border-[#4A5D23]/10 flex items-center justify-center text-xs font-black text-[#4A5D23]"
                  >
                    {{ item.quantity }}
                  </span>
                  <div>
                    <p class="text-xs font-bold text-[#2A321B]">
                      {{ item.products?.name || "Producto" }}
                    </p>
                    <p class="text-[10px] text-[#4A5D23]/60 font-medium">
                      S/ {{ Number(item.price_at_time).toFixed(2) }} c/u
                    </p>
                  </div>
                </div>
                <p class="text-xs font-black text-[#2A321B]">
                  S/ {{ (item.quantity * item.price_at_time).toFixed(2) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer del Modal -->
        <div
          class="p-4 sm:p-6 bg-[#F4F1E1]/30 border-t border-[#4A5D23]/10 flex items-center justify-between shrink-0"
        >
          <div>
            <p
              class="text-[10px] font-bold uppercase tracking-wider text-[#4A5D23]/60"
            >
              Total del Pedido
            </p>
            <p class="text-2xl font-black text-[#2A321B]">
              S/ {{ Number(order.total_amount ?? order.total_price ?? 0).toFixed(2) }}
            </p>
          </div>
          <button
            @click="closeModal"
            type="button"
            class="px-6 py-2.5 rounded-xl bg-[#4A5D23] text-white text-xs font-bold hover:bg-[#3C4A1C] transition-all shadow-sm cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
