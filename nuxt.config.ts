// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  // INYECTAMOS EL MÓDULO AQUÍ:
  modules: ['@nuxtjs/supabase'],
  
})