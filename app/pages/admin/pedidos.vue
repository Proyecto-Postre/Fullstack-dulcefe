<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-only'
})

// Redireccionar automáticamente al panel de pedidos
await navigateTo('/admin?tab=pedidos', { replace: true })
</script>

<template>
  <div class="min-h-[50vh] flex items-center justify-center">
    <p class="text-sm font-bold text-brand-primary animate-pulse">
      Cargando panel de pedidos...
    </p>
  </div>
</template>
