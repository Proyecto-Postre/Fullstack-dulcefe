import { autoAnimatePlugin } from '@formkit/auto-animate/vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(autoAnimatePlugin)
  
  // SSR stub for v-auto-animate to prevent SSR directive errors
  nuxtApp.vueApp.directive('auto-animate', {
    getSSRProps() {
      return {}
    }
  })
})
