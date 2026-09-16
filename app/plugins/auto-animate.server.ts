export default defineNuxtPlugin((nuxtApp) => {
  // SSR stub directive for v-auto-animate to prevent SSR resolution warnings
  nuxtApp.vueApp.directive('auto-animate', {
    getSSRProps() {
      return {}
    }
  })
})
