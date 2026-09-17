<script setup lang="ts">
defineEmits<{
  (e: 'logout'): void
}>()
</script>

<template>
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-4">
      <NuxtLink
        to="/"
        class="w-10 h-10 flex items-center justify-center rounded-full border border-brand-primary/20 hover:border-brand-primary bg-surface hover:bg-[#EDE8D5] text-brand-secondary hover:text-brand-primary transition-all duration-200 shadow-soft-sm hover:shadow-md hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
        aria-label="Volver al inicio"
      >
        <Icon name="lucide:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-2xl sm:text-3xl font-playfair font-black text-brand-secondary">Mi Cuenta</h1>
        <p class="text-xs text-brand-primary font-medium mt-0.5">Gestiona tus pedidos, direcciones y puntos acumulados</p>
      </div>
    </div>
    <button 
      @click="$emit('logout')"
      type="button"
      class="flex items-center gap-2 px-3.5 py-2 rounded-xl text-status-danger font-bold bg-red-50/60 hover:bg-red-500 hover:text-white border border-red-200/60 hover:border-red-500 shadow-soft-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 text-xs sm:text-sm cursor-pointer shrink-0"
      aria-label="Cerrar sesión"
    >
      <Icon name="lucide:log-out" class="w-4 h-4" />
      <span>Cerrar Sesión</span>
    </button>
  </div>
</template>
