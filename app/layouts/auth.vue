<script setup lang="ts">
// Layout dedicado para Autenticación (Login / Registro)
// Minimalista, centrado, sin navbar ni footer gigante de tienda, con botón para volver.
</script>

<template>
  <div class="min-h-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream relative overflow-hidden flex flex-col justify-between">
    
    <!-- Elementos Botánicos Ambientales de Fondo -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-5%] w-96 h-96 text-brand-primary/[0.03] -rotate-12 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute bottom-[10%] right-[-10%] w-[36rem] h-[36rem] text-brand-primary/[0.03] rotate-45 pointer-events-none" />
      <Icon name="lucide:wheat" class="absolute top-[20%] right-[5%] w-72 h-72 text-brand-primary/[0.02] -rotate-45 pointer-events-none" />
    </div>

    <!-- Header mínimo con botón Volver y Logo -->
    <header class="relative z-20 w-full max-w-5xl mx-auto px-6 py-2.5 sm:py-3 flex items-center justify-between">
      <NuxtLink 
        to="/" 
        class="inline-flex items-center gap-2 text-xs font-bold text-brand-primary hover:text-brand-secondary bg-surface/90 hover:bg-surface border border-brand-primary/15 px-3 py-1.5 rounded-xl transition-all shadow-soft-sm cursor-pointer"
      >
        <Icon name="lucide:arrow-left" class="w-3.5 h-3.5" />
        <span>Volver a la tienda</span>
      </NuxtLink>

      <NuxtLink to="/" class="flex items-center gap-2 group cursor-pointer">
        <div class="w-8 h-8 border border-brand-primary/20 bg-surface rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm group-hover:scale-105 transition-transform">
          <Icon name="lucide:wheat" class="w-4 h-4" />
        </div>
        <span class="text-lg font-playfair font-black tracking-tight text-brand-secondary">
          Dulce Fe
        </span>
      </NuxtLink>
    </header>

    <!-- Contenido Principal Centrado (Slot) -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 py-1 sm:py-2">
      <slot />
    </main>

    <!-- Footer mínimo -->
    <footer class="relative z-10 py-1.5 text-center text-[11px] font-semibold text-brand-secondary/40">
      Dulce Fe Pastelería Fina &copy; {{ new Date().getFullYear() }} &bull; Hecho con amor
    </footer>

  </div>
</template>
