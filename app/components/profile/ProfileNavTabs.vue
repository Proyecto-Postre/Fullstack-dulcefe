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
      @click="$emit('update:activeTab', 'personal')"
      type="button"
      :class="[
        'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left cursor-pointer text-xs sm:text-sm border',
        activeTab === 'personal' 
          ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm' 
          : 'bg-transparent border-transparent hover:bg-brand-cream/60 text-brand-secondary'
      ]"
    >
      <Icon name="lucide:user" class="w-4 h-4 shrink-0" />
      <span>Datos Personales</span>
    </button>

    <button 
      @click="$emit('update:activeTab', 'history')"
      type="button"
      :class="[
        'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left cursor-pointer text-xs sm:text-sm border',
        activeTab === 'history' 
          ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm' 
          : 'bg-transparent border-transparent hover:bg-brand-cream/60 text-brand-secondary'
      ]"
    >
      <Icon name="lucide:shopping-bag" class="w-4 h-4 shrink-0" />
      <span>Mis Pedidos</span>
    </button>

    <button 
      @click="$emit('update:activeTab', 'addresses')"
      type="button"
      :class="[
        'flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-left cursor-pointer text-xs sm:text-sm border',
        activeTab === 'addresses' 
          ? 'bg-brand-primary text-white border-brand-primary shadow-soft-sm' 
          : 'bg-transparent border-transparent hover:bg-brand-cream/60 text-brand-secondary'
      ]"
    >
      <Icon name="lucide:map-pin" class="w-4 h-4 shrink-0" />
      <span>Mis Direcciones</span>
    </button>
  </div>
</template>
