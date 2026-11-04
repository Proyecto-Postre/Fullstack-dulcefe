<script setup lang="ts">
import { ref } from 'vue'

type AuditView = 'kardex' | 'events' | 'waste' | 'financial'

const activeView = ref<AuditView>('kardex')

// Consultar insumos para selectores de kárdex
const { data: rawMaterialsRes } = useFetch<{ success: boolean; data: Array<{ id: number; name: string; unit: string }> }>(
  '/api/raw-materials',
  { lazy: true }
)

const materials = computed(() => rawMaterialsRes.value?.data || [])

const views: { id: AuditView; label: string; icon: string; desc: string }[] = [
  { id: 'kardex', label: 'Kárdex de Insumos', icon: 'lucide:scale', desc: 'Entradas, salidas y variaciones de almacén' },
  { id: 'events', label: 'Bitácora del Sistema', icon: 'lucide:activity', desc: 'Registro inmutable de acciones operativas' },
  { id: 'waste', label: 'Mermas & Desperdicios', icon: 'lucide:trash-2', desc: 'Control de pérdidas y descartes de taller' },
  { id: 'financial', label: 'Auditoría Financiera', icon: 'lucide:trending-up', desc: 'Márgenes y costos congelados por pedido' }
]
</script>

<template>
  <div class="flex flex-col gap-5 sm:gap-6 pb-12">
    <!-- Header Editorial del Módulo -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-primary/10 pb-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest border border-brand-primary/15">
            Módulo Exclusivo Admin
          </span>
          <span class="text-xs font-mono text-brand-primary/60">Trazabilidad Total</span>
        </div>
        <h2 class="text-xl sm:text-2xl font-black font-playfair tracking-tight text-brand-secondary">
          Auditoría & Trazabilidad
        </h2>
        <p class="text-xs text-brand-secondary/70 mt-0.5">
          Kárdex de almacén, bitácora inmutable de operaciones, control de mermas y análisis de rentabilidad.
        </p>
      </div>
    </div>

    <!-- Selector de Sub-Vistas (Pills Interactivos) -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      <button
        v-for="v in views"
        :key="v.id"
        @click="activeView = v.id"
        type="button"
        :class="[
          'flex flex-col text-left p-3 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group',
          activeView === v.id
            ? 'bg-brand-cream border-brand-primary/30 shadow-soft-sm text-brand-secondary'
            : 'bg-surface border-brand-primary/10 hover:border-brand-primary/25 hover:bg-brand-cream/30 text-brand-secondary/80'
        ]"
      >
        <div :class="['absolute top-0 left-0 right-0 h-1 bg-brand-primary transition-transform duration-200', activeView === v.id ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50']"></div>
        <div class="flex items-center gap-2 mb-1">
          <Icon :name="v.icon" :class="['w-4 h-4', activeView === v.id ? 'text-brand-primary' : 'text-brand-secondary/60']" />
          <span class="text-xs font-bold">{{ v.label }}</span>
        </div>
        <span class="text-[10px] text-brand-secondary/60 line-clamp-1">{{ v.desc }}</span>
      </button>
    </div>

    <!-- Render de la Sub-Vista Activa -->
    <transition mode="out-in" enter-active-class="transition duration-150 ease-out" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0" leave-active-class="transition duration-100 ease-in" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div :key="activeView">
        <AuditKardexView v-if="activeView === 'kardex'" :materials="materials" />
        <AuditEventsView v-else-if="activeView === 'events'" />
        <AuditWasteView v-else-if="activeView === 'waste'" />
        <AuditFinancialView v-else-if="activeView === 'financial'" />
      </div>
    </transition>
  </div>
</template>
