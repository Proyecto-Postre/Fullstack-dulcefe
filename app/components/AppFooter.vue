<script setup lang="ts">
import { computed } from 'vue'

const config = useRuntimeConfig()

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
  <!-- Footer de la Tienda (Boutique Dulce Fe - Elegante, Armónico y Reutilizable) -->
  <footer class="z-20 bg-brand-secondary text-brand-cream py-3.5 px-4 sm:px-6 lg:px-8 border-t border-brand-primary/20 mt-auto shrink-0 pb-[max(0.85rem,env(safe-area-inset-bottom))]">
    <div class="max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto flex items-center justify-between gap-3">
      <!-- Marca e Identidad -->
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-full bg-brand-cream/10 border border-brand-cream/15 flex items-center justify-center text-brand-accent shrink-0 shadow-soft-sm">
          <Icon name="lucide:wheat" class="w-4 h-4 text-[#C5A059]" />
        </div>
        <div class="min-w-0">
          <div class="flex items-baseline gap-1.5 leading-tight">
            <span class="text-sm sm:text-base font-playfair font-black text-brand-cream tracking-tight">Dulce Fe</span>
            <span class="text-[10px] text-brand-cream/40 font-mono">© {{ new Date().getFullYear() }}</span>
          </div>
          <p class="text-[10px] text-brand-cream/60 font-medium hidden xs:block leading-none mt-0.5">
            Pastelería Fina Artesanal
          </p>
        </div>
      </div>

      <!-- Botón WhatsApp Estilo Integrado (Armonía Tonal con el Footer) -->
      <a 
        :href="whatsappCleanUrl" 
        target="_blank" 
        rel="noopener noreferrer"
        class="group inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-brand-cream/10 hover:bg-brand-cream/20 text-brand-cream border border-brand-cream/15 hover:border-brand-cream/30 backdrop-blur-sm shadow-soft-sm transition-all duration-200 active:scale-95 shrink-0 select-none cursor-pointer"
        aria-label="Atención por WhatsApp"
      >
        <Icon name="lucide:message-circle" class="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors shrink-0" />
        <span class="text-xs font-medium tracking-tight text-brand-cream/90 group-hover:text-white transition-colors">
          <span class="hidden sm:inline">WhatsApp: {{ formattedWhatsApp }}</span>
          <span class="sm:hidden">WhatsApp</span>
        </span>
      </a>
    </div>
  </footer>
</template>
