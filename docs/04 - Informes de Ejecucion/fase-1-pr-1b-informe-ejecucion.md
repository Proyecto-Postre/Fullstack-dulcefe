# Informe Didáctico y Técnico — Fase 1 (PR-1b): Guards de Servidor y Blindaje de APIs

**Estado:** ✅ Completado y Verificado en Build  
**Fecha:** 26 de Agosto, 2026  
**Documento de referencia:** [`docs/architecture-refactor-plan.md`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md) (§5 S2 y S3, §9.3, §10 Fase 1 pasos 4-5, §14.4, §14.5, §19 PR-1b, §20.1 V5, V6 y V7)  
**Rama activa:** `feat/fase-01-restructuration_proyect`  
**Entrega:** PR-1b (Seguridad Backend P0 — Guards `require-user` y `require-admin`)

---

## 1. ¿Qué es este PR-1b y por qué es tan crucial?

Imagina que en la pastelería cualquier persona que entra por la puerta principal (un cliente normal) pudiera caminar hasta la oficina del dueño, abrir el libro de recetas, cambiar el precio de venta de las tortas a 1 sol o ver a cuánto le compramos la harina y el chocolate a los proveedores.

**Eso era exactamente lo que permitía el backend antes de este PR:**
* El middleware anterior solo preguntaba: *“¿Tienes una cuenta iniciada?”*.
* Si la respuesta era *“Sí”*, **el sistema te dejaba crear, editar y borrar productos**, porque nunca se aseguraba de que fueras el administrador.
* Además, las materias primas y las recetas no tenían ninguna puerta con llave.

**Con este PR-1b cerramos las vulnerabilidades críticas S2 y S3**, asegurando que **solo los administradores reales** puedan modificar el catálogo y consultar datos confidenciales de cocina.

---

## 2. Detalle de Cambios por Archivo (Qué, Por qué y Cómo)

---

### 2.1 [`server/utils/require-user.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/utils/require-user.ts) [NUEVO] — Guardián de Sesión Autenticada

* **¿Qué es este archivo?**  
  Una función reutilizable de servidor que verifica si quien hace la petición HTTP tiene una sesión activa en Supabase.
* **¿Por qué se creó?**  
  Para tener una forma estandarizada y segura de validar usuarios en cualquier ruta de Nitro, devolviendo un error formal HTTP `401 Unauthorized` si la petición es anónima.
* **¿Cómo funciona?**  
  1. Revisa si el usuario ya fue autenticado previamente en esta misma petición (usando `event.context.user`) para no repetir trabajo.
  2. Si no, le pide la sesión a `@nuxtjs/supabase` con `serverSupabaseUser(event)`.
  3. Si no hay sesión, interrumpe la petición de inmediato con:
     ```ts
     throw createError({
       statusCode: 401,
       statusMessage: 'Unauthorized',
       data: {
         error: {
           code: 'UNAUTHORIZED',
           message: 'Se requiere iniciar sesión para acceder a este recurso.'
         }
       }
     })
     ```

---

### 2.2 [`server/utils/require-admin.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/utils/require-admin.ts) [NUEVO] — Guardián de Administrador Real

* **¿Qué es este archivo?**  
  El guardián de seguridad más importante de la Fase 1. Comprueba que el usuario que intenta hacer una acción administrativa tenga el permiso `is_admin = true` en la base de datos de PostgreSQL.
* **¿Por qué se creó y por qué no confía en el Token JWT?**  
  * **Cero confianza en metadatos del cliente:** Los datos dentro del token JWT (`user_metadata`) podrían ser manipulados por atacantes (como vimos en el agujero S1).
  * `requireAdmin` **va directamente a la tabla `profiles` en Supabase** y consulta el campo `is_admin`. Si el valor no es `true`, rechaza la petición con HTTP `403 Forbidden`.
