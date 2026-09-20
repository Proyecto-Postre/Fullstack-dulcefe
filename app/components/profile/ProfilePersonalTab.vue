<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const fullName = ref(authStore.profile?.full_name || authStore.user?.user_metadata?.full_name || '')
const phone = ref(authStore.profile?.phone || '')

const isSaving = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Sincronizar campos si el perfil se refresca
watch(() => authStore.profile, (newProfile) => {
  if (newProfile) {
    if (!fullName.value) fullName.value = newProfile.full_name || ''
    if (!phone.value) phone.value = newProfile.phone || ''
  }
}, { immediate: true })

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (!fullName.value.trim()) {
    errorMessage.value = 'Por favor ingresa tu nombre completo.'
    return
  }

  isSaving.value = true
  const res = await authStore.updateProfile({
    full_name: fullName.value.trim(),
    phone: phone.value.trim()
  })
  isSaving.value = false

  if (res.success) {
    successMessage.value = '¡Tus datos personales se han actualizado con éxito!'
    setTimeout(() => {
      successMessage.value = ''
    }, 4000)
  } else {
    errorMessage.value = res.error || 'Ocurrió un error al guardar los cambios.'
  }
}
</script>

<template>
  <div class="animate-pop">
    <!-- Encabezado de la pestaña -->
    <div class="mb-6 pb-4 border-b border-brand-primary/10">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-2xl bg-brand-cream border border-brand-primary/20 flex items-center justify-center text-brand-primary shadow-soft-sm shrink-0">
          <Icon name="lucide:user" class="w-5 h-5" />
        </div>
        <div>
          <h2 class="text-xl sm:text-2xl font-playfair font-black text-brand-secondary">Datos Personales</h2>
          <p class="text-xs text-brand-primary/80">Gestiona tu nombre y teléfono para la coordinación de tus pedidos</p>
        </div>
      </div>
    </div>

    <!-- Mensajes de Estado -->
    <div 
      v-if="successMessage" 
      class="mb-6 p-4 rounded-2xl bg-status-success/10 border border-status-success/30 flex items-center gap-3 text-brand-secondary text-xs font-bold animate-pop"
    >
      <Icon name="lucide:check-circle-2" class="w-5 h-5 text-status-success shrink-0" />
      <span>{{ successMessage }}</span>
    </div>

    <div 
      v-if="errorMessage" 
      class="mb-6 p-4 rounded-2xl bg-status-danger/10 border border-status-danger/30 flex items-center gap-3 text-status-danger text-xs font-bold animate-pop"
    >
      <Icon name="lucide:alert-circle" class="w-5 h-5 shrink-0" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Formulario optimizado: 1 columna en móvil, 2 columnas limpias en PC -->
    <form @submit.prevent="handleSubmit" class="space-y-5 sm:space-y-6">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <!-- Nombre Completo -->
        <div>
          <label for="profile-fullname" class="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wider">
            Nombre Completo
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/50">
              <Icon name="lucide:user" class="w-4 h-4" />
            </div>
            <input 
              id="profile-fullname"
              v-model="fullName"
              type="text" 
              required
              placeholder="Ej. María García"
              class="w-full pl-10 pr-4 py-3 bg-brand-cream/30 border border-brand-primary/20 rounded-2xl text-sm font-medium text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:border-brand-primary focus:bg-surface focus:ring-2 focus:ring-brand-primary/10 transition-all"
            />
          </div>
        </div>

        <!-- Teléfono / WhatsApp de Contacto -->
        <div>
          <label for="profile-phone" class="block text-xs font-bold text-brand-secondary mb-2 uppercase tracking-wider">
            Teléfono / WhatsApp
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/50">
              <Icon name="lucide:phone" class="w-4 h-4" />
            </div>
            <input 
              id="profile-phone"
              v-model="phone"
              type="tel" 
              placeholder="Ej. 998 265 700"
              class="w-full pl-10 pr-4 py-3 bg-brand-cream/30 border border-brand-primary/20 rounded-2xl text-sm font-medium text-brand-secondary placeholder:text-brand-secondary/40 focus:outline-none focus:border-brand-primary focus:bg-surface focus:ring-2 focus:ring-brand-primary/10 transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Nota de Teléfono -->
      <p class="text-[11px] text-brand-primary/70 flex items-center gap-1.5 font-medium -mt-2">
        <Icon name="lucide:info" class="w-3.5 h-3.5 shrink-0 text-brand-primary" />
        <span>El repartidor utilizará este número para contactarte al entregar tus postres.</span>
      </p>

      <!-- Correo Electrónico (Solo Lectura) -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label for="profile-email" class="block text-xs font-bold text-brand-secondary uppercase tracking-wider">
            Correo Electrónico
          </label>
          <span class="inline-flex items-center gap-1 text-[10px] font-bold text-status-success bg-status-success/15 border border-status-success/25 px-2.5 py-0.5 rounded-full">
            <Icon name="lucide:shield-check" class="w-3 h-3" />
            Acceso Seguro
          </span>
        </div>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-primary/40">
            <Icon name="lucide:mail" class="w-4 h-4" />
          </div>
          <input 
            id="profile-email"
            :value="authStore.user?.email"
            type="email" 
            disabled
            class="w-full pl-10 pr-4 py-3 bg-brand-cream/60 border border-brand-primary/10 rounded-2xl text-sm font-medium text-brand-secondary/60 cursor-not-allowed select-none"
          />
        </div>
        <p class="text-[10px] text-brand-primary/60 mt-1.5">
          El correo electrónico está vinculado a tu cuenta para el inicio de sesión.
        </p>
      </div>

      <!-- Botón de Acción -->
      <div class="pt-4 border-t border-brand-primary/10 flex justify-end">
        <button 
          type="submit"
          :disabled="isSaving"
          class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs sm:text-sm shadow-soft-sm hover:shadow-soft-md transition-all cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <Icon v-else name="lucide:save" class="w-4 h-4" />
          <span>{{ isSaving ? 'Guardando Cambios...' : 'Guardar Cambios' }}</span>
        </button>
      </div>
    </form>
  </div>
</template>
