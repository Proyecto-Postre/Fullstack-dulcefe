<script setup lang="ts">
import type { ProfileOrder } from '~/types/profile'

defineProps<{
  orders: ProfileOrder[]
  isLoading: boolean
  formatDate: (dateStr: string) => string
  getStatusBadge: (status: string | null) => string
  getStatusLabel: (status: string | null) => string
}>()

defineEmits<{
  (e: 'selectOrder', order: ProfileOrder): void
}>()
</script>

<template>
  <div class="animate-pop">
    <h2 class="text-2xl font-playfair font-bold mb-6 text-brand-secondary">Historial de Pedidos</h2>
    
    <div v-if="isLoading" class="flex justify-center py-12">
      <Icon name="lucide:loader-2" class="w-8 h-8 text-brand-primary animate-spin" />
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-12 text-brand-primary">
      <Icon name="lucide:shopping-bag" class="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p class="font-bold text-sm">Aún no has realizado ningún pedido.</p>
      <NuxtLink 
        to="/menu" 
        class="inline-block mt-4 text-xs font-bold text-white bg-brand-primary px-6 py-2.5 rounded-full hover:bg-brand-secondary transition-all"
      >
        Ir a la Carta
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="order in orders" 
        :key="order.id"
        @click="$emit('selectOrder', order)"
        class="border border-brand-primary/10 rounded-2xl p-5 hover:border-brand-primary/40 transition-all cursor-pointer bg-brand-cream/30 hover:bg-brand-cream/60 flex items-center justify-between"
      >
        <div>
          <div class="flex items-center gap-3 mb-1">
            <span class="font-bold text-sm text-brand-secondary">Pedido #{{ order.id.slice(0, 8) }}</span>
            <span :class="['text-[11px] font-bold px-2.5 py-0.5 rounded-full border', getStatusBadge(order.status)]">
              {{ getStatusLabel(order.status) }}
            </span>
          </div>
          <p class="text-xs text-brand-primary/80">
            {{ formatDate(order.created_at) }}
          </p>
        </div>
        <div class="text-right">
          <span class="text-xs text-brand-primary block">Total</span>
          <span class="text-lg font-black font-inter text-brand-secondary">
            S/ {{ Number(order.total_amount).toFixed(2) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
