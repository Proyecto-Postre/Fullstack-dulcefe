<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initAuth()
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <Toaster 
      position="top-right" 
      richColors 
      closeButton
      :toastOptions="{
        style: {
          fontFamily: 'Inter, sans-serif',
          borderRadius: '12px',
          border: '1px solid rgba(74, 93, 35, 0.2)',
          boxShadow: '0 4px 16px -4px rgba(42, 50, 27, 0.1)'
        }
      }" 
    />
  </div>
</template>

<style>
/* Estilos globales para los scrollbars */
.custom-scrollbar::-webkit-scrollbar {
  display: none;
}
.custom-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

/* Quitar flechas de incremento/decremento en inputs numéricos globalmente */
input[type=number]::-webkit-inner-spin-button, 
input[type=number]::-webkit-outer-spin-button { 
  -webkit-appearance: none; 
  margin: 0; 
}
input[type=number] {
  -moz-appearance: textfield;
}

/* Transiciones de Página */
.page-enter-active,
.page-leave-active {
  transition: all 0.25s ease-out;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Animaciones de Lista */
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.4s cubic-bezier(0.55, 0, 0.1, 1);
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}

.list-leave-active {
  position: absolute;
}
</style>
