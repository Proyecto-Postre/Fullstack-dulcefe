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

    const effectiveUser = user.value || authStore.user

    // Si no hay usuario ni en Supabase ni en store, redirigir al login
    if (!effectiveUser) {
      authStore.clearSession()
      return navigateTo('/login')
    }

    // Sincronizar el usuario activo de Supabase con el store si difieren
    if (user.value && (!authStore.user || authStore.user.id !== user.value.id)) {
      authStore.user = user.value as unknown as User
    }

    const activeUserId = effectiveUser.id

    // Si el perfil ya está cargado en el store, corresponde al usuario activo y es admin, autorizar directamente
    if (authStore.profile && authStore.profile.id === activeUserId && authStore.profile.is_admin === true) {
      return
    }

    // Si el perfil falta o es de otro usuario, consultarlo de la base de datos
    if (!authStore.profile || authStore.profile.id !== activeUserId) {
      await authStore.fetchProfile(activeUserId)
    }

    // Si confirmadamente no es admin, redirigir a su perfil de cliente
    if (!authStore.profile?.is_admin) {
      return navigateTo('/perfil')
    }
  }
})
