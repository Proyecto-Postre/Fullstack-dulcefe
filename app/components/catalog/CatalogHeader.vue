<script setup lang="ts">
// Encabezado editorial clásico con ornamento de repostería fina
</script>

<template>
  <div class="text-center mb-6 sm:mb-8 max-w-3xl mx-auto">
    <!-- Píldora Superior de Marca -->
    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border border-brand-primary/20 shadow-soft-sm">
      <Icon name="lucide:sparkles" class="w-3.5 h-3.5 text-brand-accent" />
      <span>Colección Dulce Fe · Taller Artesanal</span>
    </div>

    <!-- Título Principal Editorial -->
    <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-playfair font-black text-brand-secondary mb-2 tracking-tight">
      Nuestra Carta & Especialidades
    </h1>

    <!-- Filete Ornamental Clásico de Repostería Francesa -->
    <div class="flex items-center justify-center gap-3 my-3">
      <!-- Línea izquierda degradada -->
      <div class="h-px w-16 sm:w-28 bg-gradient-to-r from-transparent via-brand-primary/30 to-brand-primary/60"></div>
      
      <!-- Ornamento central artesanal -->
      <div class="flex items-center gap-1.5 text-brand-primary">
        <span class="w-1.5 h-1.5 rotate-45 bg-brand-accent/80 rounded-[1px]"></span>
        <Icon name="lucide:sparkles" class="w-4 h-4 text-brand-primary" />
        <span class="w-1.5 h-1.5 rotate-45 bg-brand-accent/80 rounded-[1px]"></span>
      </div>

      <!-- Línea derecha degradada -->
      <div class="h-px w-16 sm:w-28 bg-gradient-to-l from-transparent via-brand-primary/30 to-brand-primary/60"></div>
    </div>

    <!-- Subtítulo en Serif Itálica Clásica (Sin cajas de texto) -->
    <p class="font-playfair italic text-xs sm:text-sm text-brand-secondary/75 tracking-wide">
      Recetas de autor horneadas al día bajo pedido para celebrar momentos inolvidables
    </p>
  </div>
</template>
