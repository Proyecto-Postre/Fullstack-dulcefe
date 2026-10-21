<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const config = useRuntimeConfig()
const route = useRoute()

// Ocultar el enlace a FAQ si el usuario ya se encuentra en la pantalla de preguntas frecuentes
const isFaqPage = computed(() => {
  return route.path === '/faq' || route.path === '/faq/'
})

const formattedWhatsApp = computed(() => {
  const digits = String(config.public?.whatsappNumber || '51998265700').replace(/\D/g, '')
  if (digits.startsWith('51') && digits.length === 11) {
    return `+51 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
  }
  if (digits.length === 9) {
    return `+51 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`
  }
  return digits.startsWith('51') ? `+51 ${digits.slice(2)}` : `+${digits}`
})

const whatsappCleanUrl = computed(() => {
  const digits = String(config.public?.whatsappNumber || '51998265700').replace(/\D/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent('¡Hola Dulce Fe! Deseo realizar una consulta.')}`
})
</script>

<template>
  <!-- Footer de la Tienda (Boutique Dulce Fe - Elegante, Armónico y Responsivo) -->
  <footer class="z-20 bg-brand-secondary text-brand-cream py-3 sm:py-3.5 px-4 sm:px-6 lg:px-12 border-t border-brand-primary/20 mt-auto shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
    <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
      
      <!-- Fila Superior en Móvil / Lado Izquierdo en Desktop -->
      <div class="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
        <!-- Marca e Identidad sin aplastamiento -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-cream/10 border border-brand-cream/15 flex items-center justify-center text-brand-accent shrink-0 shadow-soft-sm">
            <Icon name="lucide:wheat" class="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#C5A059]" />
          </div>
          <div class="flex items-baseline gap-1.5 leading-tight whitespace-nowrap">
            <span class="text-sm sm:text-base font-playfair font-black text-brand-cream tracking-tight">Dulce Fe</span>
            <span class="text-[10px] text-brand-cream/40 font-mono">© {{ new Date().getFullYear() }}</span>
          </div>
        </div>

        <!-- Boton WhatsApp en Móvil -->
        <a 
          :href="whatsappCleanUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="sm:hidden group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-cream/10 hover:bg-brand-cream/20 text-brand-cream border border-brand-cream/15 active:scale-95 shrink-0 select-none cursor-pointer transition-colors"
          aria-label="Atención por WhatsApp"
        >
          <Icon name="lucide:message-circle" class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span class="text-xs font-medium text-brand-cream/90">WhatsApp</span>
        </a>
      </div>

      <!-- Acciones y Enlaces Secundarios -->
      <div class="flex items-center gap-3 sm:gap-4 shrink-0">
        <!-- Enlace a Preguntas Frecuentes (solo si no esta en /faq) -->
        <NuxtLink
          v-if="!isFaqPage"
          to="/faq"
          class="inline-flex items-center gap-1.5 text-xs font-medium text-brand-cream/70 hover:text-white transition-colors py-0.5"
        >
          <Icon name="lucide:help-circle" class="w-3.5 h-3.5 sm:hidden text-brand-cream/50" />
          <span>Preguntas Frecuentes</span>
        </NuxtLink>

        <!-- Boton WhatsApp en Desktop -->
        <a 
          :href="whatsappCleanUrl" 
          target="_blank" 
          rel="noopener noreferrer"
          class="hidden sm:inline-flex group items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-brand-cream/10 hover:bg-brand-cream/20 text-brand-cream border border-brand-cream/15 hover:border-brand-cream/30 backdrop-blur-sm shadow-soft-sm transition-all duration-200 active:scale-95 shrink-0 select-none cursor-pointer"
          aria-label="Atención por WhatsApp"
        >
          <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0" />
          <span class="text-xs font-medium tracking-tight text-brand-cream/90 group-hover:text-white transition-colors">
            WhatsApp: {{ formattedWhatsApp }}
          </span>
        </a>
      </div>

    </div>
  </footer>
</template>
