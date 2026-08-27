# Informe Didáctico y Técnico — Fase 1 (PR-1a): Limpieza Inmediata, Cierre de Agujero S1 y Desactivación de Carrito

**Estado:** ✅ Completado y Verificado en Build (Exit code 0)  
**Fecha:** 25 de Agosto, 2026  
**Documento de referencia:** [`docs/architecture-refactor-plan.md`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md) (§5 S1, §11 Código Muerto, §14.5, §19 PR-1a, §20.1 V4 y V11)  
**Rama activa:** `feat/fase-01-restructuration_proyect`  
**Entrega:** PR-1a (Seguridad P0, Limpieza de Superficie y Dependencias)

---

## 1. Propósito de la Entrega (PR-1a)

En cualquier sistema que maneja compras, usuarios y dinero, **menos código significa menos errores y menos puertas de entrada para atacantes**.

Antes de empezar a programar nuevas reglas de autorización en el servidor, el paso obligatorio de la Fase 1 es **hacer una limpieza profunda**:
1. **Eliminar agujeros de seguridad graves:** Borrar endpoints antiguos que permitían registrar usuarios con privilegios indebidos.
2. **Eliminar código muerto y duplicado:** Quitar archivos que nadie utilizaba y que solo generaban confusión.
3. **Congelar endpoints obsoletos:** Avisar formalmente que el carrito ahora vive en el cliente (Pinia + Cookies) y ya no en APIs de base de datos no configuradas.
4. **Aligerar el proyecto:** Desinstalar librerías pesadas que ya no se necesitaban (`bcryptjs`, `jsonwebtoken`).

---

## 2. Detalle de Cambios por Archivo (Qué, Por qué y Cómo)

---

### 2.1 `server/api/auth/register.post.ts` [ELIMINADO] — Cierre de Vulnerabilidad S1

* **¿Qué era este archivo?**  
  Un endpoint antiguo creado para registrar usuarios en Supabase desde el servidor.
* **¿Cuál era el peligro crítico (Agujero S1)?**  
  En la línea 27, el archivo tenía programado lo siguiente:
  ```ts
  options: {
    data: {
      username: username,
      role: 'ADMIN' // 🚨 PELIGRO: Le otorgaba rol de ADMIN a cualquiera que se registrara
    }
  }
  ```
  Cualquier persona que enviara una petición técnica a `/api/auth/register` recibía una cuenta con etiqueta de Administrador. Aunque la pantalla de login oficial no usaba este archivo, la puerta trasera estaba abierta en internet.
* **¿Cómo se solucionó?**  
  Se eliminó el archivo completamente. La aplicación oficial usa el cliente seguro de `@nuxtjs/supabase` en [`app/pages/login.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/login.vue), donde los usuarios nuevos nacen únicamente como clientes normales y nunca como administradores.

---

### 2.2 `server/api/auth/login.post.ts` [ELIMINADO] — Eliminación de Código Huérfano

* **¿Qué era este archivo?**  
  Un intento previo de hacer login manual desde el backend.
* **¿Por qué se eliminó?**  
  La interfaz de usuario nunca consumía este endpoint. Tener dos caminos distintos de inicio de sesión (uno en el cliente y otro en el servidor) genera código "fantasma" que nadie prueba ni mantiene.
* **¿Cómo se solucionó?**  
  Se eliminó el archivo y la carpeta `server/api/auth/`. El único camino oficial y soportado es Supabase Auth.

---

### 2.3 `app/middleware/admin.ts` [ELIMINADO] — Limpieza de Middleware Duplicado

* **¿Qué problema había?**  
  Existían dos middlewares con nombres casi idénticos:
  1. `app/middleware/admin.ts` (archivo muerto, nadie lo usaba).
  2. [`app/middleware/admin-only.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/middleware/admin-only.ts) (el middleware activo oficial que protege las pantallas de `/admin`).
* **¿Cómo se solucionó?**  
  Se borró el archivo huérfano `admin.ts` para que solo exista una única fuente de verdad: `admin-only.ts`.

