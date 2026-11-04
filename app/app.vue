<script setup lang="ts">
import { onMounted } from 'vue'
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
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
    <div id="admin-modal-portal" class="fixed inset-0 z-[9999] pointer-events-none empty:hidden"></div>
  </div>
</template>

<style>
/* Estilos globales de Scrollbars — Identidad Botánica Dulce Fe */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background-color: rgba(74, 93, 35, 0.25);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background-color: rgba(74, 93, 35, 0.45);
}
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(74, 93, 35, 0.25) transparent;
}

/* Scrollbar explícito con diseño botánico */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(74, 93, 35, 0.25);
  border-radius: 9999px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(74, 93, 35, 0.45);
}
.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(74, 93, 35, 0.25) transparent;
}

/* Ocultamiento universal de scrollbars para carruseles y componentes táctiles */
.hide-scrollbar::-webkit-scrollbar,
.no-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}
.hide-scrollbar,
.no-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
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
