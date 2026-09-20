<script setup lang="ts" generic="T extends { id: string | number }">
defineProps<{
  items: T[]
  gridClass?: string
  itemKey?: keyof T
}>()
</script>

<template>
  <TransitionGroup
    name="animated-grid"
    tag="div"
    :class="['grid', gridClass || 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-7']"
  >
    <div
      v-for="item in items"
      :key="itemKey ? (item[itemKey] as string | number) : item.id"
      class="animated-grid-item h-full"
    >
      <slot :item="item" />
    </div>
  </TransitionGroup>
</template>

<style scoped>
/* Deslizamiento suave FLIP de las tarjetas al filtrar o reordenar */
.animated-grid-move {
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
}

/* Entrada suave sin destellos ni saltos bruscos */
.animated-grid-enter-active {
  transition: opacity 0.2s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.animated-grid-enter-from {
  opacity: 0;
  transform: scale(0.96);
}

/* Salida inmediata sin parpadeos: se oculta al instante para que las demás
   tarjetas se deslicen fluidamente sin trabas ni superposiciones en (0,0) */
.animated-grid-leave-active {
  position: absolute;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition: opacity 0.05s ease;
}

@media (prefers-reduced-motion: reduce) {
  .animated-grid-move,
  .animated-grid-enter-active,
  .animated-grid-leave-active {
    transition: none !important;
    transform: none !important;
  }
}
</style>
