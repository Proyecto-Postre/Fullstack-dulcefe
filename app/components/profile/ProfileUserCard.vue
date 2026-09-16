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
    <div class="w-16 h-16 bg-brand-cream border border-brand-primary/20 rounded-full flex items-center justify-center mb-4 shadow-soft-sm">
      <Icon name="lucide:user" class="w-8 h-8 text-brand-primary" />
    </div>
    <h2 class="text-xl font-black font-playfair mb-1 text-brand-secondary">
      {{ user?.user_metadata?.full_name || 'Cliente Dulce Fe' }}
    </h2>
    <p class="text-sm text-brand-primary font-medium truncate">
      {{ user?.email }}
    </p>
    
    <div class="mt-6 pt-6 border-t border-brand-primary/10">
      <div class="flex items-center justify-between">
        <span class="font-bold text-sm uppercase tracking-wider text-brand-secondary">Puntos Dulce Fe</span>
        <span class="text-2xl font-black text-brand-primary">{{ profile?.points || 0 }}</span>
      </div>
    </div>

    <!-- Acceso Rápido a Panel Admin si es Administrador -->
    <div v-if="profile?.is_admin" class="mt-6 pt-6 border-t border-brand-primary/10">
      <NuxtLink
        to="/admin"
        class="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-soft-sm cursor-pointer"
      >
        <Icon name="lucide:shield-check" class="w-4 h-4 text-status-success" />
        <span>Ir al Panel de Administración</span>
      </NuxtLink>
    </div>
  </div>
</template>
