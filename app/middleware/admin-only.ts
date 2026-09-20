import { useSupabaseUser } from '#imports'
import { useAuthStore } from '~/stores/auth'
import type { User } from '@supabase/supabase-js'

// Este middleware protege las rutas que empiecen con /admin
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) {
    const user = useSupabaseUser()
    const authStore = useAuthStore()
    
    // 1. Autorización inmediata de recarga (F5):
    // Si el usuario y su perfil de administrador ya están persistidos y verificados en el store, autorizar de inmediato
    const effectiveUserId = user.value?.id || authStore.user?.id
    if (effectiveUserId && authStore.profile && authStore.profile.id === effectiveUserId && authStore.profile.is_admin === true) {
      return
    }

    // 2. Si hay sesión persistida pero useSupabaseUser aún no hidrató en cliente, sincronizar
    if (import.meta.client && !user.value && authStore.isLoggedIn) {
      await authStore.initAuth()
    }

    const effectiveUser = user.value || authStore.user

    // 3. Si no hay usuario ni en Supabase ni en store, redirigir al login
    if (!effectiveUser) {
      authStore.clearSession()
      return navigateTo('/login')
    }

    // Sincronizar el usuario activo de Supabase con el store si difieren
    if (user.value && (!authStore.user || authStore.user.id !== user.value.id)) {
      authStore.user = user.value as unknown as User
    }

    const activeUserId = effectiveUser.id

    // 4. Si el perfil verificado es admin, autorizar directamente
    if (authStore.profile && authStore.profile.id === activeUserId && authStore.profile.is_admin === true) {
      return
    }

    // 5. Si el perfil falta o es de otro usuario, consultarlo de la base de datos
    if (!authStore.profile || authStore.profile.id !== activeUserId) {
      const fetchedProfile = await authStore.fetchProfile(activeUserId)
      if (fetchedProfile && fetchedProfile.id === activeUserId && fetchedProfile.is_admin === true) {
        return
      }
    }

    // 6. Si confirmadamente el perfil existe en base de datos pero no es admin, redirigir a su perfil de cliente
    if (authStore.profile && authStore.profile.id === activeUserId && authStore.profile.is_admin === false) {
      return navigateTo('/perfil')
    }

    // 7. Si por condición de carrera o reconexión aún conserva is_admin === true
    if (authStore.profile?.is_admin === true) {
      return
    }

    // Fallback de seguridad estricto
    return navigateTo('/perfil')
  }
})
