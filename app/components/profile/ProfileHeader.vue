<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

defineEmits<{
  (e: 'logout'): void
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/"
        class="w-10 h-10 flex items-center justify-center rounded-full border border-brand-primary/20 bg-surface text-brand-secondary hover:bg-brand-cream transition-colors shadow-soft-sm shrink-0 cursor-pointer"
        title="Volver al inicio"
      >
        <Icon name="lucide:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <div class="flex items-center gap-2.5">
          <h1 class="text-2xl sm:text-3xl font-playfair font-black text-brand-secondary">Mi Cuenta</h1>
          <span
            v-if="authStore.isAdmin"
            class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary/15 text-brand-primary border border-brand-primary/25"
          >
            Admin
          </span>
        </div>
        <p class="text-xs text-brand-primary font-medium mt-0.5">Gestiona tus pedidos, direcciones y puntos acumulados</p>
      </div>
    </div>
    <div class="flex items-center gap-3 self-end sm:self-auto">
      <NuxtLink
        v-if="authStore.isAdmin"
        to="/admin"
        class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-secondary text-white hover:bg-brand-primary font-bold text-xs shadow-soft-sm transition-all cursor-pointer"
      >
        <Icon name="lucide:shield-check" class="w-4 h-4 text-status-success" />
        <span>Panel Admin</span>
      </NuxtLink>
      <button 
        @click="$emit('logout')"
        class="flex items-center gap-2 text-status-danger font-bold hover:opacity-80 transition-opacity text-xs sm:text-sm cursor-pointer"
      >
        <Icon name="lucide:log-out" class="w-4 h-4" />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </div>
</template>
