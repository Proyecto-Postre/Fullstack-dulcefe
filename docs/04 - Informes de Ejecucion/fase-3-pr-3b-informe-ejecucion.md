# Informe Didáctico y Técnico — Fase 3 (PR-3b): Frontend Seguro de Checkout y Enlace Inviolable de WhatsApp

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 5 de Septiembre, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§7.7, §7.8, §8.2, §14.1, §19 PR-3b, §20.3 V36)  
**Documento de Componentes:** [[componentes-arquitectura]]  
**Rama activa:** `feat/fase-03-restructuration_proyect`  
**Entrega:** Subfase PR-3b (Composable `useCheckout.ts` + Refactorización de `checkout.vue` + Eliminación Total de Precios en el Cliente + Enlace Seguro de WhatsApp + Limpieza Transaccional de Carrito)

---

## 1. ¿Qué es la Subfase PR-3b y por qué es fundamental para la seguridad comercial?

En la subfase anterior (**PR-3a**), construimos el cajero inteligente e incorruptible en el servidor (`order.service.ts` y `POST /api/checkout`).  
Sin embargo, en la vitrina física de la tienda:
* La pantalla del cliente (`checkout.vue`) todavía hacía cálculos por su cuenta y trataba de armar mensajes de WhatsApp con números sumados en el navegador.
* El cliente creía que él decidía cuánto pagar y persistía datos directamente en Supabase si estaba autenticado.

En esta subfase **PR-3b**:
1. **El navegador se vuelve ciego a los cobros:** La pantalla de checkout ahora solo envía: *"Quiero el producto con ID 5 (cantidad 2) y el producto con ID 9 (cantidad 1)"*. Cero números de precio viajan al servidor.
2. **Generación Continua de Idempotencia:** Si la conexión a internet del teléfono se corta mientras el cliente envía la orden, el navegador guarda la misma `Idempotency-Key` en `sessionStorage` para no duplicar el cobro al reintentar.
3. **WhatsApp Oficial:** El mensaje prellenado de WhatsApp ya no se arma con suposiciones del navegador; se genera **únicamente con el número de pedido oficial y el total exacto devuelto por la API del servidor**.
4. **Vaciado Seguro de Carrito:** La cesta de compras de Pinia se vacía únicamente después de que el servidor ha respondido con el código HTTP 201 Created.

---

## 2. Detalle de Archivos Creados y Modificados en PR-3b

### 2.1 [`app/composables/useCheckout.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/composables/useCheckout.ts) [NUEVO] — Orquestador de Checkout en el Cliente

#### Responsabilidades:
1. **Gestión de la Llave de Idempotencia:**
   * Utiliza `crypto.randomUUID()` para generar una llave UUIDv4 al cargar el flujo.
   * La preserva en `sessionStorage` bajo la clave `dulcefe_idempotency_key`. Si la página se refresca o la red parpadea, la misma llave viaja en la cabecera `Idempotency-Key`.
   * Al recibir la respuesta exitosa del servidor, limpia la llave de `sessionStorage`.
2. **Estados Reactivos Normalizados:**
   * `isSubmitting`: Desactiva el botón de compra para impedir clics múltiples compulsivos.
   * `errorMessage`: Extrae el mensaje amigable del catálogo de errores de la API (`VALIDATION_ERROR`, `RATE_LIMITED`, `CONFLICT`, etc.).
   * `errorDetails`: Muestra los campos específicos que fallaron en caso de validación.
3. **Consumo de la API Oficial:**
   * Llama a `$fetch('/api/checkout', { method: 'POST', body, headers })` sin enviar ningún campo de precio.

---

### 2.2 Refactorización de [`app/pages/checkout.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/pages/checkout.vue) — Eliminación de Mutaciones de Cliente

#### Cambios Clave:
1. **Eliminación del cliente Supabase:** Se eliminó la llamada `supabase.from('orders').insert(...)` y `supabase.from('order_items').insert(...)`.
2. **Separación de Datos de Contacto:** `customer_name`, `customer_phone` y `address` se envían en las propiedades dedicadas del DTO, evitando que se mezclen o dupliquen dentro de `notes`.
3. **Construcción Segura del Enlace de WhatsApp:**
   ```typescript
   const phone = runtimeConfig.public.whatsappNumber || '51998265700'
   const orderIdShort = createdOrder.id.slice(0, 8).toUpperCase()
   const totalOfficial = formatPEN(solesToCents(createdOrder.total_amount))
   // El mensaje usa el orderId y el total confirmado por el backend
   ```
4. **Banner Reactivo de Error:** Si la API devuelve un conflicto o rate limiting, se despliega un banner de alerta en pantalla de forma estética con los colores del Design System sin romper la navegación.

---

## 3. Matriz de Validación del Plan Maestro

| Criterio | Descripción | Resultado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **V1** | Compilación y Typecheck sin errores | ✅ **Aprobado** | `nuxt typecheck` $\rightarrow$ 0 errores. |
| **V36** | WhatsApp con datos oficiales de API | ✅ **Aprobado** | El enlace se genera con `order.id`, `order.total_amount` y lista devuelta por el servidor. |
| **V49** | Minimización de PII | ✅ **Aprobado** | Teléfono y dirección no se concatenan dentro de `notes`. |
| **V1** | Carrito protegido | ✅ **Aprobado** | `cartStore.clearCart()` se ejecuta exclusivamente en el bloque de éxito del handler. |

---

## 4. Próximo Paso en el Plan Maestro: Subfase PR-3c ([[§19]])

La siguiente subfase es **PR-3c: Pedidos Administrativos y Transiciones de Estado en el Servidor**:
1. Endpoint `PATCH /api/admin/orders/:id/status` con verificación de matriz de transiciones y quiebre de insumos.
2. Endpoint `POST /api/admin/orders` para ventas de mostrador sin perfiles fantasma.
3. Desacoplamiento de `AdminOrdersTab.vue` y `NewOrderModal.vue` del cliente directo de Supabase y eliminación de las RPCs desde el navegador.
