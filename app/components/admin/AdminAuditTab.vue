<script setup lang="ts">
import { ref, computed } from 'vue'
import AuditKardexView from '~/components/admin/audit/AuditKardexView.vue'
import AuditEventsView from '~/components/admin/audit/AuditEventsView.vue'
import AuditWasteView from '~/components/admin/audit/AuditWasteView.vue'
import AuditFinancialView from '~/components/admin/audit/AuditFinancialView.vue'

type AuditView = 'kardex' | 'events' | 'waste' | 'financial'

const activeView = ref<AuditView>('kardex')

// Consultar insumos para selectores de kárdex
const { data: rawMaterialsRes } = useFetch<{ success: boolean; data: Array<{ id: number; name: string; unit: string }> }>(
  '/api/raw-materials',
  { lazy: true }
)

const materials = computed(() => rawMaterialsRes.value?.data || [])

const views: { id: AuditView; label: string; icon: string; desc: string }[] = [
  { id: 'kardex', label: 'Movimientos de Insumos', icon: 'lucide:scale', desc: 'Entradas, salidas y stock de materias primas' },
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
          Historial de almacén, bitácora inmutable de operaciones, control de mermas y análisis de rentabilidad.
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
          'flex flex-col text-left p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative overflow-hidden group',
          activeView === v.id
            ? 'bg-white border-brand-primary/40 shadow-soft-md ring-2 ring-brand-primary/15 -translate-y-0.5 text-brand-secondary'
            : 'bg-white/80 border-brand-primary/10 hover:bg-white hover:border-brand-primary/25 hover:shadow-soft-sm hover:-translate-y-0.5 text-brand-secondary/70'
        ]"
      >
        <!-- Línea Verde de Acento Superior -->
        <div 
          :class="[
            'absolute top-0 left-0 right-0 h-1.5 transition-all duration-300', 
            activeView === v.id 
              ? 'bg-gradient-to-r from-brand-primary to-brand-primary/80 scale-x-100' 
              : 'bg-brand-primary/25 scale-x-0 group-hover:scale-x-50'
          ]"
        ></div>

        <!-- Encabezado de la Tarjeta (Ícono en cápsula + Título + Indicador Activo) -->
        <div class="flex items-center gap-2.5 mb-1.5">
          <div 
            :class="[
              'w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              activeView === v.id
                ? 'bg-brand-primary/12 text-brand-primary shadow-xs'
                : 'bg-brand-cream text-brand-secondary/60 group-hover:bg-brand-primary/10 group-hover:text-brand-primary'
            ]"
          >
            <Icon :name="v.icon" class="w-4 h-4" />
          </div>
          <span :class="['text-xs font-bold leading-tight flex-1', activeView === v.id ? 'text-brand-secondary font-black' : 'text-brand-secondary/85']">
            {{ v.label }}
          </span>
          <span 
            v-if="activeView === v.id" 
            class="w-2 h-2 rounded-full bg-brand-primary shrink-0 shadow-xs ring-4 ring-brand-primary/10"
            title="Vista activa"
          ></span>
        </div>

        <!-- Descripción -->
        <span :class="['text-[10px] line-clamp-1 transition-colors pl-0.5', activeView === v.id ? 'text-brand-primary/80 font-medium' : 'text-brand-secondary/55']">
          {{ v.desc }}
        </span>
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
