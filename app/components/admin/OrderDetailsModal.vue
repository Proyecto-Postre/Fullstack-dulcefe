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

const isVerifyingPayment = ref(false);

async function handlePaymentAction(action: 'verify' | 'reject'): Promise<void> {
  if (!props.order) return;
  isVerifyingPayment.value = true;

  try {
    const res = await $fetch<{
      success: boolean;
      data: {
        payment_status: 'verified' | 'rejected';
        payment_verified_at: string | null;
        payment_verified_by: string | null;
      };
    }>(`/api/admin/orders/${props.order.id}/verify-payment`, {
      method: 'POST',
      body: { action }
    });

    if (res.success && props.order) {
      props.order.payment_status = res.data.payment_status;
      props.order.payment_verified_at = res.data.payment_verified_at;
      props.order.payment_verified_by = res.data.payment_verified_by;
      emit('updated');
    }
  } catch (error: unknown) {
    const fetchErr = error as { data?: { error?: { message?: string } }; message?: string };
    alert(fetchErr.data?.error?.message || fetchErr.message || 'Error al actualizar estado del pago.');
  } finally {
    isVerifyingPayment.value = false;
  }
}

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
            >Detalles del Pedido</span>
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
                >Nombre del Cliente</label>
                <input
                  v-model="editData.full_name"
                  type="text"
                  class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                >Teléfono (WhatsApp)</label>
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
                >Fecha de Entrega</label>
                <input
                  v-model="editData.delivery_date"
                  type="date"
                  class="w-full px-3 py-2 bg-white rounded-lg border border-[#4A5D23]/20 text-sm font-bold text-[#2A321B] focus:outline-none focus:border-[#4A5D23]"
                />
              </div>
              <div>
                <label
                  class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-wider mb-1"
                >Hora de Entrega</label>
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
              >Notas del Pedido</label>
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

          <!-- Información y Validación de Pago (ADR-005) -->
          <div class="p-4 rounded-xl border border-[#4A5D23]/10 bg-white shadow-xs space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon name="lucide:credit-card" class="w-4 h-4 text-[#4A5D23]" />
                <h5 class="text-xs font-black text-[#2A321B] uppercase tracking-wider">
                  Información de Pago
                </h5>
              </div>
              <!-- Badge de Estado de Pago -->
              <span
                :class="[
                  'px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border flex items-center gap-1',
                  order.payment_status === 'verified'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : order.payment_status === 'rejected'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                ]"
              >
                <Icon
                  :name="
                    order.payment_status === 'verified'
                      ? 'lucide:check-circle'
                      : order.payment_status === 'rejected'
                        ? 'lucide:x-circle'
                        : 'lucide:clock'
                  "
                  class="w-3 h-3"
                />
                {{
                  order.payment_status === 'verified'
                    ? 'Verificado'
                    : order.payment_status === 'rejected'
                      ? 'Rechazado'
                      : 'Pendiente de Pago'
                }}
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span class="text-[10px] font-bold text-stone-500 uppercase">Método:</span>
                <p class="font-bold text-stone-800 capitalize">
                  {{ order.payment_method || 'Efectivo contra entrega' }}
                </p>
              </div>

              <div v-if="order.payment_reference">
                <span class="text-[10px] font-bold text-stone-500 uppercase">N° Operación:</span>
                <p class="font-mono font-bold text-stone-800">
                  {{ order.payment_reference }}
                </p>
              </div>
            </div>

            <!-- Voucher adjunto si existe -->
            <div v-if="order.payment_receipt_url" class="pt-2 border-t border-stone-100">
              <span class="text-[10px] font-bold text-stone-500 uppercase block mb-1">
                Comprobante / Voucher:
              </span>
              <div class="flex items-center gap-3">
                <a
                  :href="order.payment_receipt_url"
                  target="_blank"
                  class="group relative block w-16 h-16 rounded-lg overflow-hidden border border-stone-200 shadow-xs hover:border-[#4A5D23] transition shrink-0"
                >
                  <img
                    :src="order.payment_receipt_url"
                    alt="Voucher de pago"
                    class="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                  <div class="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                    <Icon name="lucide:external-link" class="w-4 h-4" />
                  </div>
                </a>
                <div class="flex-1">
                  <a
                    :href="order.payment_receipt_url"
                    target="_blank"
                    class="text-xs font-bold text-[#4A5D23] hover:underline flex items-center gap-1"
                  >
                    <span>Ver voucher completo</span>
                    <Icon name="lucide:external-link" class="w-3 h-3" />
                  </a>
                  <p class="text-[10px] text-stone-400">Clic para abrir en tamaño completo</p>
                </div>
              </div>
            </div>

            <!-- Botones de Validación en 1-Click -->
            <div
              v-if="order.payment_method && order.payment_method !== 'cash'"
              class="pt-2 flex items-center gap-2"
            >
              <button
                v-if="order.payment_status !== 'verified'"
                type="button"
                :disabled="isVerifyingPayment"
                @click="handlePaymentAction('verify')"
                class="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5" />
                <span>Confirmar Pago Válido</span>
              </button>

              <button
                v-if="order.payment_status !== 'rejected'"
                type="button"
                :disabled="isVerifyingPayment"
                @click="handlePaymentAction('reject')"
                class="py-2 px-3 bg-red-100 hover:bg-red-200 active:scale-98 text-red-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Icon name="lucide:x-circle" class="w-3.5 h-3.5" />
                <span>Rechazar Pago</span>
              </button>
            </div>
          </div>

          <!-- Lista de Productos -->
          <div>
            <h4
              class="font-bold text-[#2A321B] text-sm mb-3 flex items-center justify-between"
            >
              <span>Productos Solicitados</span>
              <span class="text-xs font-medium text-[#4A5D23]/70">{{ order.order_items?.length || 0 }} items</span>
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

          <!-- Resumen de Escandallo y Margen Bruto (ADR-008) -->
          <div
            v-if="order.total_cost_cents != null && order.gross_margin_cents != null"
            class="p-4 rounded-xl border border-stone-200 bg-stone-50/80 shadow-xs space-y-2"
          >
            <div class="flex items-center justify-between">
              <span class="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <Icon name="lucide:calculator" class="w-4 h-4 text-[#4A5D23]" />
                Escandallo Financiero (COGS Congelado)
              </span>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Margen {{ (((order.gross_margin_cents) / ((order.total_amount ?? 1) * 100)) * 100).toFixed(1) }}%
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span class="text-[10px] text-stone-500 uppercase">Costo Insumos:</span>
                <p class="font-mono font-bold text-stone-700">
                  S/ {{ (order.total_cost_cents / 100).toFixed(2) }}
                </p>
              </div>
              <div>
                <span class="text-[10px] text-stone-500 uppercase">Margen Bruto:</span>
                <p class="font-mono font-bold text-emerald-700">
                  S/ {{ (order.gross_margin_cents / 100).toFixed(2) }}
                </p>
              </div>
              <div class="col-span-2 sm:col-span-1">
                <span class="text-[10px] text-stone-500 uppercase">Estado:</span>
                <p class="font-bold text-stone-800">Snapshot Inmutable</p>
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
