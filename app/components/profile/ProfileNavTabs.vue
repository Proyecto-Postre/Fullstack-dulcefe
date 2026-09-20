<script setup lang="ts">
import type { ProfileTab } from '~/types/profile'

defineProps<{
  activeTab: ProfileTab
}>()

defineEmits<{
  (e: 'update:activeTab', tab: ProfileTab): void
}>()
</script>

<template>
  <!-- Segmented Control Nativo en móvil (grid 3 columnas equilibradas) / Menú vertical en desktop -->
  <div class="bg-surface/95 backdrop-blur-md border border-brand-primary/10 rounded-2xl lg:rounded-[2rem] p-1.5 sm:p-2 lg:p-4 shadow-soft-sm lg:shadow-soft-md grid grid-cols-3 lg:flex lg:flex-col gap-1 sm:gap-1.5 lg:gap-2">
    <!-- Tab 1: Mis Pedidos (Primero para acceso rápido a tracking y recompra) -->
    <button 
      @click="$emit('update:activeTab', 'history')"
      type="button"
      :class="[
        'flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1 sm:gap-2.5 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl lg:rounded-2xl font-bold transition-all duration-200 text-center lg:text-left cursor-pointer border text-xs sm:text-sm select-none',
        activeTab === 'history' 
          ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm scale-[1.02] lg:scale-100' 
          : 'bg-transparent border-transparent hover:bg-brand-cream/60 text-brand-secondary/80 hover:text-brand-secondary active:scale-95'
      ]"
      aria-label="Ver mis pedidos"
    >
      <Icon name="lucide:shopping-bag" class="w-4 h-4 shrink-0" />
      <span class="truncate leading-tight">Mis Pedidos</span>
    </button>

    <!-- Tab 2: Datos Personales -->
    <button 
      @click="$emit('update:activeTab', 'personal')"
      type="button"
      :class="[
        'flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1 sm:gap-2.5 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl lg:rounded-2xl font-bold transition-all duration-200 text-center lg:text-left cursor-pointer border text-xs sm:text-sm select-none',
        activeTab === 'personal' 
          ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm scale-[1.02] lg:scale-100' 
          : 'bg-transparent border-transparent hover:bg-brand-cream/60 text-brand-secondary/80 hover:text-brand-secondary active:scale-95'
      ]"
      aria-label="Ver datos personales"
    >
      <Icon name="lucide:user" class="w-4 h-4 shrink-0" />
      <span class="truncate leading-tight">Datos</span>
    </button>

    <!-- Tab 3: Mis Direcciones -->
    <button 
      @click="$emit('update:activeTab', 'addresses')"
      type="button"
      :class="[
        'flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1 sm:gap-2.5 px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl lg:rounded-2xl font-bold transition-all duration-200 text-center lg:text-left cursor-pointer border text-xs sm:text-sm select-none',
        activeTab === 'addresses' 
          ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm scale-[1.02] lg:scale-100' 
          : 'bg-transparent border-transparent hover:bg-brand-cream/60 text-brand-secondary/80 hover:text-brand-secondary active:scale-95'
      ]"
      aria-label="Ver mis direcciones"
    >
      <Icon name="lucide:map-pin" class="w-4 h-4 shrink-0" />
      <span class="truncate leading-tight">Direcciones</span>
    </button>
  </div>
</template>
