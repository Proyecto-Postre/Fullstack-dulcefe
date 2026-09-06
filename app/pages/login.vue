<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from '~/stores/auth'
import { useSupabaseClient } from '#imports'

const authStore = useAuthStore()
const supabase = useSupabaseClient()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
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
}

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    if (isLogin.value) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
      authStore.setUser(data.user)
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: {
          data: {
            full_name: fullName.value
          }
        }
      })
      if (error) throw error
      authStore.setUser(data.user)
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
  <div class="flex items-center justify-center py-16 px-6">
    <div class="w-full max-w-md">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-4xl font-playfair font-black text-brand-secondary hover:text-brand-primary transition-colors">Dulce Fe</h1>
        </NuxtLink>
        <p class="text-brand-primary font-medium mt-2">
          {{ isLogin ? 'Bienvenido de vuelta a tu pastelería favorita' : 'Únete a nuestra familia dulce' }}
        </p>
      </div>

      <!-- Tarjeta de Formulario Premium Soft -->
      <div class="bg-surface/90 backdrop-blur-md border border-brand-primary/10 rounded-[2rem] p-8 shadow-soft-lg">
        
        <form @submit.prevent="handleSubmit" class="space-y-5">
          
          <!-- Nombre (Solo Registro) -->
          <div v-if="!isLogin" class="space-y-2 animate-pop">
            <label for="fullName" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Nombre Completo</label>
            <input 
              id="fullName"
              v-model="fullName"
              type="text" 
              required
              placeholder="Ej. María Pérez"
              class="w-full bg-surface border border-brand-primary/20 rounded-xl px-4 py-3 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
            >
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Correo Electrónico</label>
            <input 
              id="email"
              v-model="email"
              type="email" 
              required
              autocomplete="email"
              placeholder="tu@correo.com"
              class="w-full bg-surface border border-brand-primary/20 rounded-xl px-4 py-3 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
            >
          </div>

          <!-- Contraseña -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-bold text-brand-secondary uppercase tracking-wider">Contraseña</label>
            <div class="relative">
              <input 
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                required
                :autocomplete="isLogin ? 'current-password' : 'new-password'"
                placeholder="••••••••"
                class="w-full bg-surface border border-brand-primary/20 rounded-xl px-4 py-3 pr-12 text-brand-secondary font-medium focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder:text-brand-primary/40 shadow-soft-sm"
              >
              <button
                type="button"
                aria-label="Alternar visibilidad de contraseña"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary/50 hover:text-brand-secondary transition-colors cursor-pointer"
              >
                <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Mensaje de Error -->
          <div v-if="errorMessage" role="alert" aria-live="assertive" class="p-3 bg-red-50 border border-status-danger/20 rounded-xl text-status-danger text-sm font-medium animate-pop shadow-soft-sm">
            {{ errorMessage }}
          </div>

          <!-- Botón Submit -->
          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-brand-primary text-white font-bold py-4 rounded-xl shadow-soft-md hover:shadow-soft-lg hover:-translate-y-0.5 hover:bg-brand-secondary active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-widest mt-4 cursor-pointer"
          >
            <Icon v-if="isLoading" name="lucide:loader-2" class="w-6 h-6 animate-spin" />
            <span v-else>{{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</span>
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="mt-6 text-center">
          <button 
            @click.prevent="toggleMode"
            class="text-brand-primary font-bold hover:text-brand-secondary transition-colors underline decoration-2 underline-offset-4 cursor-pointer text-sm"
          >
            {{ isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
