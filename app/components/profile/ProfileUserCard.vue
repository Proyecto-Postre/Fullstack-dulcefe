<script setup lang="ts">
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '~/stores/auth'

defineProps<{
  user: User | null
  profile: UserProfile | null
}>()
</script>

<template>
  <div class="bg-surface border border-brand-primary/10 rounded-[2rem] p-6 shadow-soft-md">
    <!-- Avatar e Identificación -->
    <div class="flex items-center gap-4 mb-4">
      <div class="w-14 h-14 bg-brand-cream border border-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm shrink-0">
        <Icon name="lucide:user" class="w-7 h-7" />
      </div>
      <div class="min-w-0">
        <h2 class="text-lg font-black font-playfair text-brand-secondary truncate leading-tight">
          {{ profile?.full_name || user?.user_metadata?.full_name || 'Cliente Dulce Fe' }}
        </h2>
        <p class="text-xs text-brand-primary font-medium truncate mt-0.5">
          {{ user?.email }}
        </p>
      </div>
    </div>

    <!-- Teléfono si está registrado -->
    <div v-if="profile?.phone" class="mb-4 px-3.5 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/10 flex items-center gap-2 text-xs text-brand-secondary">
      <Icon name="lucide:phone" class="w-3.5 h-3.5 text-brand-primary shrink-0" />
      <span class="font-medium truncate">{{ profile.phone }}</span>
    </div>
    
    <!-- Widget Club Dulce Fe (Puntos de Lealtad Integrados) -->
    <div class="pt-4 border-t border-brand-primary/10">
      <div class="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-300/40 shadow-soft-sm">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Icon name="lucide:award" class="w-4 h-4" />
            </div>
            <div>
              <span class="text-xs font-black uppercase tracking-wider text-amber-900 block leading-tight">Club Dulce Fe</span>
              <span class="text-[10px] text-amber-700/80 font-medium">Puntos de Lealtad</span>
            </div>
          </div>
          <div class="text-right">
            <span class="text-2xl font-black text-amber-800 leading-none block font-inter">{{ profile?.points || 0 }}</span>
            <span class="text-[9px] font-bold text-amber-700 uppercase tracking-widest">pts</span>
          </div>
        </div>
        <p class="text-[11px] text-amber-900/80 leading-snug mt-2 pt-2 border-t border-amber-200/60">
          Acumulas 1 punto por cada S/ 1.00. Próximamente podrás canjearlos por postres de regalo.
        </p>
      </div>
    </div>
  </div>
</template>
