<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  paymentMethod: 'cash' | 'yape' | 'plin' | 'card'
  paymentReference: string
  paymentReceiptUrl: string
}>()

const emit = defineEmits<{
  (e: 'update:paymentMethod', value: 'cash' | 'yape' | 'plin' | 'card'): void
  (e: 'update:paymentReference', value: string): void
  (e: 'update:paymentReceiptUrl', value: string): void
}>()

const isUploading = ref(false)
const uploadError = ref<string | null>(null)
const copiedNumber = ref(false)

const PHONE_NUMBER = '998 265 700'
const RECIPIENT_NAME = 'Dulce Fé Repostería Fina'

function copyPhoneNumber() {
  navigator.clipboard.writeText('998265700').catch(() => {})
  copiedNumber.value = true
  setTimeout(() => {
    copiedNumber.value = false
  }, 2500)
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  uploadError.value = null

  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'El archivo supera el límite de 2 MB.'
    target.value = ''
    return
  }

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const res = await $fetch<{ success: boolean; url: string }>('/api/checkout/upload-receipt', {
      method: 'POST',
      body: formData
    })

    if (res.success && res.url) {
      emit('update:paymentReceiptUrl', res.url)
    }
  } catch (err: unknown) {
    const fetchErr = err as { data?: { error?: { message?: string } }; message?: string }
    uploadError.value = fetchErr.data?.error?.message || fetchErr.message || 'Error al subir el comprobante.'
  } finally {
    isUploading.value = false
    target.value = ''
  }
}

function removeReceipt() {
  emit('update:paymentReceiptUrl', '')
}
</script>

