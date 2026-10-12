<script setup lang="ts">
// Encabezado editorial compacto: sin botones falsos ni cajas que compitan con los filtros
</script>

<template>
  <div class="text-center mb-6 sm:mb-8">
    <!-- Píldora Superior de Taller -->
    <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border border-brand-primary/20 shadow-soft-sm">
      <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
      <span>Colección Dulce Fe · Taller Artesanal</span>
    </div>

    <!-- Título Principal de Autor -->
    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-black text-brand-secondary mb-3 tracking-tight">
      Nuestra Carta & Especialidades
    </h1>

    <!-- Subtítulo Tipográfico Fluido: Texto limpio sin cajas ni botones falsos -->
    <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs sm:text-sm text-brand-secondary/70 font-medium">
      <span class="inline-flex items-center gap-1.5">
        <Icon name="lucide:check" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Horneado bajo pedido</span>
      </span>
      <span class="text-brand-primary/30 hidden sm:inline">·</span>
      <span class="inline-flex items-center gap-1.5">
        <Icon name="lucide:check" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Frutas frescas del día</span>
      </span>
      <span class="text-brand-primary/30 hidden sm:inline">·</span>
      <span class="inline-flex items-center gap-1.5">
        <Icon name="lucide:check" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Envíos a todo Lima & Recojo</span>
      </span>
    </div>
  </div>
</template>
