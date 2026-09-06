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
  <div class="bg-surface border border-brand-primary/10 rounded-[2rem] p-4 shadow-soft-md flex flex-col gap-2">
    <button 
      @click="$emit('update:activeTab', 'history')"
      :class="[
        'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer text-sm',
        activeTab === 'history' ? 'bg-brand-primary text-white' : 'hover:bg-brand-cream text-brand-secondary'
      ]"
    >
      <Icon name="lucide:history" class="w-4 h-4" />
      Historial de Pedidos
    </button>
    <button 
      @click="$emit('update:activeTab', 'addresses')"
      :class="[
        'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer text-sm',
        activeTab === 'addresses' ? 'bg-brand-primary text-white' : 'hover:bg-brand-cream text-brand-secondary'
      ]"
    >
      <Icon name="lucide:map-pin" class="w-4 h-4" />
      Mis Direcciones
    </button>
    <button 
      @click="$emit('update:activeTab', 'points')"
      :class="[
        'flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left cursor-pointer text-sm',
        activeTab === 'points' ? 'bg-brand-primary text-white' : 'hover:bg-brand-cream text-brand-secondary'
      ]"
    >
      <Icon name="lucide:star" class="w-4 h-4" />
      Programa de Lealtad
    </button>
  </div>
</template>
