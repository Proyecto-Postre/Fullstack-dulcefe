# Informe de Ejecución: Hardening Integral, Corrección de Modales y Estabilidad del Sistema

**Rama:** `fix/system-hardening-and-stability`  
**Fecha:** 2026-09-06  
**Autor:** Antigravity (Pair Programming con Jafeth)  
**Estado:** ✅ COMPLETADO (28 archivos de prueba, 176 tests passing, 0 lints, 0 typecheck errors, build exitoso)

---

## 1. Resumen Ejecutivo y Objetivos

A raíz de la revisión previa al despliegue de la Fase 7, el usuario reportó fallas críticas en el panel administrativo (`/admin` y `/admin/kds`):
1. **Modales no funcionales**: Al presionar los botones "Nuevo Insumo", "Nuevo Producto", "Crear Pedido Manual" o "Ver Detalle", nada sucedía en pantalla.
2. **Almacén de Insumos vacío**: A pesar de que la base de datos Supabase cuenta con 20 materias primas registradas en `public.raw_materials`, la pestaña de Almacén mostraba 0 insumos.
3. **Error 403 Forbidden en KDS**: La pantalla de cocina `/admin/kds` arrojaba error rojo `[GET] "/api/admin/kds/orders": 403 Forbidden` y realizaba llamadas infinitas cada 15 segundos.
4. **Sesiones Zombi**: Pinia `localStorage` mostraba sesión activa (*"jafethworren@gmail.com - Acceso Total"*), pero el token real de Supabase no estaba activo o no se propagaba al backend.
5. **Duda sobre `auth.users` en Supabase**: Duda sobre si los usuarios realmente existían en PostgreSQL al ver la tabla vacía en la vista general.

El objetivo mandatario fue aislar todo el trabajo en una nueva rama (`fix/system-hardening-and-stability`), diagnosticar a fondo cada causa raíz, corregir el código con cero atajos, aplicar múltiples pasadas de verificación y documentar reglas preventivas en el Master Plan para que nunca vuelva a ocurrir.

---

## 2. Diagnóstico Técnico y Causa Raíz

### 2.1 Causa Raíz 1: El Portal `<Teleport to="#admin-modal-portal">` no existía en el DOM
- **Diagnóstico:** Los componentes `MaterialModal.vue`, `ProductModal.vue`, `NewOrderModal.vue` y `OrderDetailsModal.vue` usan `<Teleport to="#admin-modal-portal">`.
- **Fallo:** En todo el proyecto, no existía ningún elemento `<div id="admin-modal-portal">`. Vue intentaba montar los componentes en un selector nulo, impidiendo que los modales se mostraran en pantalla.
- **Solución:** Inyección del contenedor portal en `app/layouts/admin.vue` como:
  ```html
  <div id="admin-modal-portal" class="fixed inset-0 z-[100] pointer-events-none empty:hidden"></div>
  ```
  Y fallback idéntico en `app/app.vue` para vistas sin layout administrativo.

### 2.2 Causa Raíz 2: Bucle Circular de RLS y `serverSupabaseClient` en Guards de Servidor
- **Diagnóstico:** `server/utils/require-admin.ts` utilizaba `serverSupabaseClient(event)` para consultar `public.profiles`.
- **Fallo:** La tabla `profiles` tiene RLS activado con política `USING (public.is_admin())`. A su vez, `is_admin()` consulta `profiles`. Si el token del usuario en SSR estaba expirado, faltante o en desincronización, la consulta fallaba o retornaba fila vacía, arrojando `403 FORBIDDEN (PROFILE_NOT_FOUND)`.
- **Impacto en `/api/raw-materials`:** Dicho endpoint también utilizaba `serverSupabaseClient`. Sin contexto de admin reconocido bajo RLS, PostgreSQL devolvía una lista vacía `[]`, provocando que el front mostrara "Sin insumos registrados".
- **Solución:** 
  1. `requireAdmin(event)` ahora utiliza `serverSupabaseServiceRole(event)` (con fallback graceful) para validar `is_admin === true` en PostgreSQL una vez que el JWT fue verificado de forma segura por `requireUser(event)`.
  2. `/api/raw-materials/index.get.ts` consulta las materias primas con `serverSupabaseServiceRole(event)` garantizando que el usuario admin reciba los 20 insumos registrados.

### 2.3 Causa Raíz 3: Polling Ciego en KDS ante 401/403
- **Diagnóstico:** Al recibir 403 Forbidden, `fetchKdsOrders()` en `app/pages/admin/kds.vue` solo mostraba un mensaje, pero el `setInterval(15000)` seguía ejecutándose indefinidamente.
- **Solución:** Detección explícita de `statusCode === 401 || statusCode === 403`, cancelación inmediata de `pollTimer` (`clearInterval`) y renderizado de un botón directo de *"Iniciar Sesión"* en el banner para recuperar el acceso.

