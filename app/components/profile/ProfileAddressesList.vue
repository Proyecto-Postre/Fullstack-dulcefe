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

// Obtener icono según la etiqueta
const getAddressIcon = (label: string): string => {
  const clean = label.toLowerCase().trim()
  if (clean.includes('trabajo') || clean.includes('oficina') || clean.includes('chamba')) {
    return 'lucide:briefcase'
  }
  if (clean.includes('depa') || clean.includes('departamento') || clean.includes('edificio')) {
    return 'lucide:building-2'
  }
  return 'lucide:home'
}

// Separar la dirección principal de la referencia
const parseAddressParts = (raw: string) => {
  if (!raw) return { line: '', reference: '' }
  const match = raw.match(/^(.*?)\s*\(Ref:\s*(.*?)\)$/i)
  if (match && match[1] && match[2]) {
    return {
      line: match[1].trim(),
      reference: match[2].trim()
    }
  }
  return {
    line: raw.trim(),
    reference: ''
  }
}
</script>

<template>
  <div class="animate-pop space-y-5 sm:space-y-6">
    <!-- Encabezado con Botón Nueva Dirección -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-brand-primary/10">
      <div>
        <h2 class="text-xl sm:text-2xl font-playfair font-black text-brand-secondary">Mis Direcciones</h2>
        <p class="text-xs text-brand-primary/80">Guarda tus lugares frecuentes para coordinar el delivery de tus postres</p>
      </div>
      <button 
        @click="$emit('newAddress')"
        class="inline-flex items-center justify-center gap-1.5 text-xs font-bold bg-brand-primary text-white px-5 py-2.5 rounded-2xl hover:bg-brand-secondary transition-all cursor-pointer shadow-soft-sm active:scale-95 shrink-0"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Nueva Dirección</span>
      </button>
    </div>

    <!-- Estado Vacío -->
    <div 
      v-if="addresses.length === 0" 
      class="text-center py-14 px-4 rounded-3xl bg-brand-cream/20 border border-dashed border-brand-primary/20"
    >
      <div class="w-14 h-14 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-3 text-brand-primary shadow-soft-sm">
        <Icon name="lucide:map-pin" class="w-7 h-7 opacity-40" />
      </div>
      <h3 class="font-playfair font-bold text-base text-brand-secondary mb-1">No tienes direcciones guardadas</h3>
      <p class="text-xs text-brand-primary max-w-xs mx-auto mb-5 leading-relaxed">
        Agrega tu casa, oficina o lugar de entrega favorito para pedir tus postres con 1 solo clic.
      </p>
      <button 
        @click="$emit('newAddress')"
        class="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-primary px-5 py-2.5 rounded-full hover:bg-brand-secondary shadow-soft-sm hover:shadow-md transition-all cursor-pointer"
      >
        <Icon name="lucide:plus" class="w-4 h-4" />
        <span>Agregar Dirección</span>
      </button>
    </div>

    <!-- Grilla de Tarjetas de Direcciones Adaptable (1 extendida si hay 1, 2 columnas si hay 2 o más) -->
    <div 
      v-else 
      class="grid gap-3.5 sm:gap-4"
      :class="addresses.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'"
    >
      <div 
        v-for="address in addresses" 
        :key="address.id"
        class="border border-brand-primary/15 hover:border-brand-primary/40 rounded-2xl sm:rounded-3xl p-4 sm:p-5 flex flex-col justify-between bg-surface hover:bg-brand-cream/25 transition-all duration-200 shadow-soft-sm hover:shadow-md relative group"
        :class="addresses.length === 1 ? 'sm:gap-3.5' : 'gap-3'"
      >
        <!-- Fila Superior: Icono + Título + Badge (y botones en desktop si solo hay 1) -->
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="w-9 h-9 rounded-xl bg-brand-cream border border-brand-primary/15 flex items-center justify-center text-brand-primary shrink-0 shadow-2xs">
              <Icon :name="getAddressIcon(address.label)" class="w-4 h-4" />
            </div>
            <div class="flex items-center gap-2 min-w-0">
              <h3 class="font-black font-playfair text-brand-secondary text-sm sm:text-base truncate capitalize">
                {{ address.label }}
              </h3>
              <span class="inline-flex items-center gap-1 text-[10px] font-bold text-brand-primary/80 bg-brand-cream/70 border border-brand-primary/10 px-2 py-0.5 rounded-full shrink-0">
                <Icon name="lucide:map-pin" class="w-3 h-3 text-brand-primary" />
                Guardada
              </span>
            </div>
          </div>

          <!-- Acciones en cabecera exclusivas para Desktop cuando es 1 sola dirección -->
          <div v-if="addresses.length === 1" class="hidden sm:flex items-center gap-2 shrink-0">
            <button 
              @click="$emit('editAddress', address)"
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-cream/70 hover:bg-brand-primary hover:text-white text-brand-secondary text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-95"
              aria-label="Editar dirección"
            >
              <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
            
            <button 
              @click="$emit('deleteAddress', address.id)"
              :disabled="isDeletingId === address.id"
              type="button"
              class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50/80 hover:bg-status-danger hover:text-white text-status-danger text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-95"
              aria-label="Eliminar dirección"
            >
              <Icon v-if="isDeletingId === address.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
              <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        <!-- Dirección Principal y Referencia -->
        <div 
          class="space-y-1.5"
          :class="addresses.length === 1 ? 'sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:space-y-0' : ''"
        >
          <p class="text-xs sm:text-sm font-semibold text-brand-secondary leading-snug">
            {{ parseAddressParts(address.address_line).line }}
          </p>

          <!-- Referencia Destacada (Píldora ámbar suave para el repartidor) -->
          <div 
            v-if="parseAddressParts(address.address_line).reference"
            class="inline-flex items-start gap-1.5 text-[11px] text-amber-900 bg-amber-50/80 border border-amber-200/70 px-2.5 py-1 rounded-xl leading-relaxed"
          >
            <Icon name="lucide:navigation" class="w-3 h-3 text-amber-700 shrink-0 mt-0.5" />
            <span><strong class="font-bold">Ref:</strong> {{ parseAddressParts(address.address_line).reference }}</span>
          </div>
        </div>
        
        <!-- Botones de Acción para Mobile O cuando hay más de 1 dirección -->
        <div 
          class="pt-3 border-t border-brand-primary/10 flex items-center justify-end gap-2"
          :class="addresses.length === 1 ? 'sm:hidden' : 'mt-2'"
        >
          <button 
            @click="$emit('editAddress', address)"
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-cream/70 hover:bg-brand-primary hover:text-white text-brand-secondary text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-95"
            aria-label="Editar dirección"
          >
            <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
            <span>Editar</span>
          </button>
          
          <button 
            @click="$emit('deleteAddress', address.id)"
            :disabled="isDeletingId === address.id"
            type="button"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50/80 hover:bg-status-danger hover:text-white text-status-danger text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-2xs hover:shadow-soft-sm active:scale-95"
            aria-label="Eliminar dirección"
          >
            <Icon v-if="isDeletingId === address.id" name="lucide:loader-2" class="w-3.5 h-3.5 animate-spin" />
            <Icon v-else name="lucide:trash-2" class="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