---

### 2.4 `server/api/cart/*` [MODIFICADO A `410 GONE`] — Desactivación Formal del Carrito en Servidor

* **¿Qué hacían estos archivos?**  
  Eran 3 endpoints (`index.get.ts`, `index.post.ts`, `[productId].delete.ts`) que intentaban guardar el carrito en unas tablas de base de datos (`carts`, `cart_items`).
* **¿Por qué se modificaron en lugar de borrarlos?**  
  Siguiendo el estándar de la arquitectura web, si una API deja de existir, debe responder con el código HTTP **`410 Gone`** acompañado del mensaje `CART_API_DISABLED`. Esto le indica a cualquier navegador o herramienta que esa función fue retirada a propósito y que el carrito ahora vive en la memoria local del usuario (Pinia + Cookies).
* **¿Cómo quedó el código?**  
  ```ts
  export default defineEventHandler((event) => {
    setResponseStatus(event, 410)
    return {
      error: {
        code: 'CART_API_DISABLED',
        message: 'Cart API is disabled. Cart state is managed on client via Pinia and cookies.'
      }
    }
  })
  ```

---

### 2.5 [`app/plugins/auto-animate.client.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/plugins/auto-animate.client.ts) [RENOMBRADO] — Blindaje de Renderizado

* **¿Qué problema había?**  
  El archivo se llamaba `auto-animate.ts`. Nuxt intentaba ejecutar las animaciones visuales dentro del servidor (donde no hay pantalla ni ratón), lo que podía provocar fallos y advertencias de SSR (Server-Side Rendering).
* **¿Cómo se solucionó?**  
  Se renombró a `auto-animate.client.ts`. En Nuxt, el sufijo `.client.ts` es una instrucción mágica que significa: *"Solo ejecuta este archivo cuando la página ya esté abierta en el navegador del usuario"*.

---

### 2.6 [`package.json`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/package.json) — Limpieza de Dependencias Innecesarias

* **¿Qué se eliminó?**  
  Se desinstalaron:
  * `"bcryptjs"` y `"@types/bcryptjs"` (librería para encriptar contraseñas manualmente).
  * `"jsonwebtoken"` y `"@types/jsonwebtoken"` (librería para crear tokens JWT manuales).
* **¿Por qué se eliminaron?**  
  Como ahora Supabase se encarga de toda la seguridad de contraseñas y tokens de forma nativa, estas librerías eran peso muerto que hacía más lenta la instalación y aumentaba el riesgo de vulnerabilidades externas.

---

## 3. Preguntas Frecuentes y Conceptos Explicados para Principiantes

### P1: ¿Qué es el código HTTP `410 Gone` y por qué no usar `404 Not Found`?
* **`404 Not Found`:** Significa *"Busqué lo que me pediste pero no lo encontré, tal vez escribiste mal la dirección"*.
* **`410 Gone`:** Significa *"Este recurso existía antes, pero fue eliminado permanentemente por decisión de ingeniería y nunca más volverá a estar disponible"*.  
Usar `410` es una buena práctica profesional porque le dice con total claridad a los desarrolladores y al navegador que el carrito ya no se busca en el servidor.

### P2: ¿Cómo sé que la tienda sigue funcionando si borramos archivos de "login" y "registro"?
Porque la tienda **nunca utilizó esos archivos**. En Nuxt 4 con Supabase, el inicio de sesión se realiza mediante el módulo oficial `@nuxtjs/supabase`. Cuando un cliente entra a `login.vue`, el navegador se comunica directamente con el motor de autenticación seguro de Supabase, sin pasar por esos scripts antiguos.

### P3: ¿Por qué tener menos librerías en `package.json` es mejor?
Cada librería que instalas en un proyecto es código escrito por terceros. Al eliminar `bcryptjs` y `jsonwebtoken`:
1. El proyecto pesa menos al descargarse e instalarse.
2. La compilación para producción es más rápida.
3. Se eliminan posibles alertas de seguridad en `npm audit`.

