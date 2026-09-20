<script setup lang="ts">
defineProps<{
  points: number
}>()
</script>

<template>
  <div class="animate-pop">
    <h2 class="text-2xl font-playfair font-bold mb-6 text-brand-secondary">Programa de Lealtad</h2>
    
    <div class="bg-brand-cream/50 border border-brand-primary/20 rounded-2xl p-6 text-center shadow-soft-sm">
      <Icon name="lucide:award" class="w-16 h-16 text-brand-primary mx-auto mb-4" />
      <h3 class="text-xl font-bold mb-2 text-brand-secondary">
        ¡Tienes {{ points }} Puntos Dulce Fe!
      </h3>
      <p class="text-xs text-brand-primary/80 max-w-md mx-auto leading-relaxed font-medium">
        Acumulas 1 punto por cada S/ 1.00 de compra. Podrás canjear tus puntos por descuentos exclusivos, envíos gratis o postres sorpresa de regalo en tus próximos pedidos.
      </p>
    </div>
  </div>
</template>
