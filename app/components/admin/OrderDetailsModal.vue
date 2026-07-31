<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useSupabaseClient } from '#imports'

const supabase = useSupabaseClient()

const props = defineProps<{
  show: boolean;
  order: any | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "updated"): void;
}>();

const isEditing = ref(false)
const isSaving = ref(false)
const editData = ref({
  full_name: '',
  phone: '',
  delivery_date: '',
  delivery_time: '',
  notes: ''
})

watch(() => props.show, (newVal) => {
  if (newVal && props.order) {
    isEditing.value = false
    editData.value = {
      full_name: props.order.profiles?.full_name || '',
      phone: props.order.profiles?.phone || '',
      delivery_date: props.order.delivery_date || '',
      delivery_time: props.order.delivery_time || '',
      notes: props.order.notes || ''
    }
  }
})

function closeModal() {
  isEditing.value = false
  emit("close");
}

async function saveChanges() {
  if (!props.order) return
  isSaving.value = true
  
  try {
    // 1. Update Profile (Name and Phone)
    if (props.order.user_id) {
      await (supabase as any)
        .from('profiles')
        .update({ 
          full_name: editData.value.full_name,
          phone: editData.value.phone
        })
        .eq('id', props.order.user_id)
    }

    // 2. Update Order (Date, Time, Notes)
    await (supabase as any)
      .from('orders')
      .update({
        delivery_date: editData.value.delivery_date || null,
        delivery_time: editData.value.delivery_time || null,
        notes: editData.value.notes || null
      })
      .eq('id', props.order.id)

    // Update local state optimistically
    if (props.order.profiles) {
      props.order.profiles.full_name = editData.value.full_name
      props.order.profiles.phone = editData.value.phone
    }
    props.order.delivery_date = editData.value.delivery_date
    props.order.delivery_time = editData.value.delivery_time
    props.order.notes = editData.value.notes

    isEditing.value = false
    emit('updated')
  } catch (error) {
    console.error('Error updating order:', error)
    alert('Hubo un error al guardar los cambios.')
  } finally {
    isSaving.value = false
  }
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

const customerName = computed(
  () => props.order?.profiles?.full_name || "Cliente sin nombre",
);
const customerPhone = computed(() => props.order?.profiles?.phone || "");

const openWhatsApp = () => {
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
        <!-- Header -->
        <div
          class="p-5 sm:p-6 bg-[#F4F1E1]/30 border-b border-[#4A5D23]/10 flex items-center justify-between shrink-0"
        >
          <div>
            <h3
              class="text-xl font-playfair font-black text-[#2A321B] flex items-center gap-2"
            >
              <Icon name="lucide:receipt" class="w-5 h-5 text-[#4A5D23]" />
              Detalle del Pedido
            </h3>
            <p class="text-xs text-[#4A5D23]/70 font-bold mt-1">
              ID: {{ order.id.split("-")[0] }} •
              {{ formatDate(order.created_at) }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="!isEditing"
              @click="isEditing = true"
              class="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-[#4A5D23]/20 text-[#4A5D23] hover:bg-[#F4F1E1] hover:scale-105 active:scale-95 transition-all shadow-sm"
              title="Editar Pedido"
            >
              <Icon name="lucide:pencil" class="w-4 h-4" />
            </button>
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
          <!-- Cliente Info -->
          <section>
            <h4
              class="text-[11px] font-bold text-[#4A5D23] uppercase tracking-widest mb-3"
            >
              Datos del Cliente y Entrega
            </h4>
            
            <!-- Modo Edición -->
            <div v-if="isEditing" class="bg-[#F4F1E1]/30 p-5 rounded-2xl border border-[#4A5D23]/20 space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Nombre</label>
                  <input v-model="editData.full_name" type="text" class="w-full px-3 py-2 bg-white rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all" />
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Teléfono</label>
                  <input v-model="editData.phone" type="text" class="w-full px-3 py-2 bg-white rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all" />
                </div>
              </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Fecha de Entrega</label>
                <CustomDatePicker v-model="editData.delivery_date" bgClass="bg-white" />
              </div>
              <div>
                <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Hora de Entrega</label>
                <CustomTimePicker v-model="editData.delivery_time" bgClass="bg-white" />
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1.5">Notas / Instrucciones</label>
              <textarea v-model="editData.notes" rows="2" class="w-full px-3 py-2 bg-white rounded-xl border border-[#4A5D23]/20 focus:outline-none focus:border-[#4A5D23] focus:ring-2 focus:ring-[#4A5D23]/10 text-sm font-bold text-[#2A321B] shadow-sm transition-all resize-none"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-2">
              <button @click="isEditing = false" class="px-4 py-2 rounded-xl text-sm font-bold text-[#4A5D23] hover:bg-[#4A5D23]/10 transition-colors">Cancelar</button>
              <button @click="saveChanges" :disabled="isSaving" class="px-5 py-2 rounded-xl text-sm font-bold bg-[#4A5D23] text-white hover:bg-[#3C4A1C] shadow-sm transition-all active:translate-y-0.5 active:shadow-none flex items-center gap-2">
                <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
                Guardar Cambios
              </button>
            </div>
          </div>

          <!-- Modo Lectura -->
          <div v-else class="bg-[#F4F1E1]/50 p-5 rounded-2xl border border-[#4A5D23]/10 flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  class="w-12 h-12 rounded-full bg-white border border-[#4A5D23]/20 flex items-center justify-center text-[#4A5D23] shadow-sm"
                >
                  <Icon name="lucide:user" class="w-6 h-6" />
                </div>
                <div>
                  <p class="font-black text-[#2A321B] text-base">
                    {{ customerName }}
                  </p>
                  <p class="text-xs text-[#4A5D23]/80 font-medium">
                    {{ customerPhone || "Sin teléfono registrado" }}
                  </p>
                </div>
              </div>
              <button
                v-if="customerPhone"
                @click="openWhatsApp"
                class="flex items-center gap-2 bg-[#25D366] text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-[#20b858] transition-all shadow-sm active:translate-y-0.5 active:shadow-none"
              >
                <Icon name="lucide:message-circle" class="w-3.5 h-3.5" />
                WhatsApp
              </button>
            </div>
            
            <div v-if="order.delivery_date || order.delivery_time || order.notes" class="pt-4 border-t border-dashed border-[#4A5D23]/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div v-if="order.delivery_date || order.delivery_time">
                <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1">Entrega Programada</p>
                <p class="text-sm font-bold text-[#2A321B] flex items-center gap-1.5">
                  <Icon name="lucide:calendar-clock" class="w-4 h-4 text-[#4A5D23]" />
                  {{ order.delivery_date || 'Sin fecha' }} {{ order.delivery_time ? `a las ${order.delivery_time}` : '' }}
                </p>
              </div>
              <div v-if="order.notes">
                <p class="text-[10px] font-bold text-[#4A5D23] uppercase tracking-widest mb-1">Notas</p>
                <p class="text-sm font-medium text-[#2A321B] bg-white p-2.5 rounded-lg border border-[#4A5D23]/10 whitespace-pre-wrap">
                  {{ order.notes }}
                </p>
              </div>
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
                    {{ item.products?.name || "Producto Desconocido" }}
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
              <p class="text-white/70 text-xs font-medium mb-1">Total Pagado</p>
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
</Teleport>
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