### 2.4 Causa Raíz 4: Persistencia Desincronizada en Pinia Auth Store (Sesión Zombi)
- **Diagnóstico:** El store `useAuthStore()` persistía el perfil en `localStorage`. Si el token expiraba, el usuario visualmente parecía tener "Acceso Total", pero las llamadas a `/api/*` fallaban con 401 o 403.
- **Solución:**
  1. Implementación de `clearSession()` en `app/stores/auth.ts`.
  2. Suscripción a `supabase.auth.onAuthStateChange` para purgar el store si el evento es `SIGNED_OUT`.
  3. En `admin-only.ts` middleware, purga forzada del store si `useSupabaseUser()` es nulo y redirección automática a `/login`.

### 2.5 Aclaración sobre `auth.users` en Supabase Studio
- Se verificó y demostró que en Supabase Studio la tabla `auth.users` pertenece al schema interno `auth` y **no** se muestra en el explorador general de tablas públicas (*Table Editor -> public*).
- Los usuarios residen en la pestaña lateral izquierda: **Authentication -> Users**.
- Ambos usuarios del proyecto existen correctamente en PostgreSQL:
  - `jafethworren@gmail.com` (UUID `e4e4d5ae-6663-4903-8ba9-0f04c7d0d0f4`, `is_admin: true`).
  - `jynga@ankasafi.com` (UUID `6feae6db-8373-455b-9b4f-801fcad37e94`, `is_admin: false`).

---

## 3. Matriz de Cambios por Archivo

| Archivo | Tipo | Descripción de la Modificación |
|---|:---:|---|
| `app/layouts/admin.vue` | [MODIFY] | Inyección del contenedor portal `#admin-modal-portal` (`fixed inset-0 z-[100] pointer-events-none empty:hidden`). |
| `app/app.vue` | [MODIFY] | Fallback global de `#admin-modal-portal` y cierre sintáctico estricto del componente `<Toaster />`. |
| `server/utils/require-admin.ts` | [MODIFY] | Uso de `serverSupabaseServiceRole` para consultar `public.profiles`, eliminando ciclo RLS. |
| `server/api/raw-materials/index.get.ts` | [MODIFY] | Uso de `serverSupabaseServiceRole` para devolver siempre el inventario completo a administradores autenticados. |
| `app/stores/auth.ts` | [MODIFY] | Incorporación de `clearSession()`, purga ante token nulo y escucha reactiva de `onAuthStateChange`. |
| `app/middleware/admin-only.ts` | [MODIFY] | Detección de sesión zombi, purga de estado reactivo y redirección a `/login`. |
| `app/pages/admin/kds.vue` | [MODIFY] | Manejo resiliente de errores 401/403, cancelación del intervalo de polling y botón de login. |
| `tests/unit/admin-hardening-stability.test.ts` | [NEW] | 8 pruebas unitarias automatizadas que blindan los portales, guards de servidor, stores y KDS. |
| `docs/03 - Arquitectura & UI/architecture-refactor-plan.md` | [MODIFY] | Incorporación de la **Sección 21** con las 4 Reglas Anti-Regresión (AR-1 a AR-4). |

---

## 4. Matriz de Verificación y Calidad

```bash
# 1. Pruebas Unitarias & Arquitectura (Vitest)
npm run test
# Resultado: 28 test files PASSED, 176 tests PASSED (100%)

# 2. Comprobación Estricta de Tipos (Nuxt Typecheck)
npm run typecheck
# Resultado: 0 errores TypeScript

# 3. Linter & Análisis Estático (ESLint)
npm run lint
# Resultado: 0 errores, 0 advertencias

# 4. Compilación de Producción (Nuxt Build / Nitro)
npm run build
# Resultado: ✨ Build complete! (9.25 MB compilado en .output)
```

---

## 5. Reglas de Prevención para el Futuro (Master Plan)

1. **AR-1 (Portales de Teleport):** Ningún modal debe crearse con `<Teleport to="#id">` sin que `#id` esté respaldado por un test unitario que verifique su existencia en el layout.
2. **AR-2 (Service Role para Autorización Interna):** Nunca consultar `public.profiles` con `serverSupabaseClient` en guards de autorización del servidor; debe usarse `serverSupabaseServiceRole` tras haber validado el JWT con `requireUser`.
3. **AR-3 (Cero Sesiones Zombi):** El middleware de ruta y el auth store deben escuchar activamente el estado de la sesión de Supabase y purgar `localStorage` de inmediato ante desincronizaciones.
4. **AR-4 (Cancelación de Polling):** Cualquier pantalla con temporizadores de fondo debe cancelar su polling al primer 401/403 para no saturar el servidor ni ocultar problemas de autenticación.