<template>
  <div class="bg-white rounded-2xl border border-[#4A5D23]/15 p-5 sm:p-6 shadow-sm space-y-5">
    <div class="flex items-center gap-2.5 border-b border-[#4A5D23]/10 pb-3">
      <div class="w-8 h-8 rounded-xl bg-[#F4F1E1] text-[#4A5D23] flex items-center justify-center">
        <Icon name="lucide:credit-card" class="w-4 h-4" />
      </div>
      <div>
        <h3 class="text-sm font-black text-[#2A321B]">Método de Pago</h3>
        <p class="text-xs text-[#4A5D23]/70">Selecciona cómo deseas abonar tu pedido</p>
      </div>
    </div>

    <!-- Opciones de Pago -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <!-- Efectivo -->
      <button
        type="button"
        @click="emit('update:paymentMethod', 'cash')"
        :class="[
          'p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer',
          props.paymentMethod === 'cash'
            ? 'border-[#4A5D23] bg-[#F4F1E1]/40 shadow-xs'
            : 'border-stone-200 hover:border-stone-300 bg-white'
        ]"
      >
        <div class="flex items-center justify-between w-full">
          <Icon name="lucide:banknote" class="w-5 h-5 text-[#4A5D23]" />
          <span
            v-if="props.paymentMethod === 'cash'"
            class="w-2.5 h-2.5 rounded-full bg-[#4A5D23]"
          ></span>
        </div>
        <div>
          <p class="text-xs font-black text-[#2A321B]">Efectivo</p>
          <p class="text-[11px] text-stone-500">Contra entrega</p>
        </div>
      </button>

      <!-- Yape -->
      <button
        type="button"
        @click="emit('update:paymentMethod', 'yape')"
        :class="[
          'p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer',
          props.paymentMethod === 'yape'
            ? 'border-purple-600 bg-purple-50/60 shadow-xs'
            : 'border-stone-200 hover:border-stone-300 bg-white'
        ]"
      >
        <div class="flex items-center justify-between w-full">
          <span class="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">Y</span>
          <span
            v-if="props.paymentMethod === 'yape'"
            class="w-2.5 h-2.5 rounded-full bg-purple-600"
          ></span>
        </div>
        <div>
          <p class="text-xs font-black text-purple-900">Yape</p>
          <p class="text-[11px] text-purple-700/70">Billetera móvil</p>
        </div>
      </button>

      <!-- Plin -->
      <button
        type="button"
        @click="emit('update:paymentMethod', 'plin')"
        :class="[
          'p-3.5 rounded-xl border-2 text-left transition flex flex-col justify-between gap-2 cursor-pointer',
          props.paymentMethod === 'plin'
            ? 'border-sky-600 bg-sky-50/60 shadow-xs'
            : 'border-stone-200 hover:border-stone-300 bg-white'
        ]"
      >
        <div class="flex items-center justify-between w-full">
          <span class="w-5 h-5 rounded-full bg-sky-500 text-white text-[10px] font-black flex items-center justify-center">P</span>
          <span
            v-if="props.paymentMethod === 'plin'"
            class="w-2.5 h-2.5 rounded-full bg-sky-600"
          ></span>
        </div>
        <div>
          <p class="text-xs font-black text-sky-900">Plin</p>
          <p class="text-[11px] text-sky-700/70">Interbancario</p>
        </div>
      </button>
    </div>

    <!-- Instrucciones y Carga de Voucher para Yape o Plin -->
    <div
      v-if="props.paymentMethod === 'yape' || props.paymentMethod === 'plin'"
      class="p-4 rounded-xl border border-stone-200 bg-stone-50/80 space-y-4"
    >
      <!-- Datos de Cuenta -->
      <div class="flex flex-wrap items-center justify-between gap-2 bg-white p-3 rounded-xl border border-stone-200">
        <div>
          <p class="text-[10px] font-black uppercase text-stone-500 tracking-wider">
            {{ props.paymentMethod === 'yape' ? 'Yapear a' : 'Plinear a' }}
          </p>
          <p class="text-sm font-black text-stone-900">{{ PHONE_NUMBER }}</p>
          <p class="text-xs text-stone-500">{{ RECIPIENT_NAME }}</p>
        </div>
        <button
          type="button"
          @click="copyPhoneNumber"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold transition cursor-pointer"
        >
          <Icon :name="copiedNumber ? 'lucide:check' : 'lucide:copy'" class="w-3.5 h-3.5 text-[#4A5D23]" />
          <span>{{ copiedNumber ? '¡Copiado!' : 'Copiar número' }}</span>
        </button>
      </div>

      <!-- Input Número de Operación -->
      <div>
        <label class="block text-xs font-bold text-stone-700 mb-1">
          Número de Operación (Opcional)
        </label>
        <input
          type="text"
          :value="props.paymentReference"
          @input="emit('update:paymentReference', ($event.target as HTMLInputElement).value)"
          placeholder="Ej: 12345678"
          class="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4A5D23]/30"
        />
      </div>

      <!-- Carga de Voucher / Comprobante -->
      <div>
        <label class="block text-xs font-bold text-stone-700 mb-1">
          Comprobante / Captura de Pago (Voucher)
        </label>

        <!-- Preview si ya fue subido -->
        <div
          v-if="props.paymentReceiptUrl"
          class="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-300 rounded-xl"
        >
          <div class="flex items-center gap-3">
            <img
              :src="props.paymentReceiptUrl"
              alt="Voucher de pago"
              class="w-12 h-12 object-cover rounded-lg border border-emerald-200 shadow-xs"
            />
            <div>
              <p class="text-xs font-bold text-emerald-900 flex items-center gap-1">
                <Icon name="lucide:check-circle-2" class="w-4 h-4 text-emerald-600" />
                Voucher adjuntado con éxito
              </p>
              <p class="text-[10px] text-emerald-700">Listo para verificación del equipo</p>
            </div>
          </div>
          <button
            type="button"
            @click="removeReceipt"
            class="p-2 text-stone-400 hover:text-red-600 rounded-lg transition cursor-pointer"
            title="Eliminar voucher"
          >
            <Icon name="lucide:trash-2" class="w-4 h-4" />
          </button>
        </div>

        <!-- Botón de subida si no hay voucher aún -->
        <div v-else>
          <label
            :class="[
              'flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition',
              isUploading ? 'bg-stone-100 border-stone-300' : 'bg-white border-stone-300 hover:border-[#4A5D23]'
            ]"
          >
            <div class="flex flex-col items-center gap-1 text-center">
              <Icon
                :name="isUploading ? 'lucide:loader' : 'lucide:upload-cloud'"
                :class="['w-6 h-6 text-[#4A5D23]', isUploading ? 'animate-spin' : '']"
              />
              <p class="text-xs font-bold text-stone-700">
                {{ isUploading ? 'Subiendo comprobante seguro...' : 'Toca para subir captura del comprobante' }}
              </p>
              <p class="text-[10px] text-stone-400">JPEG, PNG o WebP (Máximo 2 MB)</p>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              :disabled="isUploading"
              @change="handleFileUpload"
            />
          </label>

          <p v-if="uploadError" class="text-xs text-red-600 font-semibold mt-1.5 flex items-center gap-1">
            <Icon name="lucide:alert-circle" class="w-3.5 h-3.5 shrink-0" />
            {{ uploadError }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
