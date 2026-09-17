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
  <div class="w-[92%] sm:w-[90%] lg:w-[88%] xl:w-[85%] max-w-5xl 2xl:max-w-6xl mx-auto my-auto transition-all duration-300">
    <!-- Contenedor adaptativo de Alta Repostería alineado al Sistema de Diseño Dulce Fe -->
    <div class="grid grid-cols-1 lg:grid-cols-12 items-stretch bg-surface border border-brand-primary/15 rounded-2xl sm:rounded-3xl shadow-soft-lg overflow-hidden">
      
      <!-- Columna Izquierda: Experiencia de Marca & Beneficios Artesanales (Solo pantallas grandes donde hay espacio suficiente) -->
      <div class="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-brand-secondary via-[#1f2814] to-[#141a0d] text-brand-cream p-6 lg:p-7 xl:p-8 flex-col justify-between relative overflow-hidden h-full">
        <!-- Luces ambientales de fondo (miel y verde militar) -->
        <div class="absolute top-0 right-0 translate-x-10 -translate-y-10 w-48 h-48 bg-brand-accent/15 rounded-full blur-2xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 -translate-x-10 translate-y-10 w-52 h-52 bg-brand-primary/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10">
          <!-- Badge Artesanal -->
          <div class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-brand-accent/30 text-[11px] xl:text-xs font-semibold text-brand-accent mb-3 xl:mb-3.5 shadow-soft-sm">
            <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
            <span>Repostería Fina Artesanal</span>
          </div>

          <!-- Título Heroico con Acento Miel -->
          <h2 class="text-xl lg:text-[1.75rem] xl:text-[1.95rem] font-playfair font-black leading-tight text-white mb-2 xl:mb-2.5">
            Momentos <span class="text-brand-accent">dulces</span> que alegran el corazón
          </h2>
          <p class="text-brand-cream/80 text-xs xl:text-sm leading-relaxed mb-3.5 xl:mb-4.5 font-normal">
            Ingredientes seleccionados, horneados a mano con devoción por cada sabor, textura y detalle.
          </p>

          <!-- Tarjetas de Beneficios Exclusivos -->
          <div class="grid grid-cols-1 gap-2 xl:gap-2.5">
            <div class="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.18] backdrop-blur-xs transition-all duration-200 group">
              <div class="w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-brand-primary/30 border border-brand-primary/40 text-brand-accent flex items-center justify-center shrink-0 shadow-soft-sm group-hover:scale-105 transition-transform">
                <Icon name="lucide:cake" class="w-4 h-4 xl:w-4.5 xl:h-4.5 text-brand-accent" />
              </div>
              <div class="min-w-0">
                <p class="text-xs xl:text-sm font-bold text-white leading-snug">Lotes Pequeños & Frescura</p>
                <p class="text-[10px] xl:text-[11px] text-brand-cream/70 leading-tight mt-0.5">Elaboración diaria sin conservantes.</p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.18] backdrop-blur-xs transition-all duration-200 group">
              <div class="w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-brand-primary/30 border border-brand-primary/40 text-brand-accent flex items-center justify-center shrink-0 shadow-soft-sm group-hover:scale-105 transition-transform">
                <Icon name="lucide:award" class="w-4 h-4 xl:w-4.5 xl:h-4.5 text-brand-accent" />
              </div>
              <div class="min-w-0">
                <p class="text-xs xl:text-sm font-bold text-white leading-snug">Club Dulce Fe</p>
                <p class="text-[10px] xl:text-[11px] text-brand-cream/70 leading-tight mt-0.5">Acumula puntos y canjea postres gratis.</p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.18] backdrop-blur-xs transition-all duration-200 group">
              <div class="w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-brand-primary/30 border border-brand-primary/40 text-brand-accent flex items-center justify-center shrink-0 shadow-soft-sm group-hover:scale-105 transition-transform">
                <Icon name="lucide:truck" class="w-4 h-4 xl:w-4.5 xl:h-4.5 text-brand-accent" />
              </div>
              <div class="min-w-0">
                <p class="text-xs xl:text-sm font-bold text-white leading-snug">Delivery Cuidadoso</p>
                <p class="text-[10px] xl:text-[11px] text-brand-cream/70 leading-tight mt-0.5">Embalaje especial para cada postre.</p>
              </div>
            </div>

            <div class="flex items-center gap-3 p-2.5 xl:p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.10] hover:border-white/[0.18] backdrop-blur-xs transition-all duration-200 group">
              <div class="w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-brand-primary/30 border border-brand-primary/40 text-emerald-300 flex items-center justify-center shrink-0 shadow-soft-sm group-hover:scale-105 transition-transform">
                <Icon name="lucide:message-circle" class="w-4 h-4 xl:w-4.5 xl:h-4.5 text-emerald-300" />
              </div>
              <div class="min-w-0">
                <p class="text-xs xl:text-sm font-bold text-white leading-snug">Coordinación por WhatsApp</p>
                <p class="text-[10px] xl:text-[11px] text-brand-cream/70 leading-tight mt-0.5">Seguimiento en vivo y entrega puntual.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Cita Testimonial con 5 Estrellas Doradas de la Marca (brand-accent) -->
        <div class="relative z-10 mt-4 xl:mt-5 pt-3 xl:pt-3.5 border-t border-white/10 flex items-center justify-between">
          <div>
            <p class="text-xs xl:text-sm italic text-brand-cream/90 font-medium">
              "Alta pastelería con devoción por cada detalle."
            </p>
            <p class="text-[10px] xl:text-[11px] text-brand-cream/60 mt-0.5">
              4.9/5 satisfacción de clientes
            </p>
          </div>
          <div class="flex items-center gap-1 text-brand-accent shrink-0">
            <svg 
              v-for="i in 5" 
              :key="i" 
              class="w-3.5 h-3.5 xl:w-4 xl:h-4 text-brand-accent fill-brand-accent drop-shadow-[0_1px_4px_rgba(197,160,89,0.5)]" 
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Tarjeta de Formulario Refinado -->
      <div class="col-span-1 lg:col-span-7 p-5 sm:p-6 lg:p-7 xl:p-8 flex flex-col justify-between h-full bg-surface">
        <div>
          <!-- Switcher Segmentado de Píldora -->
          <div class="flex items-center p-1.5 bg-brand-cream/60 rounded-xl border border-brand-primary/15 mb-3 sm:mb-3.5 xl:mb-4">
            <button
              type="button"
              @click="isLogin = true; errorMessage = ''"
              :class="[
                'flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5',
                isLogin 
                  ? 'bg-surface text-brand-secondary shadow-soft-sm ring-1 ring-brand-primary/10' 
                  : 'text-brand-primary/70 hover:text-brand-secondary'
              ]"
            >
              <Icon name="lucide:log-in" class="w-3.5 h-3.5" :class="isLogin ? 'text-brand-primary' : 'text-brand-primary/50'" />
              <span>Iniciar Sesión</span>
            </button>
            <button
              type="button"
              @click="isLogin = false; errorMessage = ''"
              :class="[
                'flex-1 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-1.5',
                !isLogin 
                  ? 'bg-surface text-brand-secondary shadow-soft-sm ring-1 ring-brand-primary/10' 
                  : 'text-brand-primary/70 hover:text-brand-secondary'
              ]"
            >
              <Icon name="lucide:user-plus" class="w-3.5 h-3.5" :class="!isLogin ? 'text-brand-primary' : 'text-brand-primary/50'" />
              <span>Crear Cuenta</span>
            </button>
          </div>

          <!-- Encabezado del Formulario -->
          <div class="mb-3 sm:mb-3.5 xl:mb-4">
            <h1 class="text-xl sm:text-2xl xl:text-[1.75rem] font-playfair font-black text-brand-secondary leading-tight tracking-tight">
              {{ isLogin ? 'Bienvenido a Dulce Fe' : 'Únete a nuestra familia' }}
            </h1>
            <p class="text-brand-primary/80 text-xs sm:text-sm font-medium mt-1">
              {{ isLogin ? 'Ingresa tus credenciales para gestionar tus pedidos y beneficios.' : 'Crea tu cuenta en 1 minuto y acumula puntos desde hoy.' }}
            </p>
          </div>

          <!-- Formulario con Campos Elevados alineados al Sistema de Tokens -->
          <form @submit.prevent="handleSubmit" class="space-y-2.5 sm:space-y-3 xl:space-y-3.5">
            
            <!-- Nombre Completo (Solo Registro) -->
            <div v-if="!isLogin" class="space-y-1 animate-pop">
              <label for="fullName" class="block text-[11px] sm:text-xs font-bold text-brand-primary uppercase tracking-wider">
                Nombre Completo
              </label>
              <div class="relative flex items-center rounded-xl bg-brand-cream/40 hover:bg-brand-cream/60 focus-within:bg-surface border border-brand-primary/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all shadow-xs group">
                <span class="pl-3.5 pr-2 text-brand-primary/50 group-focus-within:text-brand-primary transition-colors shrink-0">
                  <Icon name="lucide:user" class="w-4 h-4 xl:w-4.5 xl:h-4.5" />
                </span>
                <input 
                  id="fullName"
                  v-model="fullName"
                  type="text" 
                  required
                  autocomplete="name"
                  placeholder="Ej. María Pérez"
                  class="w-full bg-transparent pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/0 placeholder:text-brand-primary/30"
                >
              </div>
            </div>

            <!-- Celular / WhatsApp (Perú) con Bandera Vectorial Pulida -->
            <div v-if="!isLogin" class="space-y-1 animate-pop">
              <div class="flex items-center justify-between">
                <label for="phone" class="block text-[11px] sm:text-xs font-bold text-brand-primary uppercase tracking-wider">
                  Celular / WhatsApp (Perú)
                </label>
                <span 
                  :class="phone.length === 9 && phone.startsWith('9') ? 'text-emerald-700 bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10' : 'text-brand-primary/60 bg-brand-cream/80 border-brand-primary/15'"
                  class="text-[9px] xl:text-[10px] font-bold px-1.5 py-0.5 rounded-full border transition-all inline-flex items-center gap-1"
                >
                  <Icon v-if="phone.length === 9 && phone.startsWith('9')" name="lucide:check" class="w-2.5 h-2.5 text-emerald-600" />
                  <span>{{ phone.length }}/9</span>
                </span>
              </div>
              <div class="relative flex items-center rounded-xl bg-brand-cream/40 hover:bg-brand-cream/60 focus-within:bg-surface border border-brand-primary/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all shadow-xs overflow-hidden group">
                
                <!-- Badge de Código de País Perú: Vector nítido 3:2 -->
                <div class="inline-flex items-center gap-1.5 px-3 py-2.5 sm:py-3 bg-brand-cream/70 border-r border-brand-primary/20 text-brand-secondary select-none shrink-0 group-focus-within:bg-brand-primary/5 transition-colors">
                  <span class="inline-flex items-center justify-center w-4.5 h-3 rounded-[2px] overflow-hidden shadow-xs ring-1 ring-black/15 shrink-0">
                    <svg viewBox="0 0 3 2" class="w-full h-full object-cover">
                      <rect width="1" height="2" fill="#D91023" />
                      <rect width="1" height="2" x="1" fill="#FFFFFF" />
                      <rect width="1" height="2" x="2" fill="#D91023" />
                    </svg>
                  </span>
                  <span class="text-xs font-bold text-brand-secondary tracking-tight">+51</span>
                </div>

                <!-- Input numérico limpio -->
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
                  class="w-full bg-transparent px-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/0 placeholder:text-brand-primary/30 tracking-wide"
                >

                <!-- Feedback visual cuando el número es válido -->
                <div v-if="phone.length === 9 && phone.startsWith('9')" class="pr-3 text-emerald-600 animate-pop shrink-0">
                  <Icon name="lucide:check-circle-2" class="w-4 h-4" />
                </div>
              </div>
            </div>

            <!-- Email -->
            <div class="space-y-1">
              <label for="email" class="block text-[11px] sm:text-xs font-bold text-brand-primary uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div class="relative flex items-center rounded-xl bg-brand-cream/40 hover:bg-brand-cream/60 focus-within:bg-surface border border-brand-primary/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all shadow-xs group">
                <span class="pl-3.5 pr-2 text-brand-primary/50 group-focus-within:text-brand-primary transition-colors shrink-0">
                  <Icon name="lucide:mail" class="w-4 h-4 xl:w-4.5 xl:h-4.5" />
                </span>
                <input 
                  id="email"
                  v-model="email"
                  type="email" 
                  required
                  autocomplete="email"
                  placeholder="tu@correo.com"
                  class="w-full bg-transparent pr-3.5 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/0 placeholder:text-brand-primary/30"
                >
              </div>
            </div>

            <!-- Contraseña -->
            <div class="space-y-1">
              <label for="password" class="block text-[11px] sm:text-xs font-bold text-brand-primary uppercase tracking-wider">
                Contraseña
              </label>
              <div class="relative flex items-center rounded-xl bg-brand-cream/40 hover:bg-brand-cream/60 focus-within:bg-surface border border-brand-primary/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20 transition-all shadow-xs group">
                <span class="pl-3.5 pr-2 text-brand-primary/50 group-focus-within:text-brand-primary transition-colors shrink-0">
                  <Icon name="lucide:lock" class="w-4 h-4 xl:w-4.5 xl:h-4.5" />
                </span>
                <input 
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'" 
                  required
                  :autocomplete="isLogin ? 'current-password' : 'new-password'"
                  placeholder="••••••••"
                  class="w-full bg-transparent pr-2 py-2.5 sm:py-3 text-xs sm:text-sm text-brand-secondary font-semibold focus:outline-none focus:ring-2 focus:ring-brand-primary/0 placeholder:text-brand-primary/30 tracking-wider"
                >
                <button
                  type="button"
                  aria-label="Alternar visibilidad de contraseña"
                  @click="showPassword = !showPassword"
                  class="p-1.5 mr-1 text-brand-primary/50 hover:text-brand-secondary rounded-lg transition-colors cursor-pointer"
                >
                  <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-4 h-4" />
                </button>
              </div>
            </div>

            <!-- Bloque de Beneficios Club Dulce Fe (Solo Login para equilibrar altura con Registro) -->
            <div v-if="isLogin" class="p-3 xl:p-3.5 rounded-xl bg-brand-cream/50 border border-brand-accent/30 flex items-center gap-3 animate-pop relative overflow-hidden">
              <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-brand-accent/15 border border-brand-accent/25 text-brand-accent flex items-center justify-center shrink-0 shadow-soft-sm">
                <Icon name="lucide:sparkles" class="w-4 h-4 text-brand-accent" />
              </div>
              <div class="min-w-0">
                <p class="text-xs xl:text-sm font-bold text-brand-secondary leading-snug">
                  Beneficio Club Dulce Fe
                </p>
                <p class="text-[10px] xl:text-[11px] text-brand-primary/80 leading-tight mt-0.5">
                  Accede a tu historial de pedidos y canjea puntos por postres gratis.
                </p>
              </div>
            </div>

            <!-- Mensaje de Error -->
            <div 
              v-if="errorMessage" 
              role="alert" 
              aria-live="assertive" 
              class="p-2.5 sm:p-3 bg-red-50 border border-status-danger/20 rounded-xl text-status-danger text-xs font-medium flex items-center gap-2 animate-pop"
            >
              <Icon name="lucide:alert-circle" class="w-3.5 h-3.5 shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>

            <!-- Mensaje de Éxito -->
            <div 
              v-if="successMessage" 
              role="status" 
              class="p-2.5 sm:p-3 bg-emerald-50 border border-emerald-500/20 rounded-xl text-emerald-800 text-xs font-medium flex items-center gap-2 animate-pop"
            >
              <Icon name="lucide:check-circle" class="w-3.5 h-3.5 shrink-0 text-emerald-600" />
              <span>{{ successMessage }}</span>
            </div>

            <!-- Botón de Envío Oficial de Marca -->
            <button 
              type="submit" 
              :disabled="isLoading"
              class="w-full bg-brand-primary hover:bg-brand-secondary text-brand-cream font-bold py-2.5 sm:py-3 px-6 rounded-xl transition-all duration-200 shadow-soft-sm hover:shadow-soft-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 cursor-pointer mt-1 text-xs sm:text-sm group"
            >
              <Icon v-if="isLoading" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
              <template v-else>
                <span>{{ isLogin ? 'Iniciar Sesión' : 'Crear mi Cuenta' }}</span>
                <Icon name="lucide:arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </template>
            </button>

          </form>
        </div>

        <!-- Pie de la tarjeta -->
        <div class="mt-2.5 sm:mt-3.5">
          <!-- Alternar entre Login y Registro -->
          <div class="text-center pt-2 sm:pt-2.5 border-t border-brand-primary/10">
            <p class="text-xs text-brand-secondary/70">
              {{ isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres parte de Dulce Fe?' }}
              <button 
                type="button"
                @click="toggleMode" 
                class="font-black text-brand-primary hover:text-brand-secondary hover:underline ml-1 cursor-pointer transition-colors"
              >
                {{ isLogin ? 'Regístrate gratis aquí' : 'Inicia sesión aquí' }}
              </button>
            </p>
          </div>

          <!-- Sello de Seguridad -->
          <div class="flex items-center justify-center gap-1.5 text-[10px] xl:text-[11px] text-brand-primary/60 mt-1 sm:mt-1.5">
            <Icon name="lucide:shield-check" class="w-3 h-3 text-brand-primary" />
            <span>Conexión cifrada de extremo a extremo &bull; SSL protegido</span>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>
