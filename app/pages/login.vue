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
  } catch (error: any) {
    errorMessage.value = error.message || 'Ocurrió un error inesperado.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] font-inter flex items-center justify-center p-6">
    <div class="w-full max-w-md">
      
      <!-- Header -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-block">
          <h1 class="text-4xl font-playfair font-black text-[#2A321B] hover:text-[#4A5D23] transition-colors">Dulce Fe</h1>
        </NuxtLink>
        <p class="text-[#4A5D23] font-medium mt-2">
          {{ isLogin ? 'Bienvenido de vuelta' : 'Únete a nuestra familia dulce' }}
        </p>
      </div>

      <!-- Tarjeta de Formulario Premium Soft -->
      <div class="bg-white/90 backdrop-blur-md border border-[#4A5D23]/10 rounded-[2rem] p-8 shadow-xl">
        
        <form @submit.prevent="handleSubmit" class="space-y-5">
          
          <!-- Nombre (Solo Registro) -->
          <div v-if="!isLogin" class="space-y-2 animate-pop">
            <label for="fullName" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Nombre Completo</label>
            <input 
              id="fullName"
              v-model="fullName"
              type="text" 
              required
              placeholder="Ej. María Pérez"
              class="w-full bg-white border border-[#4A5D23]/20 rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 shadow-sm"
            >
          </div>

          <!-- Email -->
          <div class="space-y-2">
            <label for="email" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Correo Electrónico</label>
            <input 
              id="email"
              v-model="email"
              type="email" 
              required
              placeholder="tu@correo.com"
              class="w-full bg-white border border-[#4A5D23]/20 rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 shadow-sm"
            >
          </div>

          <!-- Contraseña -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Contraseña</label>
            <div class="relative">
              <input 
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'" 
                required
                placeholder="••••••••"
                class="w-full bg-white border border-[#4A5D23]/20 rounded-xl px-4 py-3 pr-12 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40 shadow-sm"
              >
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-[#4A5D23]/50 hover:text-[#2A321B] transition-colors"
              >
                <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="w-5 h-5" />
              </button>
            </div>
          </div>

          <!-- Mensaje de Error -->
          <div v-if="errorMessage" class="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium animate-pop shadow-sm">
            {{ errorMessage }}
          </div>

          <!-- Botón Submit -->
          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-[#4A5D23] text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-[#3C4A1C] active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm uppercase tracking-widest mt-4"
          >
            <Icon v-if="isLoading" name="lucide:loader-2" class="w-6 h-6 animate-spin" />
            <span v-else>{{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</span>
          </button>
        </form>

        <!-- Toggle Mode -->
        <div class="mt-6 text-center">
          <button 
            @click.prevent="toggleMode"
            class="text-[#4A5D23] font-bold hover:text-[#2A321B] transition-colors underline decoration-2 underline-offset-4"
          >
            {{ isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión' }}
          </button>
        </div>

      </div>
    </div>
  </div>
</template>
