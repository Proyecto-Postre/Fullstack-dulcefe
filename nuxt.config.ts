export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  app: {
    pageTransition: { name: 'page', mode: 'out-in' }
  },
  
  // AGREGA '@nuxtjs/tailwindcss' EXACTAMENTE AQUÍ:
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],
  
  piniaPluginPersistedstate: {
    cookieOptions: {
      sameSite: 'lax',
    },
    storage: 'cookies'
  },
  
  supabase: {
    redirect: false,
    url: 'https://rklxfrwzuwjvnfcdhmei.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhmcnd6dXdqdm5mY2RobWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Nzg4NTQsImV4cCI6MjA5OTQ1NDg1NH0.aZPDwe2FG2oF12-NXpEbR9ADfLyJYhxePQjC8xHHKqs'
  }
})