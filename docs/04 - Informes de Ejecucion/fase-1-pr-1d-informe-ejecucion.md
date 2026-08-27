# Informe Didáctico y Técnico — Fase 1 (PR-1d): Upload Seguro, Tipos DB y Suite Oficial de Tests

**Estado:** ✅ Completado, Verificado y Suite de Tests 100% Verde  
**Fecha:** 26 de Agosto, 2026  
**Documento de referencia:** [`docs/03 - Arquitectura & UI/architecture-refactor-plan.md`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/03%20-%20Arquitectura%20&%20UI/architecture-refactor-plan.md) (§5 S7 y S8, §9.2, §9.3, §10 Tareas 8-11, §14.4, §14.5, §18, §19 PR-1d, §20.1 V1, V10, V11 y V13)  
**Rama activa:** `feat/fase-01-restructuration_proyect`  
**Entrega:** PR-1d (Upload Seguro con Magic Bytes + Suite Automatizada Vitest + Cierre Oficial de Fase 1)

---

## 1. ¿Qué es este PR-1d y por qué es fundamental?

Imagina que la pastelería tiene una ventanilla donde los proveedores entregan cajas con fotos de los pasteles para el menú.

**¿Qué problemas existían antes de este PR?**
1. **Confianza Ciega en la Etiqueta:** Si alguien traía una caja de veneno o un virus informático pero le pegaba una etiqueta que decía *"Foto de Torta.jpg"*, el sistema la aceptaba y la guardaba sin abrirla.
2. **Cajas Gigantes:** Si alguien enviaba una caja del tamaño de un camión (un archivo de 500 MB), el sistema intentaba meterla a la fuerza en la memoria, colapsando el servidor.
3. **Falta de Pruebas Automáticas:** No había una máquina automática que probara los candados de seguridad cada vez que cambiamos una línea de código.

**Con este PR-1d cerramos definitivamente la Fase 1:**
* **Inspección de Firmas Binarias (Magic Bytes):** Abrimos el archivo en memoria y revisamos sus primeros bytes para certificar que sea una imagen real (**JPEG, PNG o WebP**).
* **Límite Estricto de 2 MB:** Si el archivo pesa más de 2 megabytes, se rechaza de inmediato.
* **Suite de Pruebas Automatizadas (Vitest):** Se instaló un robot de pruebas con **13 tests unitarios** que verifican en milisegundos que ningún candado de seguridad se rompa.

---

## 2. Glosario de Términos Técnicos Explicados Paso a Paso

Para que cualquier persona pueda entender a fondo la ingeniería detrás de este PR:

### A. ¿Qué son los *Magic Bytes* (Firmas Binarias)?
Todo archivo digital está formado por ceros y unos agrupados en bytes (números hexadecimales como `FF` o `D8`). Los creadores de los formatos de imagen establecieron que **los primeros bytes de un archivo siempre deben ser una firma única e irrepetible**:
* **JPEG / JPG:** Siempre empieza exactamente con los 3 bytes `FF D8 FF`.
* **PNG:** Siempre empieza exactamente con los 8 bytes `89 50 4E 47 0D 0A 1A 0A` (que en texto ASCII deletrean `.PNG\r\n\x1a\n`).
* **WebP:** Siempre empieza con `52 49 46 46` (letras `RIFF`) y en el byte 8 contiene `57 45 42 50` (letras `WEBP`).

> **¿Por qué es seguro?** Porque aunque un atacante le cambie el nombre a un virus de `virus.exe` a `pastel.jpg`, **los primeros bytes del virus seguirán siendo `4D 5A` ("MZ")**. Nuestro validador lee los bytes reales en memoria y expulsa el archivo al instante.

### B. ¿Qué es *Vitest* y para qué sirve?
**Vitest** es un framework moderno y ultra-rápido para ejecutar **pruebas automatizadas (Unit Tests)** en TypeScript. En lugar de tener que abrir Postman o el navegador y probar manualmente 20 botones cada vez que programamos algo, ejecutamos `npm run test` y Vitest simula peticiones HTTP, verifica respuestas y certifica que los 13 escenarios de seguridad pasen al 100% en menos de 300 milisegundos.

