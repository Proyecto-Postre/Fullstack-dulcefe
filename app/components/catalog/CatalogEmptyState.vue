<script setup lang="ts">
defineProps<{
  searchQuery: string
}>()

defineEmits<{
  (e: 'reset'): void
}>()
</script>

<template>
  <div class="max-w-xl mx-auto text-center py-16 bg-surface rounded-[2.5rem] shadow-soft-md border border-brand-primary/15 p-8">
    <div class="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-4 text-brand-primary">
      <Icon name="lucide:search-x" class="w-8 h-8" />
    </div>
    <h3 class="text-2xl font-playfair font-bold text-brand-secondary mb-2 tracking-tight">Sin resultados</h3>
    <p class="text-brand-primary/80 font-medium text-xs max-w-sm mx-auto leading-relaxed mb-6">
      No encontramos ningún postre para "{{ searchQuery }}". Prueba buscando con otra palabra o seleccionando "Todos los Postres".
    </p>
    <button 
      @click="$emit('reset')"
      type="button"
      class="px-6 py-2.5 bg-brand-primary text-white rounded-full text-xs font-bold hover:bg-brand-secondary transition-all shadow-soft-sm cursor-pointer"
    >
      Ver Todos los Postres
    </button>
  </div>
</template>
