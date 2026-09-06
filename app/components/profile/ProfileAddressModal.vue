<script setup lang="ts">
import type { ProfileAddressItem } from '~/types/profile'

defineProps<{
  show: boolean
  address: ProfileAddressItem
  isSaving: boolean
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'save'): void
}>()
</script>

<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div class="bg-surface rounded-3xl p-8 max-w-xl w-full shadow-soft-lg animate-pop relative max-h-[85vh] overflow-y-auto custom-scrollbar">
      <button 
        @click="$emit('close')" 
        class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-brand-cream text-brand-secondary hover:bg-brand-primary hover:text-white transition-colors cursor-pointer"
        title="Cerrar modal"
      >
        <Icon name="lucide:x" class="w-4 h-4" />
      </button>
      
      <h3 class="text-2xl font-playfair font-bold mb-6 text-brand-secondary">
        {{ address.id ? 'Editar Dirección' : 'Nueva Dirección' }}
      </h3>
      
      <div class="space-y-5">
        <div>
          <label class="block text-xs font-bold mb-2 uppercase tracking-wider text-brand-secondary">
            Nombre de la dirección
          </label>
          <input 
            v-model="address.label" 
            type="text" 
            class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary text-sm font-medium text-brand-secondary transition-colors" 
            placeholder="Ej. Casa, Trabajo"
          >
        </div>
        
        <div>
          <label class="block text-xs font-bold mb-2 uppercase tracking-wider text-brand-secondary">
            Dirección completa
          </label>
          <textarea 
            v-model="address.address_line" 
            rows="3" 
            class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary text-sm font-medium text-brand-secondary transition-colors resize-none" 
            placeholder="Av. Los Pinos 123, Dpto 402..."
          ></textarea>
        </div>
        
        <div>
          <label class="block text-xs font-bold mb-2 uppercase tracking-wider text-brand-secondary">
            Referencia
          </label>
          <input 
            v-model="address.reference" 
            type="text" 
            class="w-full bg-brand-cream/60 border border-brand-primary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary text-sm font-medium text-brand-secondary transition-colors" 
            placeholder="Frente al parque principal"
          >
        </div>
        
        <button 
          @click="$emit('save')" 
          :disabled="isSaving || !address.label || !address.address_line"
          class="w-full bg-brand-primary text-white font-bold py-4 rounded-xl mt-2 hover:bg-brand-secondary transition-colors shadow-soft-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer text-sm uppercase tracking-wider"
        >
          <Icon v-if="isSaving" name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          {{ isSaving ? 'Guardando...' : 'Guardar Dirección' }}
        </button>
      </div>
    </div>
  </div>
</template>