* **¿Cómo funciona?**  
  ```ts
  // 1. Primero exige que esté logueado (lanza 401 si es anónimo)
  const user = await requireUser(event)

  // 2. Consulta en la base de datos la tabla profiles
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_admin, role')
    .eq('id', user.id)
    .single()

  // 3. Si no es admin real, le cierra la puerta en la cara (Error 403)
  if (profile.is_admin !== true) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Forbidden',
      data: {
        error: {
          code: 'FORBIDDEN',
          message: 'Se requieren privilegios de administrador para realizar esta acción.'
        }
      }
    })
  }
  ```

---

### 2.3 [`server/middleware/auth.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/middleware/auth.ts) [LIMPIEZA] — Desactivación de Aduana Global Insegura

* **¿Qué problema tenía el middleware anterior?**  
  Era un archivo que intentaba adivinar qué rutas proteger usando expresiones de texto (`url.pathname.startsWith('/api/products')`). Si un programador creaba una ruta como `/api/raw-materials`, el middleware no la protegía porque no coincidía con el texto.
* **¿Cómo se solucionó?**  
  Siguiendo el principio de **Defensa en Profundidad (§9.3)**, se vació este middleware global y la autorización se trasladó **dentro de cada endpoint individual**. Así es imposible que una ruta quede desprotegida por accidente.

---

### 2.4 Blindaje de los 12 Endpoints Administrativos

Se inyectó `await requireAdmin(event)` al inicio de los siguientes handlers de API:

#### A) Catálogo de Productos (Mutaciones protegidas — Cierre S2)
1. [`server/api/products/index.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/products/index.post.ts): Bloquea la creación de postres a no-admins.
2. [`server/api/products/[id].put.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/products/%5Bid%5D.put.ts): Bloquea la modificación de precios, nombres y fotos.
3. [`server/api/products/[id].delete.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/products/%5Bid%5D.delete.ts): Bloquea la eliminación de postres del catálogo.
4. [`server/api/products/upload.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/products/upload.post.ts): Bloquea la subida de imágenes al bucket Storage.

#### B) Materias Primas e Insumos (Protegido 100% — Cierre S3)
5. [`server/api/raw-materials/index.get.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/raw-materials/index.get.ts): Protege los costos confidenciales de insumos de cocina.
6. [`server/api/raw-materials/index.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/raw-materials/index.post.ts): Bloquea el alta de nuevas materias primas.
7. [`server/api/raw-materials/[id].put.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/raw-materials/%5Bid%5D.put.ts): Bloquea la edición de cantidades y precios de compra.
8. [`server/api/raw-materials/[id].delete.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/raw-materials/%5Bid%5D.delete.ts): Bloquea el borrado de insumos del almacén.

#### C) Recetas, Fórmulas de Escandallo y Exportación (Cierre S3)
9. [`server/api/recipes/[productId].get.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/recipes/%5BproductId%5D.get.ts): Oculta las recetas y costos unitarios al público.
10. [`server/api/recipes/index.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/recipes/index.post.ts): Bloquea la asignación de insumos a postres.
11. [`server/api/recipes/[id].delete.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/recipes/%5Bid%5D.delete.ts): Bloquea el retiro de insumos de recetas.
12. [`server/api/recipes/export.get.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/recipes/export.get.ts): Bloquea la exportación de libros de Excel con fórmulas de costo.

---

## 3. Matriz de Clasificación de Seguridad de Toda la API

