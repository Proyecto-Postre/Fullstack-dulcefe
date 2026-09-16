import { useSupabaseUser } from '#imports'
import { useAuthStore } from '~/stores/auth'
import type { User } from '@supabase/supabase-js'

// Este middleware protege las rutas que empiecen con /admin
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) {
    const user = useSupabaseUser()
    const authStore = useAuthStore()
    
    if (import.meta.client && !user.value && authStore.isLoggedIn) {
      authStore.initAuth()
    }

    // Si no hay usuario en la sesión de Supabase, purgar store y redirigir al login
    if (!user.value) {
      authStore.clearSession()
      return navigateTo('/login')
    }

    // Sincronizar el usuario activo de Supabase con el store
    if (!authStore.user || authStore.user.id !== user.value.id) {
      authStore.user = user.value as unknown as User
    }

    // Asegurarnos de que el perfil esté cargado y pertenezca al usuario autenticado
    if (!authStore.profile || authStore.profile.id !== user.value.id) {
      await authStore.fetchProfile(user.value.id)
    }

    // Si no es admin, redirigir a su perfil de cliente
    if (!authStore.profile?.is_admin) {
      return navigateTo('/perfil')
    }
  }
})