### C. ¿Qué es un *UUIDv4* y por qué previene ataques de Path Traversal?
Un UUID (Universally Unique Identifier) es un código aleatorio de 128 bits como `550e8400-e29b-41d4-a716-446655440000`.  
Si guardamos las imágenes con el nombre que manda el usuario (`foto.jpg`), un atacante podría enviar `../../servidor/clave.txt` (ataque de Path Traversal) o sobrescribir la foto de otro pastel. Al generar una ruta limpia como `products/<uuid>.<ext>`, el nombre del usuario se descarta y la imagen queda con una dirección única e inviolable.

---

## 3. Detalle de Cambios por Archivo (Qué, Por qué y Cómo)

---

### 3.1 [`server/utils/image-validator.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/utils/image-validator.ts) [NUEVO] — Detector Binario Puro

* **¿Qué hace?**  
  Función TypeScript pura (`validateImageBuffer`) que recibe el buffer de bytes del archivo subido e inspecciona sus cabeceras.
* **Código implementado:**
  ```typescript
  export function validateImageBuffer(buffer: Uint8Array | Buffer | null | undefined): ImageValidationResult {
    if (!buffer || buffer.length < 12) {
      return { valid: false, code: 'BUFFER_TOO_SMALL', error: 'Archivo demasiado pequeño o vacío.' }
    }

    // 1. JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return { valid: true, mime: 'image/jpeg', ext: 'jpg' }
    }
    // 2. PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return { valid: true, mime: 'image/png', ext: 'png' }
    }
    // 3. WebP
    if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return { valid: true, mime: 'image/webp', ext: 'webp' }
    }

    return { valid: false, code: 'INVALID_FILE_TYPE', error: 'Formato no permitido. Solo JPEG, PNG y WebP.' }
  }
  ```

---

### 3.2 [`server/api/products/upload.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/products/upload.post.ts) [BLINDAJE] — Endpoint de Upload Seguro

* **Cambios aplicados:**
  1. **Guardián de Administrador:** Exige `await requireAdmin(event)` antes de leer el payload (Cierre S2).
  2. **Tope de 2 MB:** Si `file.data.length > 2 * 1024 * 1024`, responde `400 Bad Request` con código `FILE_TOO_LARGE` (Cierre S8).
  3. **Magic Bytes:** Llama a `validateImageBuffer(file.data)` y rechaza archivos falsificados con `INVALID_FILE_TYPE` (Cierre S7).
  4. **Sanitización:** Guarda en Supabase Storage con ruta `products/${crypto.randomUUID()}.${validation.ext}` (Cierre S11).
  5. **Catálogo de Errores Uniforme (§14.5):** Respuestas estructuradas `{ error: { code, message } }`.

---

### 3.3 Suite Oficial de Tests Automatizados ([`tests/api/`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/api/)) [NUEVO]

Se crearon las 3 suites unitarias exigidas por el Plan Maestro (§18):

1. [`tests/api/upload.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/api/upload.test.ts) (6 tests):
   * ✅ Acepta JPEG auténtico (`FF D8 FF`).
   * ✅ Acepta PNG auténtico (`89 50 4E 47...`).
   * ✅ Acepta WebP auténtico (`RIFF...WEBP`).
   * ❌ Rechaza ejecutables `.exe` (`MZ` header).
   * ❌ Rechaza scripts PHP/HTML camuflados.
   * ❌ Rechaza buffers vacíos o truncados.
2. [`tests/api/auth-guards.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/api/auth-guards.test.ts) (4 tests):
   * ❌ Petición anónima $\rightarrow$ `401 Unauthorized` (`UNAUTHORIZED`).
   * ❌ Cliente logueado no-admin $\rightarrow$ `403 Forbidden` (`FORBIDDEN`).
   * ✅ Administrador con `is_admin = true` $\rightarrow$ Pasa con éxito (`200`).
   * ⚡ Reutilización de contexto $\rightarrow$ No consulta a la base de datos dos veces.
