<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from 'nuxt/app'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const isLogin = ref(true)
const email = ref('')
const password = ref('')
const fullName = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// Si ya está logueado, redirigir al perfil
if (import.meta.client && authStore.isLoggedIn) {
  navigateTo('/perfil')
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
}

const handleSubmit = async () => {
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    const supabase = useSupabaseClient()
    
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
    
    navigateTo('/perfil')
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

      <!-- Tarjeta de Formulario Neo-Brutalista -->
      <div class="bg-white border-2 border-[#2A321B] rounded-[2rem] p-8 shadow-[6px_6px_0px_#4A5D23]">
        
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
              class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
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
              class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
            >
          </div>

          <!-- Contraseña -->
          <div class="space-y-2">
            <label for="password" class="block text-sm font-bold text-[#2A321B] uppercase tracking-wider">Contraseña</label>
            <input 
              id="password"
              v-model="password"
              type="password" 
              required
              placeholder="••••••••"
              class="w-full bg-[#F4F1E1] border-2 border-[#2A321B] rounded-xl px-4 py-3 text-[#2A321B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A5D23] focus:border-transparent transition-all placeholder:text-[#4A5D23]/40"
            >
          </div>

          <!-- Mensaje de Error -->
          <div v-if="errorMessage" class="p-3 bg-[#991B1B]/10 border border-[#991B1B]/30 rounded-xl text-[#991B1B] text-sm font-bold animate-pop">
            {{ errorMessage }}
          </div>

          <!-- Botón Submit -->
          <button 
            type="submit"
            :disabled="isLoading"
            class="w-full bg-[#84cc16] text-[#2A321B] font-bold py-4 rounded-xl shadow-[4px_4px_0px_#2A321B] hover:bg-[#65a30d] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg mt-4"
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
