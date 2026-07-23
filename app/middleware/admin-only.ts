import { useAuthStore } from '~/stores/auth'

// Este middleware protege las rutas que empiecen con /admin
export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path.startsWith('/admin')) {
    const authStore = useAuthStore()
    
    // Si no está logueado, mándalo al login de admin
    if (!authStore.isLoggedIn) {
      return navigateTo('/login')
    }

    // Si el perfil aún no está cargado, lo cargamos ahora
    if (!authStore.profile) {
      await authStore.fetchProfile()
    }

    // Si está logueado pero no es admin, mándalo a su perfil de cliente
    if (!authStore.profile?.is_admin) {
      return navigateTo('/perfil')
    }
  }
})
