<script setup lang="ts">
// Componente declarativo del encabezado de la vitrina comercial
</script>

<template>
  <div class="text-center mb-8 sm:mb-12">
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border border-brand-primary/20 shadow-soft-sm">
      <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
      <span>Colección Dulce Fe · Taller Artesanal</span>
    </div>

    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-black text-brand-secondary mb-3 tracking-tight">
      Nuestra Carta & Especialidades
    </h1>

    <p class="text-xs sm:text-sm md:text-base text-brand-secondary/80 font-medium max-w-xl mx-auto leading-relaxed px-4 mb-5">
      Cada postre es elaborado a mano bajo pedido con insumos seleccionados, frutas frescas del día y dedicación artesanal para consentir tu paladar.
    </p>

    <!-- Píldoras de Valor Agregado -->
    <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] font-semibold text-brand-secondary/75">
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-brand-primary/15 shadow-soft-sm">
        <Icon name="lucide:check-circle-2" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Sin conservantes artificiales</span>
      </div>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-brand-primary/15 shadow-soft-sm">
        <Icon name="lucide:truck" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Envíos a todo Lima & Recojo</span>
      </div>
      <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-brand-primary/15 shadow-soft-sm">
        <Icon name="lucide:shield-check" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Garantía de frescura</span>
      </div>
    </div>
  </div>
</template>
