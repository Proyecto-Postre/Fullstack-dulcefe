<script setup lang="ts">
// Layout dedicado para Autenticación (Login / Registro)
// Minimalista, centrado, sin navbar ni footer gigante de tienda, con botón para volver.
</script>

<template>
  <div class="min-h-screen bg-brand-cream font-inter text-brand-secondary selection:bg-brand-primary selection:text-brand-cream relative overflow-hidden flex flex-col justify-between">
    
    <!-- Luces Ambientales Cálidas & Elementos Botánicos -->
    <div class="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
      <!-- Glow superior cálido / miel artesanal (brand-accent) -->
      <div class="absolute -top-24 -left-24 w-[32rem] h-[32rem] bg-gradient-to-br from-brand-accent/20 via-brand-accent/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <!-- Glow inferior verde botánico (brand-primary) -->
      <div class="absolute -bottom-24 -right-24 w-[36rem] h-[36rem] bg-gradient-to-tl from-brand-primary/10 via-brand-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <!-- Siluetas botánicas orgánicas -->
      <Icon name="lucide:leaf" class="absolute top-[-5%] left-[-4%] w-96 h-96 text-brand-primary/[0.035] -rotate-12 pointer-events-none" />
      <Icon name="lucide:leaf" class="absolute bottom-[8%] right-[-8%] w-[34rem] h-[34rem] text-brand-primary/[0.03] rotate-45 pointer-events-none" />
      <Icon name="lucide:wheat" class="absolute top-[22%] right-[6%] w-72 h-72 text-brand-primary/[0.025] -rotate-45 pointer-events-none" />
    </div>

    <!-- Header mínimo con botón Volver y Logo de Autor -->
    <header class="relative z-20 w-full max-w-md sm:max-w-lg lg:max-w-5xl xl:max-w-[1140px] 2xl:max-w-[1240px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3.5 xl:py-4 flex items-center justify-between transition-all">
      <NuxtLink 
        to="/" 
        class="inline-flex items-center gap-2 text-xs font-bold text-brand-secondary hover:text-brand-primary bg-surface/90 hover:bg-surface border border-brand-primary/15 px-3.5 py-1.5 rounded-full transition-all shadow-soft-sm cursor-pointer hover:-translate-x-0.5"
      >
        <Icon name="lucide:arrow-left" class="w-3.5 h-3.5 text-brand-primary" />
        <span>Volver a la tienda</span>
      </NuxtLink>

      <NuxtLink to="/" class="flex items-center gap-2.5 group cursor-pointer">
        <div class="w-8 h-8 border border-brand-primary/20 bg-surface rounded-xl flex items-center justify-center text-brand-primary shadow-soft-sm group-hover:scale-105 group-hover:border-brand-primary transition-all">
          <Icon name="lucide:wheat" class="w-4 h-4 text-brand-primary" />
        </div>
        <div class="flex flex-col">
          <span class="text-base sm:text-lg font-playfair font-black tracking-tight text-brand-secondary leading-none">
            Dulce Fe
          </span>
          <span class="text-[9px] font-bold uppercase tracking-widest text-brand-accent leading-none mt-0.5">
            Pastelería Artesanal
          </span>
        </div>
      </NuxtLink>
    </header>

    <!-- Contenido Principal Centrado (Slot) -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 py-1.5 sm:py-2.5">
      <slot />
    </main>

    <!-- Footer mínimo -->
    <footer class="relative z-10 py-2 text-center text-[11px] font-medium text-brand-secondary/40">
      Dulce Fe Pastelería Fina &copy; {{ new Date().getFullYear() }} &bull; Horneado artesanalmente con amor
    </footer>

  </div>
</template>
