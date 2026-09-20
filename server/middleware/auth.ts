/**
 * NOTA DE ARQUITECTURA:
 * La autorización de rutas administrativas y mutaciones se ejecuta de forma explícita
 * en cada handler de API mediante los guards `requireAdmin(event)` y `requireUser(event)`
 * en `server/utils/`.
 * 
 * Se evita el uso de un middleware global por coincidencia de paths para prevenir
 * falsos controles de seguridad o fugas en nuevas rutas.
 */
export default defineEventHandler((_event) => {
  // Pass-through: la autorización vive en cada handler
})