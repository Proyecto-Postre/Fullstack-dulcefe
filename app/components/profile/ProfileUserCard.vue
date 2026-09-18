<script setup lang="ts">
import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '~/stores/auth'

defineProps<{
  user: User | null
  profile: UserProfile | null
}>()
</script>

<template>
  <div class="bg-surface border border-brand-primary/10 rounded-2xl lg:rounded-[2rem] p-4 sm:p-6 shadow-soft-sm lg:shadow-soft-md">
    <!-- Fila de usuario (Avatar + Datos + Puntos integrados) -->
    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 sm:gap-4 min-w-0">
        <div class="w-11 h-11 sm:w-14 sm:h-14 bg-brand-cream border border-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary shadow-soft-sm shrink-0">
          <Icon name="lucide:user" class="w-5 h-5 sm:w-7 sm:h-7" />
        </div>
        <div class="min-w-0">
          <h2 class="text-base sm:text-lg font-black font-playfair text-brand-secondary leading-snug">
            {{ profile?.full_name || user?.user_metadata?.full_name || 'Cliente Dulce Fe' }}
          </h2>
          <p class="text-[11px] sm:text-xs text-brand-primary font-medium truncate mt-0.5">
            {{ user?.email }}
          </p>
          <p v-if="profile?.phone" class="text-[11px] text-brand-secondary/70 flex items-center gap-1 mt-0.5 lg:hidden">
            <Icon name="lucide:phone" class="w-3 h-3 text-brand-primary shrink-0" />
            <span>{{ profile.phone }}</span>
          </p>
        </div>
      </div>

      <!-- Badge de Puntos en Mobile (Compacto y elegante en cabecera) -->
      <div class="lg:hidden shrink-0">
        <div class="px-3 py-1.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300/60 shadow-2xs flex items-center gap-1.5">
          <Icon name="lucide:award" class="w-4 h-4 text-amber-600 shrink-0" />
          <div class="text-right leading-none">
            <span class="text-sm font-black text-amber-900 font-inter">{{ profile?.points || 0 }}</span>
            <span class="text-[9px] font-bold text-amber-700 uppercase ml-0.5">pts</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Teléfono si está registrado (En Desktop) -->
    <div v-if="profile?.phone" class="hidden lg:flex mt-4 px-3.5 py-2 rounded-xl bg-brand-cream/40 border border-brand-primary/10 items-center gap-2 text-xs text-brand-secondary">
      <Icon name="lucide:phone" class="w-3.5 h-3.5 text-brand-primary shrink-0" />
      <span class="font-medium truncate">{{ profile.phone }}</span>
    </div>
    
    <!-- Widget Club Dulce Fe (Expandido para Desktop) -->
    <div class="hidden lg:block pt-4 mt-4 border-t border-brand-primary/10">
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