### P4: ¿Se desactivó el carrito de compras para los clientes de la pastelería?
**¡No, en absoluto!** Los clientes pueden seguir navegando, agregando postres al carrito, abriendo el drawer y comprando normalmente.
* **El carrito de la tienda vive en el cliente:** Se gestiona de forma instantánea mediante **Pinia + Cookies** (`app/stores/cart.ts`). Esto permite que funcione a máxima velocidad y que los clientes puedan comprar como **invitados** sin estar obligados a crearse una cuenta.
* **Lo que se desactivó (`server/api/cart/*`):** Eran 3 archivos antiguos del servidor que intentaban guardar carritos en unas tablas SQL (`carts`, `cart_items`) que ni existen en la base de datos. Como la tienda real no los usaba, se les colocó una respuesta `410 Gone` para formalizar que el carrito opera en el cliente.


---

## 4. Matriz Comparativa: Antes vs. Después de PR-1a

| Aspecto | Antes de PR-1a | Después de PR-1a | Beneficio Directo |
| :--- | :--- | :--- | :--- |
| **Registro de Usuarios** | Endpoint `register.post.ts` regalaba rol `ADMIN`. | Endpoint eliminado. Registro exclusivo en Supabase Auth. | **Cero escalamiento de privilegios** falso (Cierre de S1). |
| **Middlewares de Admin** | Dos archivos (`admin.ts` y `admin-only.ts`). | Un solo archivo oficial (`admin-only.ts`). | **Código limpio y sin ambigüedad**. |
| **Endpoints de Carrito** | Consultas rotas a tablas inexistentes. | Respuestas uniformes `410 Gone` (`CART_API_DISABLED`). | **Respuestas HTTP estandarizadas** y seguras. |
| **Animaciones UI** | Ejecución ambigua en Servidor y Cliente. | Plugin exclusivo de cliente (`.client.ts`). | **Cero errores de SSR** durante el build. |
| **Dependencias NPM** | Librerías de contraseñas/JWT en desuso. | `package.json` limpio y sin librerías fantasma. | **Menor peso del bundle** y menor superficie de ataque. |

---

## 5. Verificación y Resultados de Build

Ejecutamos la prueba de compilación completa tras los cambios:
* **Comando:** `npm run build`
* **Resultado:** **Exit code 0 (Compilación Limpia y Exitosa)**.
* **Métricas de salida Nitro:**
  * El peso total empaquetado del servidor se redujo a **8.18 MB** (antes 8.22 MB).
  * Los endpoints de carrito se compilaron como handlers ligeros de 410 (669 bytes).
  * No se registraron advertencias de tipos rotos ni módulos faltantes.

---

## 6. Validación del Checklist Oficial ([§20.1](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md#L1115))

| ID | Verificación requerida | Estado | Evidencia |
| :---: | :--- | :---: | :--- |
| **V4** | S1 muerto (`/api/auth/register`) | ✅ **Aprobado** | Archivo eliminado del disco; las peticiones recibirán `404 Not Found`. |
| **V11** | Carrito responde `410 Gone` | ✅ **Aprobado** | `index.get.ts`, `index.post.ts` y `[productId].delete.ts` devuelven status 410 y `CART_API_DISABLED`. |
| **V12** | Middleware muerto eliminado | ✅ **Aprobado** | `app/middleware/admin.ts` fue borrado; solo existe `admin-only.ts`. |

---

## 7. Próximo Paso: Fase 1 — PR-1b ([§19](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/docs/architecture-refactor-plan.md#L1095))

Con la casa limpia, el siguiente paso es **blindar las mutaciones del backend**:
1. Crear los guardianes de autorización en servidor: `server/utils/require-user.ts` y `server/utils/require-admin.ts`.
2. Conectar `require-admin` a todas las operaciones de administración (crear/editar productos, materias primas y recetas) para que nadie que no sea administrador real pueda alterar el catálogo ni los costos.
3. Vaciar el middleware global `server/middleware/auth.ts` que hoy está incompleto.
