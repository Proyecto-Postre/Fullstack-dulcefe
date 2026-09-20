export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  
  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      title: 'Dulce Fe — Pastelería Fina Artesanal',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Pastelería fina y artesanal con ingredientes de la más alta calidad.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,600;0,700;1,400&display=swap' }
      ]
    }
  },
  
  modules: [
    '@pinia/nuxt',
    '@pinia-plugin-persistedstate/nuxt',
    '@nuxtjs/supabase',
    '@nuxtjs/tailwindcss',
    '@nuxt/icon'
  ],

  runtimeConfig: {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhmcnd6dXdqdm5mY2RobWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Nzg4NTQsImV4cCI6MjA5OTQ1NDg1NH0.aZPDwe2FG2oF12-NXpEbR9ADfLyJYhxePQjC8xHHKqs',
    public: {
      supabaseUrl: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://rklxfrwzuwjvnfcdhmei.supabase.co',
      supabaseAnonKey: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhmcnd6dXdqdm5mY2RobWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Nzg4NTQsImV4cCI6MjA5OTQ1NDg1NH0.aZPDwe2FG2oF12-NXpEbR9ADfLyJYhxePQjC8xHHKqs',
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || '51998265700',
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    }
  },
  
  piniaPersistedstate: {
    cookieOptions: {
      sameSite: 'lax',
    },
    storage: 'localStorage'
  },
  
  routeRules: {
    '/admin/**': { ssr: false }
  },

  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL || process.env.NUXT_PUBLIC_SUPABASE_URL || 'https://rklxfrwzuwjvnfcdhmei.supabase.co',
    key: process.env.SUPABASE_KEY || process.env.NUXT_PUBLIC_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhmcnd6dXdqdm5mY2RobWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Nzg4NTQsImV4cCI6MjA5OTQ1NDg1NH0.aZPDwe2FG2oF12-NXpEbR9ADfLyJYhxePQjC8xHHKqs',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrbHhmcnd6dXdqdm5mY2RobWVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4Nzg4NTQsImV4cCI6MjA5OTQ1NDg1NH0.aZPDwe2FG2oF12-NXpEbR9ADfLyJYhxePQjC8xHHKqs',
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    }
  }
})