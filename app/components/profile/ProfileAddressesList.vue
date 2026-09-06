<script setup lang="ts">
import type { UserAddress } from '~/stores/auth'

defineProps<{
  addresses: UserAddress[]
  isDeletingId: string | null
}>()

defineEmits<{
  (e: 'newAddress'): void
  (e: 'editAddress', address: UserAddress): void
  (e: 'deleteAddress', id: string): void
}>()
</script>

<template>
  <div class="animate-pop">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-playfair font-bold text-brand-secondary">Mis Direcciones</h2>
      <button 
        @click="$emit('newAddress')"
        class="flex items-center gap-1.5 text-xs font-bold bg-brand-primary text-white px-4 py-2 rounded-full hover:bg-brand-secondary transition-all cursor-pointer shadow-soft-sm"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        Nueva Dirección
      </button>
    </div>

    <div v-if="addresses.length === 0" class="text-center py-12 text-brand-primary">
      <Icon name="lucide:map-pin" class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="font-bold text-sm">No tienes direcciones guardadas.</p>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="address in addresses" 
        :key="address.id"
        class="border border-brand-primary/10 rounded-2xl p-5 flex items-start gap-4 relative group bg-brand-cream/30"
      >
        <div class="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-brand-primary shrink-0 shadow-soft-sm">
          <Icon name="lucide:home" class="w-5 h-5" />
        </div>
        <div class="flex-1 pr-12">
          <h3 class="font-bold text-brand-secondary mb-1 text-sm">{{ address.label }}</h3>
          <p class="text-xs text-brand-primary/90 leading-relaxed">{{ address.address_line }}</p>
        </div>
        
        <div class="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            @click="$emit('editAddress', address)"
            class="w-8 h-8 rounded-full bg-surface text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-colors cursor-pointer shadow-soft-sm"
            title="Editar"
          >
            <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
          </button>
          <button 
            @click="$emit('deleteAddress', address.id)"
            :disabled="isDeletingId === address.id"
            class="w-8 h-8 rounded-full bg-red-50 text-status-danger flex items-center justify-center hover:bg-status-danger hover:text-white transition-colors disabled:opacity-50 cursor-pointer shadow-soft-sm"
            title="Eliminar"
          >
            <Icon v-if="isDeletingId === address.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
