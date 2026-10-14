<script setup lang="ts">
import type { NuxtError } from '#app'
import { clearError } from '#app'
import { computed } from 'vue'

const props = defineProps<{
  error: NuxtError
}>()

const isNotFound = computed(() => {
  return props.error?.statusCode === 404
})

function handleGoHome(): void {
  clearError({ redirect: '/' })
}

function handleGoMenu(): void {
  clearError({ redirect: '/menu' })
}
</script>

<template>
  <div class="min-h-screen bg-[#F4F1E1] text-[#2A321B] flex flex-col justify-between selection:bg-[#4A5D23] selection:text-white font-inter relative overflow-hidden">
    <!-- Fondo decorativo sutil -->
    <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#4A5D23]/5 blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#C5A059]/10 blur-3xl pointer-events-none"></div>

    <!-- Header mínimo con logo -->
    <header class="p-6 sm:p-8 flex items-center justify-between max-w-6xl mx-auto w-full z-10">
      <NuxtLink to="/" @click.prevent="handleGoHome" class="flex items-center gap-2.5 group">
        <div class="w-10 h-10 rounded-2xl bg-white border border-[#4A5D23]/20 shadow-sm flex items-center justify-center text-[#4A5D23] group-hover:scale-105 transition-transform">
          <Icon name="lucide:cake" class="w-5 h-5 text-[#4A5D23]" />
        </div>
        <div class="leading-none">
          <span class="font-playfair text-xl font-black text-[#2A321B] tracking-tight">Dulce Fe</span>
          <span class="block text-[9px] font-bold text-[#4A5D23] uppercase tracking-widest mt-0.5">Pastelería Fina</span>
        </div>
      </NuxtLink>

      <button
        type="button"
        @click="handleGoMenu"
        class="text-xs font-bold text-[#4A5D23] hover:text-[#2A321B] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
      >
        <span>Ver Menú</span>
        <Icon name="lucide:arrow-right" class="w-3.5 h-3.5" />
      </button>
    </header>

    <!-- Contenido Central -->
    <main class="flex-1 flex items-center justify-center px-6 py-12 z-10">
      <div class="max-w-lg w-full text-center space-y-6">
        <!-- Badge con Código de Error -->
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-[#4A5D23]/15 text-[#4A5D23] text-xs font-bold tracking-widest uppercase shadow-2xs">
          <Icon :name="isNotFound ? 'lucide:compass' : 'lucide:alert-circle'" class="w-4 h-4 text-[#4A5D23]" />
          <span>Error {{ error?.statusCode || 500 }}</span>
        </div>

        <!-- Ilustración / Icono Central -->
        <div class="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div class="absolute inset-0 rounded-full bg-white shadow-soft-md border border-[#4A5D23]/10"></div>
          <Icon 
            :name="isNotFound ? 'lucide:cookie' : 'lucide:utensils-crossed'" 
            class="w-14 h-14 text-[#4A5D23] relative z-10" 
          />
        </div>

        <!-- Títulos -->
        <div class="space-y-3">
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-playfair font-black text-[#2A321B] leading-tight">
            {{ isNotFound ? 'Esta receta aún no sale del horno' : 'Tuvimos un imprevisto en la cocina' }}
          </h1>

          <p class="text-sm sm:text-base text-[#4A5D23]/85 font-medium leading-relaxed max-w-md mx-auto">
            {{ isNotFound 
              ? 'Parece que la página o el postre que estás buscando no existe o fue trasladado a otra sección de nuestro obrador.' 
              : (error?.message || 'Ocurrió un error inesperado al procesar tu solicitud. Nuestro equipo ya está al tanto.') 
            }}
          </p>
        </div>

        <!-- Acciones Principales -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
          <button
            type="button"
            @click="handleGoMenu"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#4A5D23] text-white text-xs sm:text-sm font-bold shadow-soft-sm hover:bg-[#3C4A1C] hover:shadow-soft-md transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="lucide:book-open" class="w-4 h-4" />
            <span>Explorar el Menú</span>
          </button>

          <button
            type="button"
            @click="handleGoHome"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white border border-[#4A5D23]/20 text-[#2A321B] text-xs sm:text-sm font-bold hover:bg-[#eae6d2] transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            <Icon name="lucide:home" class="w-4 h-4 text-[#4A5D23]" />
            <span>Volver al Inicio</span>
          </button>
        </div>
      </div>
    </main>

    <!-- Footer Mínimo -->
    <footer class="p-6 text-center text-xs text-[#4A5D23]/60 font-medium z-10 border-t border-[#4A5D23]/10">
      <p>© {{ new Date().getFullYear() }} Dulce Fe — Todos los derechos reservados.</p>
    </footer>
  </div>
</template>
