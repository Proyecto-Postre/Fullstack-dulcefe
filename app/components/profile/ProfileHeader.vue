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
        class="w-10 h-10 flex items-center justify-center rounded-full border border-brand-primary/20 bg-surface text-brand-secondary hover:bg-brand-cream transition-colors shadow-soft-sm"
        title="Volver al inicio"
      >
        <Icon name="lucide:arrow-left" class="w-5 h-5" />
      </NuxtLink>
      <div>
        <h1 class="text-3xl font-playfair font-black text-brand-secondary">Mi Cuenta</h1>
        <p class="text-xs text-brand-primary font-medium mt-0.5">Gestiona tus pedidos, direcciones y puntos acumulados</p>
      </div>
    </div>
    <button 
      @click="$emit('logout')"
      class="flex items-center gap-2 text-status-danger font-bold hover:opacity-80 transition-opacity text-sm cursor-pointer"
    >
      <Icon name="lucide:log-out" class="w-4 h-4" />
      <span>Cerrar Sesión</span>
    </button>
  </div>
</template>
