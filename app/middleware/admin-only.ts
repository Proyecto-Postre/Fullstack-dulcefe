import { useSupabaseUser } from '#imports'
import { useAuthStore } from '~/stores/auth'

// Este middleware protege las rutas que empiecen con /admin
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) {
    const user = useSupabaseUser()
    const authStore = useAuthStore()
    
    // Si no hay usuario en la sesión de Supabase, purgar store y redirigir al login
    if (!user.value) {
      authStore.clearSession()
      return navigateTo('/login')
    }

    // Asegurarnos de que el perfil esté cargado y pertenezca al usuario autenticado
    if (!authStore.profile || authStore.profile.id !== user.value.id) {
      await authStore.fetchProfile()
    }

    // Si no es admin, redirigir a su perfil de cliente
    if (!authStore.profile?.is_admin) {
      return navigateTo('/perfil')
    }
  }
})