3. [`tests/api/cart-gone.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/api/cart-gone.test.ts) (3 tests):
   * 🚫 `GET /api/cart` $\rightarrow$ `410 Gone` (`CART_API_DISABLED`).
   * 🚫 `POST /api/cart` $\rightarrow$ `410 Gone` (`CART_API_DISABLED`).
   * 🚫 `DELETE /api/cart/:id` $\rightarrow$ `410 Gone` (`CART_API_DISABLED`).

---

### 3.4 Sincronización en Obsidian

* **Ficha Técnica Actualizada:** [`docs/02 - Backend & Datos/endpoints/products/POST-api-products-upload.md`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/02%20-%20Backend%20&%20Datos/endpoints/products/POST-api-products-upload.md) con los límites de 2MB y catálogo de errores.
* **Dashboard Actualizado:** [`docs/Dashboard.md`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/Dashboard.md) enlazando el informe final de Fase 1.

---

## 4. Validación del Checklist Oficial ([§20.1](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/03%20-%20Arquitectura%20&%20UI/architecture-refactor-plan.md#L1115))

| ID | Verificación requerida | Estado | Evidencia |
| :---: | :--- | :---: | :--- |
| **V1** | Build y Typecheck | ✅ **Aprobado** | `npm run build` y `npm run typecheck` completan con exit code 0. |
| **V10** | Upload Seguro | ✅ **Aprobado** | Rechaza no-admins (403), archivos > 2 MB (400) y formatos no permitidos (400); sube JPEG/PNG/WebP $\le$ 2 MB (200). |
| **V11** | Cart 410 Gone | ✅ **Aprobado** | Endpoints de carrito responden `410 Gone` con `CART_API_DISABLED`. |
| **V13** | Tests Automatizados | ✅ **Aprobado** | `npm run test` ejecuta los **13 tests en Vitest con 100% de éxito**. |

---

## 5. 🏆 Resumen del Cierre Total de la FASE 1

Con la entrega de este PR-1d, hemos completado formalmente **todos los objetivos de la Fase 1 del Plan Maestro de Arquitectura**:

* ✅ **PR-0 (Línea Base):** Secretos desacoplados en `runtimeConfig`, variables estandarizadas, `.nvmrc` en Node 22 y migraciones versionadas inicializadas.
* ✅ **PR-1a (Limpieza y Cierre S1):** Eliminación de registro admin falso, borrado de código muerto, desactivación 410 de carrito y corrección de SSR en plugins.
* ✅ **PR-1b (Guards de Servidor):** 12 endpoints blindados con `require-user` (401) y `require-admin` (403) con consulta real a PostgreSQL.
* ✅ **PR-1c (Pinia Store y RLS):** `isAdmin` computado exclusivamente desde la BD, eliminación total de `any`, migración SQL de RLS para las 7 tablas y gobernanza SQL en `supabase/migrations/`.
* ✅ **PR-1d (Upload & Tests):** Inspección de Magic Bytes, límite de 2 MB, UUIDs inmutables y suite automatizada de 13 tests con Vitest.

---

## 6. Próximo Paso en el Plan Maestro: FASE 2 — Shell Visual y Design System ([§10](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/03%20-%20Arquitectura%20&%20UI/architecture-refactor-plan.md#L637), [§19 PR-2](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/03%20-%20Arquitectura%20&%20UI/architecture-refactor-plan.md#L1098))

* **Layouts `default` y `admin`:** Unificación de headers, footers y barras de navegación para evitar layouts duplicados.
* **Tokens de Marca en Tailwind CSS:** Estandarización de la paleta de colores de Dulce Fe, fuentes y radios de borde.
* **Migración de Modales a `app/components/ui/`:** Reorganización de modales y selectores en componentes atómicos y reutilizables.
