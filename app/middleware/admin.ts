export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Si no está logueado, redirigir al login
  if (!authStore.isLoggedIn) {
    return navigateTo('/cuenta')
  }

  // Si está logueado pero no es admin, redirigir al perfil
  if (authStore.profile && !authStore.profile.is_admin) {
    return navigateTo('/perfil')
  }
})
