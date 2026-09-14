<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from '~/stores/auth'
import { useSupabaseClient } from '#imports'

definePageMeta({
  layout: 'auth'
})

const authStore = useAuthStore()
const supabase = useSupabaseClient()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const phone = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const showPassword = ref(false)

// Si ya está logueado, redirigir según el rol
if (import.meta.client && authStore.isLoggedIn) {
  if (authStore.profile?.is_admin) {
    navigateTo('/admin', { replace: true })
  } else {
    navigateTo('/', { replace: true })
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
  successMessage.value = ''
}

const handlePhoneInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const sanitized = target.value.replace(/\D/g, '').slice(0, 9)
  phone.value = sanitized
  target.value = sanitized
}

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    if (isLogin.value) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value.trim(),
        password: password.value,
      })
      if (error) throw error
      authStore.setUser(data.user)
    } else {
      // Validar teléfono para registro en Perú
      const cleanPhone = phone.value.trim()
      if (!cleanPhone.startsWith('9') || cleanPhone.length !== 9) {
        throw new Error('Ingresa un número de celular peruano válido (9 dígitos comenzando con 9).')
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.value.trim(),
        password: password.value,
        options: {
          data: {
            full_name: fullName.value.trim(),
            phone: cleanPhone
          }
        }
      })
      if (error) throw error
      
      if (data.user) {
        authStore.setUser(data.user)
        // Sincronizar teléfono y nombre en profiles si la sesión fue creada
        try {
          await supabase
            .from('profiles')
            .update({
              full_name: fullName.value.trim(),
              phone: cleanPhone
            })
            .eq('id', data.user.id)
        } catch {
          // Si el trigger de BD ya lo procesó, continuar limpiamente
        }
      }
    }

    // Esperar a que el perfil se cargue para saber si es admin
    await authStore.fetchProfile()

    // Redirigir según el rol
    if (authStore.profile?.is_admin) {
      navigateTo('/admin')
    } else {
      navigateTo('/')
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Ocurrió un error inesperado al autenticar.'
    errorMessage.value = msg
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-5xl my-auto">
    <div class="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-surface/95 backdrop-blur-md border border-brand-primary/10 rounded-[2rem] shadow-soft-lg overflow-hidden">
      
      <!-- Columna Izquierda: Experiencia de Marca & Beneficios -->
      <div class="lg:col-span-5 bg-gradient-to-br from-brand-secondary via-[#1b2f1f] to-[#122015] text-brand-cream px-7 sm:px-8 lg:px-9 py-14 sm:py-16 lg:py-[75px] flex flex-col justify-between relative overflow-hidden">
        <!-- Decoraciones sutiles de fondo -->
        <div class="absolute top-0 right-0 translate-x-8 -translate-y-8 w-44 h-44 bg-brand-primary/15 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 -translate-x-8 translate-y-8 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <!-- Badge -->
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-brand-cream/90 mb-4">
            <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-amber-300" />
            <span>Repostería Fina Artesanal</span>
          </div>

          <!-- Título Heroico -->
          <h2 class="text-3xl lg:text-[2rem] font-playfair font-black leading-tight text-white mb-2.5">
            Momentos dulces que alegran el corazón
          </h2>
          <p class="text-brand-cream/80 text-xs sm:text-sm leading-relaxed mb-6">
            Ingredientes seleccionados, horneados a mano con amor, técnica y devoción por cada detalle.
          </p>

          <!-- Lista de Beneficios -->
          <div class="space-y-3">
            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div class="w-8 h-8 rounded-lg bg-brand-primary/20 text-brand-cream flex items-center justify-center shrink-0">
                <Icon name="lucide:cake" class="w-4 h-4 text-amber-300" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white leading-snug">Lotes Pequeños & Frescura</p>
                <p class="text-[11px] text-brand-cream/70 leading-tight mt-0.5">Elaboración diaria sin conservantes.</p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div class="w-8 h-8 rounded-lg bg-brand-primary/20 text-brand-cream flex items-center justify-center shrink-0">
                <Icon name="lucide:award" class="w-4 h-4 text-amber-300" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white leading-snug">Club Dulce Fe</p>
                <p class="text-[11px] text-brand-cream/70 leading-tight mt-0.5">Acumula puntos y canjea postres gratis.</p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <div class="w-8 h-8 rounded-lg bg-brand-primary/20 text-brand-cream flex items-center justify-center shrink-0">
                <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-300" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-white leading-snug">Coordinación por WhatsApp</p>
                <p class="text-[11px] text-brand-cream/70 leading-tight mt-0.5">Seguimiento en vivo y entrega puntual.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cita Testimonial con Estrellas Doradas Llenas -->
        <div class="relative z-10 mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
          <p class="text-xs italic text-brand-cream/85">
            "Alta pastelería con sabor auténtico."
          </p>
          <div class="flex items-center gap-1 text-amber-400 shrink-0">
            <Icon v-for="i in 5" :key="i" name="lucide:star" class="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Tarjeta de Formulario -->
      <div class="lg:col-span-7 px-7 sm:px-8 lg:px-9 py-14 sm:py-16 lg:py-[75px] flex flex-col justify-center">
        <!-- Switcher Píldora Superior -->
        <div class="flex items-center p-1 bg-brand-primary/5 rounded-2xl border border-brand-primary/10 mb-5">
          <button
            type="button"
            @click="isLogin = true; errorMessage = ''"
            :class="[
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center',
              isLogin 
                ? 'bg-brand-secondary text-brand-cream shadow-soft-sm' 
                : 'text-brand-secondary/70 hover:text-brand-secondary'
            ]"
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            @click="isLogin = false; errorMessage = ''"
            :class="[
              'flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer text-center',
              !isLogin 
                ? 'bg-brand-secondary text-brand-cream shadow-soft-sm' 
                : 'text-brand-secondary/70 hover:text-brand-secondary'
            ]"
          >
            Crear Cuenta
          </button>
        </div>

        <!-- Encabezado del Formulario -->
        <div class="mb-4">
          <h1 class="text-2xl sm:text-3xl font-playfair font-black text-brand-secondary leading-tight">
            {{ isLogin ? 'Bienvenido a Dulce Fe' : 'Únete a nuestra familia' }}
          </h1>
          <p class="text-brand-primary text-xs sm:text-sm font-medium mt-1">
            {{ isLogin ? 'Ingresa tus credenciales para gestionar tus pedidos.' : 'Crea tu cuenta en 1 minuto y empieza a acumular puntos.' }}
          </p>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" class="space-y-3.5">
          
          <!-- Nombre Completo (Solo Registro) -->
          <div v-if="!isLogin" class="space-y-1.5 animate-pop">
            <label for="fullName" class="block text-xs font-bold text-brand-secondary uppercase tracking-wider">
              Nombre Completo
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50">
                <Icon name="lucide:user" class="w-4 h-4" />
              </span>
              <input 
                id="fullName"
                v-model="fullName"
                type="text" 
                required
                autocomplete="name"
                placeholder="Ej. María Pérez"
                class="w-full bg-surface border border-brand-primary/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
              >
            </div>
          </div>

          <!-- Celular / WhatsApp (Solo Registro) con grupo de entrada integrado y sin solapamientos -->
          <div v-if="!isLogin" class="space-y-1.5 animate-pop">
            <div class="flex items-center justify-between">
              <label for="phone" class="block text-xs font-bold text-brand-secondary uppercase tracking-wider">
                Celular / WhatsApp (Perú)
              </label>
              <span class="text-[11px] font-bold" :class="phone.length === 9 && phone.startsWith('9') ? 'text-emerald-700' : 'text-stone-400'">
                {{ phone.length }}/9
              </span>
            </div>
            <div class="flex rounded-xl border border-brand-primary/20 bg-surface overflow-hidden shadow-soft-sm focus-within:ring-2 focus-within:ring-brand-primary focus-within:border-transparent">
              <div class="inline-flex items-center gap-1.5 px-3.5 bg-brand-primary/5 text-brand-secondary text-xs font-bold border-r border-brand-primary/15 select-none shrink-0">
                <span>🇵🇪</span>
                <span>+51</span>
              </div>
              <input 
                id="phone"
                :value="phone"
                @input="handlePhoneInput"
                type="tel" 
                required
                inputmode="numeric"
                maxlength="9"
                autocomplete="tel"
                placeholder="987 654 321"
                class="w-full bg-transparent px-3.5 py-2.5 text-sm text-brand-secondary font-semibold focus:outline-none placeholder:text-brand-primary/40"
              >
            </div>
          </div>

          <!-- Email -->
          <div class="space-y-1.5">
            <label for="email" class="block text-xs font-bold text-brand-secondary uppercase tracking-wider">
              Correo Electrónico
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50">
                <Icon name="lucide:mail" class="w-4 h-4" />
              </span>
              <input 
                id="email"
                v-model="email"
                type="email" 
                required
                autocomplete="email"
                placeholder="tu@correo.com"
                class="w-full bg-surface border border-brand-primary/20 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
              >
            </div>
          </div>

          <!-- Contraseña -->
          <div class="space-y-1.5">
            <label for="password" class="block text-xs font-bold text-brand-secondary uppercase tracking-wider">
              Contraseña
            </label>
            <div class="relative">
              <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50">
                <Icon name="lucide:lock" class="w-4 h-4" />
              </span>
              <input 
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                required
                :autocomplete="isLogin ? 'current-password' : 'new-password'"
                placeholder="••••••••"
                class="w-full bg-surface border border-brand-primary/20 rounded-xl pl-10 pr-11 py-2.5 text-sm text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
              >
              <button
                type="button"
                aria-label="Alternar visibilidad de contraseña"
                @click="showPassword = !showPassword"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-primary/50 hover:text-brand-secondary transition-colors cursor-pointer"
              >
                <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Mensaje de Error -->
          <div 
            v-if="errorMessage" 
            role="alert" 
            aria-live="assertive" 
            class="p-3 bg-red-50 border border-status-danger/20 rounded-xl text-status-danger text-xs font-medium flex items-center gap-2 animate-pop"
          >
            <Icon name="lucide:alert-circle" class="w-4 h-4 shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Mensaje de Éxito -->
          <div 
            v-if="successMessage" 
            role="status" 
            class="p-3 bg-emerald-50 border border-emerald-500/20 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-pop"
          >
            <Icon name="lucide:check-circle" class="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{{ successMessage }}</span>
          </div>

          <!-- Botón de Envío -->
          <button 
            type="submit" 
            :disabled="isLoading"
            class="w-full bg-brand-primary hover:bg-brand-secondary text-brand-cream font-bold py-3 px-6 rounded-xl transition-all shadow-soft-sm hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
          >
            <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
            <span>{{ isLogin ? 'Iniciar Sesión' : 'Crear mi Cuenta' }}</span>
          </button>

        </form>

        <!-- Alternar entre Login y Registro -->
        <div class="text-center mt-4 pt-3 border-t border-brand-primary/10">
          <p class="text-xs text-brand-secondary/80">
            {{ isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres parte de Dulce Fe?' }}
            <button 
              type="button"
              @click="toggleMode" 
              class="font-black text-brand-primary hover:underline ml-1 cursor-pointer"
            >
              {{ isLogin ? 'Regístrate gratis aquí' : 'Inicia sesión aquí' }}
            </button>
          </p>
        </div>

        <!-- Sello de Seguridad -->
        <div class="flex items-center justify-center gap-1.5 text-[11px] text-stone-400 mt-2.5">
          <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-brand-primary/60" />
          <span>Tus datos están protegidos con cifrado SSL</span>
        </div>

      </div>

    </div>
  </div>
</template>