| Ruta | Método | Nivel de Acceso | Código si no cumple | Comportamiento |
| :--- | :---: | :---: | :---: | :--- |
| `/api/products` | `GET` | 🌐 **Público** | *Permitido* | Cualquier cliente ve el menú de postres. |
| `/api/products/:id` | `GET` | 🌐 **Público** | *Permitido* | Cualquier cliente ve el detalle de un pastel. |
| `/api/products` | `POST` | 🔒 **Admin** | `401` / `403` | Solo administradores crean productos. |
| `/api/products/:id` | `PUT` | 🔒 **Admin** | `401` / `403` | Solo administradores editan productos. |
| `/api/products/:id` | `DELETE` | 🔒 **Admin** | `401` / `403` | Solo administradores borran productos. |
| `/api/products/upload` | `POST` | 🔒 **Admin** | `401` / `403` | Solo administradores suben imágenes. |
| `/api/raw-materials` | `GET` | 🔒 **Admin** | `401` / `403` | Costos de insumos ocultos a clientes. |
| `/api/raw-materials` | `POST` | 🔒 **Admin** | `401` / `403` | Solo administradores crean insumos. |
| `/api/raw-materials/:id` | `PUT` | 🔒 **Admin** | `401` / `403` | Solo administradores editan insumos. |
| `/api/raw-materials/:id` | `DELETE` | 🔒 **Admin** | `401` / `403` | Solo administradores borran insumos. |
| `/api/recipes/:productId`| `GET` | 🔒 **Admin** | `401` / `403` | Recetas y costos ocultos a clientes. |
| `/api/recipes` | `POST` | 🔒 **Admin** | `401` / `403` | Solo administradores modifican recetas. |
| `/api/recipes/:id` | `DELETE` | 🔒 **Admin** | `401` / `403` | Solo administradores quitan ingredientes. |
| `/api/recipes/export` | `GET` | 🔒 **Admin** | `401` / `403` | Solo administradores descargan Excel financiero. |
| `/api/cart/*` | `*` | 🚫 **Desactivado**| `410 Gone` | Carrito activo en cliente (Pinia + Cookies). |

---

## 4. Preguntas Frecuentes y Conceptos Explicados para Principiantes

### P1: ¿Qué diferencia hay entre el Error 401 y el Error 403?
* **Error `401 Unauthorized` (No autenticado):** Significa *"No sé quién eres. Primero inicia sesión con tu usuario y contraseña para que pueda identificarte"*.
* **Error `403 Forbidden` (Prohibido):** Significa *"Ya sé quién eres (eres el cliente Juan Pérez), pero NO tienes permiso de administrador para tocar esta información"*.

### P2: ¿Por qué guardamos el usuario en `event.context`?
Si un endpoint necesita validar al usuario varias veces durante la misma petición, en lugar de conectarse a Supabase 2 o 3 veces en milisegundos, lee el dato guardado en la memoria de la petición (`event.context`). Esto hace que la API responda mucho más rápido y ahorra conexiones a la base de datos.

### P3: ¿Afecta esto a los clientes que entran a comprar postres?
**En absoluto.** El catálogo de postres ([`/api/products`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/products/index.get.ts)) sigue siendo 100% público para que cualquiera pueda navegar y agregar productos a su carrito sin restricciones.

---

## 5. Validación del Checklist Oficial ([§20.1](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md#L1115))

| ID | Verificación requerida | Estado | Evidencia |
| :---: | :--- | :---: | :--- |
| **V5** | Anónimo no muta catálogo ni ve insumos/recetas | ✅ **Aprobado** | Peticiones anónimas a POST/PUT/DELETE o GET raw-materials/recipes devuelven `401 Unauthorized`. |
| **V6** | Cliente logueado no-admin recibe 403 | ✅ **Aprobado** | Peticiones con usuario normal (`is_admin = false`) reciben `403 Forbidden`. |
| **V7** | Admin con `is_admin = true` sí opera | ✅ **Aprobado** | Administradores legítimos pasan el guard y ejecutan la mutación (`200 / 201 OK`). |

---

## 6. Próximo Paso en el Plan Maestro: Fase 1 — PR-1c ([§19](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md#L1096))

Ahora que el backend tiene guardianes estrictos, el siguiente paso es **blindar la base de datos y el estado global de la app**:
1. **Store de Pinia (`app/stores/auth.ts` — Cierre S5):** Asegurar que `isAdmin` en el frontend solo lea `profile.value?.is_admin` de la base de datos y nunca acepte metadatos del JWT.
2. **Políticas de Seguridad RLS en PostgreSQL (Cierre S4 y S10):** Crear la migración SQL versionada con la función segura `public.is_admin()` con `SET search_path = public`, protegiendo las tablas `products`, `raw_materials` y `recipe_items` como segunda línea de defensa en la base de datos.
