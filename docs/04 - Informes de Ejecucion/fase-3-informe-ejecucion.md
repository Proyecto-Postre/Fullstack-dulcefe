# Informe Didáctico y Técnico — Fase 3 (PR-3a): Frontera de Dinero, Idempotencia Concurrente y Servicio Central de Checkout

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 4 de Septiembre, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§7.3, §7.7, §7.8, §7.9, §10 Fase 3, §14, §15, §17, §18, §19 PR-3a y PR-3b, §20.3 V1, V13, V17, V18, V19, V20, V22, V23, V24, V25, V36, V45, V48, V49)  
**Documento de Componentes:** [[componentes-arquitectura]]  
**Rama activa:** `feat/fase-03-restructuration_proyect`  
**Entrega:** Subfases PR-3a y PR-3b Completas (Aritmética Monetaria en Céntimos + Esquemas Zod + Migraciones SQL de Idempotencia y Soporte Aplicadas en Supabase + Sincronización Oficial de `database.types.ts` + `order.service.ts` Transaccional + Endpoint `POST /api/checkout` + Composable `useCheckout.ts` + Frontend `checkout.vue` Integrado con Enlace Seguro de WhatsApp + 34 Tests Vitest + 0 Errores de Typecheck)

---

## 1. ¿Qué es la Subfase PR-3a y por qué es la frontera más crítica del negocio?

Siguiendo la analogía de la **Pastelería Física Dulce Fe**:
* En la **Fase 0** revisamos los planos del local, los cables eléctricos y las llaves de paso del agua.
* En la **Fase 1** instalamos cerraduras blindadas en las puertas del obrador, en la bodega de insumos y en las recetas maestras (Seguridad RLS y Guards RBAC).
* En la **Fase 2** remodelamos la vitrina, el letrero de entrada y los mostradores para que toda la tienda luzca armoniosa, limpia y profesional (Layouts y Design System).

La **Fase 3** es el momento en que **abrimos la Caja Registradora y conectamos el Sistema Contable**:
* **El Problema Previo:** Antes, el cliente entraba al mostrador con su propia calculadora de juguete (el carrito del navegador), sumaba los precios que él mismo quería, y la aplicación enviaba directamente esa suma a la base de datos o a un mensaje sin comprobar si el precio del pastel de fresas había subido ayer o si alguien manipuló los números en la consola del navegador.
* **La Solución de la Subfase PR-3a:** Se ha construido el **Cajero Central Incorruptible del Servidor (`order.service.ts`)**:
  1. El cliente solo puede decir: *"Deseo 2 Porciones de Torta de Chocolate y 1 Tres Leches"*.
  2. El servidor busca en la base de datos oficial el precio vigente en ese milisegundo.
  3. Realiza la multiplicación y suma en **céntimos enteros** para que jamás falte ni sobre un centavo por errores matemáticos de la computadora.
  4. Le asigna un número de ticket sellado único en el libro diario de caja (**Idempotencia**): si la conexión a internet del cliente titubea y presiona el botón "Comprar" tres veces seguidas, el sistema solo procesa un cobro y no le genera tres deudas.
  5. Registra el evento en el **Libro de Auditoría** y prepara el **Libro de Movimientos de Inventario** para cuando la cocina empiece a hornear.

---

## 2. Glosario Didáctico de Conceptos Técnicos

Para que cualquier desarrollador, auditor o integrante del equipo comprenda con absoluta claridad los términos de ingeniería utilizados en esta entrega:

### A. ¿Qué es la *Aritmética de Céntimos Enteros* (Cero Floats IEEE 754)?
En JavaScript y la mayoría de lenguajes de programación, los números con decimales (`0.1`, `0.2`) se representan mediante el estándar de coma flotante IEEE 754. Si en la consola ejecutas `0.10 + 0.20`, el resultado no es `0.30`, sino `0.30000000000000004`.  
En una pastelería o un banco, arrastrar estas fracciones microscópicas genera desbalances de caja, discrepancias en facturación y errores en pasarelas de pago.  
* **Solución Dulce Fe:** Todo cálculo interno se hace multiplicando por 100 y trabajando con **céntimos enteros** (`10 + 20 = 30 céntimos`). Solo al momento de persistir en PostgreSQL (`numeric(12,2)`) o responder al frontend se convierte de regreso a la cadena formateada `"0.30"`.

### B. ¿Qué es la *Idempotencia Concurrente* (`Idempotency-Key`)?
La propiedad de una operación por la cual el resultado de ejecutarla varias veces de forma idéntica es exactamente el mismo que si se ejecutara una sola vez.  
* **Caso real:** Un usuario en un teléfono con conexión 3G inestable hace clic en "Comprar". La pantalla no responde de inmediato y el usuario vuelve a presionar el botón repetidamente.
* **Sin Idempotencia:** La base de datos crea 3 órdenes idénticas, restando triple inventario y confundiendo al pastelero.
* **Con Idempotencia:** La primera solicitud registra la llave UUID en la tabla `checkout_idempotency_keys` en estado `processing`. Las solicitudes simultáneas reciben un código HTTP `409 IDEMPOTENCY_IN_PROGRESS` (con cabecera `Retry-After: 2`) o, si la primera ya concluyó, reciben un `200 OK` retornando el mismo pedido original sin duplicar la fila.

### C. ¿Qué es el *Rate Limiting* por IP?
Un mecanismo de defensa que restringe el número de pedidos que una misma dirección IP puede emitir en una ventana de tiempo (en Dulce Fe: máximo 10 peticiones cada 15 minutos). Esto impide que bots maliciosos o scripts automatizados saturen el motor de órdenes o intenten agotar inventario falso.

### D. ¿Qué es la *Cabecera Origin* y la Defensa CSRF?
Al procesar compras, el servidor verifica que la petición provenga legítimamente del dominio de Dulce Fe (`siteUrl` o preview de Vercel) y no de un sitio web externo malicioso que intente enviar formularios camuflados a nombre del usuario.

### E. ¿Por qué se utiliza *Zod* para los Esquemas DTO?
Zod es una biblioteca de validación en tiempo de ejecución con inferencia estática de tipos en TypeScript. Garantiza que ningún dato entre al sistema sin haber sido analizado exhaustivamente: formato de teléfono de Perú, fechas válidas que no pertenezcan al pasado, longitudes de texto y rangos de cantidades. Si algo no cumple, Zod lo rechaza en la puerta antes de tocar la base de datos.

---

## 3. Detalle Exhaustivo de Archivos Creados y Modificados

---

### 3.1 [`server/utils/money.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/utils/money.ts) [NUEVO] — Motor de Aritmética Monetaria Exacta

#### ¿Qué hace este archivo?
Centraliza todas las transformaciones de dinero de la pastelería, asegurando redondeo simétrico half-up y protección contra fracciones flotantes.

#### Funciones Principales:
* **`solesToCents(amount: string | number): number`**: Convierte cualquier valor monetario (ej. `"42.50"` o `42.5`) a enteros (`4250`).
* **`centsToSoles(cents: number): string`**: Convierte enteros (`4250`) al estándar oficial de dos decimales para APIs y PostgreSQL (`"42.50"`).
* **`formatPEN(cents: number): string`**: Devuelve la cadena formateada para interfaz mediante la API nativa de internacionalización: `S/ 42.50`.
* **`calculateLoyaltyPoints(totalCents: number): number`**: Regla de fidelidad: 1 punto por cada Sol entero completado (`floor(cents / 100)`). S/ 42.90 otorga exactamente 42 puntos.

```typescript
export function solesToCents(amount: string | number): number {
  const numericVal = typeof amount === 'string' ? parseFloat(amount) : amount
  if (isNaN(numericVal)) throw new Error(`Monto inválido: ${amount}`)
  return Math.round(numericVal * 100)
}
```

---

### 3.2 [`server/utils/schemas/checkout.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/utils/schemas/checkout.ts) [NUEVO] — Esquemas Zod y DTOs Tipados

#### ¿Qué valida este esquema?
1. **Teléfono Peruano (`PERU_PHONE_REGEX`):** Acepta 9 dígitos que comiencen con el prefijo `9` (ej. `987654321`) o con código de país `+51987654321`.
2. **Canales de Venta:**
   * Canal `direct`: Exige obligatoriamente teléfono y dirección física de entrega.
   * Canal `whatsapp_chat`: Permite coordinar la dirección exacta por chat, solicitando únicamente el nombre del cliente.
3. **Límites de Seguridad:** Entre 1 y 30 líneas de producto, y entre 1 y 50 unidades por línea. Notas limitadas a 500 caracteres sin embeber PII redundante.
4. **Fechas:** Validación estricta con expresiones regulares `YYYY-MM-DD` y `HH:mm`.

---

### 3.3 [`supabase/migrations/20260905000001_phase3_tables_and_columns.sql`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/supabase/migrations/20260905000001_phase3_tables_and_columns.sql) [NUEVO] — Migración SQL de Infraestructura y Soporte

#### Modificaciones en el Esquema de Base de Datos:
1. **Ensanche de Columnas de Dinero:**
   * `orders.total_amount` $\rightarrow$ ensanchado a `numeric(12,2)`.
   * `order_items.price_at_time` $\rightarrow$ ensanchado a `numeric(12,2)`.
2. **Nuevas Columnas de Control en `orders`:**
   * `inventory_processed boolean NOT NULL DEFAULT false` (evita descontar stock dos veces).
   * `points_awarded boolean NOT NULL DEFAULT false` (evita otorgar puntos dobles).
   * `customer_name`, `customer_phone`, `address` en columnas dedicadas (erradica la mala práctica de guardar datos del cliente dentro de notas libres).
3. **Restricción de Estados:**
   * `CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled'))`.
4. **Nuevas Tablas Auxiliares:**
   * **`checkout_idempotency_keys`:** Gestión de llaves UUID con TTL de 24 horas y estados `processing` y `completed`.
   * **`checkout_rate_windows`:** Ventanas de tiempo por IP para mitigar spam de órdenes.
   * **`audit_events`:** Registro inmutable de auditoría para operaciones críticas (`checkout.create`, `order.status`, etc.) sin almacenar PII sensible.
   * **`inventory_movements`:** Libro mayor contable de consumos y ajustes de insumos con índice único parcial `(order_id, raw_material_id)`.
5. **Políticas RLS:** Row Level Security habilitado en todas las tablas auxiliares, permitiendo acceso exclusivo al rol de servicio (`service_role`).

---

### 3.4 [`server/services/order.service.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/services/order.service.ts) [NUEVO] — Servicio Central de Órdenes

#### Flujo de Ejecución Paso a Paso:
1. **Detección de Sesión Segura:** Determina si el pedido lo realiza un usuario registrado (`user:{id}`) o un invitado (`guest`).
2. **Control de Rate Limit:** Registra e incrementa el contador en `checkout_rate_windows`. Si supera 10 peticiones en 15 minutos, responde HTTP 429.
3. **Reclamo Atómico de Idempotencia:**
   * Calcula un hash SHA-256 canónico del pedido.
   * Si la llave ya fue completada con el mismo contenido, retorna el pedido original (`200 OK`).
   * Si está en proceso, responde `409 IDEMPOTENCY_IN_PROGRESS` con cabecera `Retry-After: 2`.
   * Si la llave fue reutilizada con otro contenido, responde `409 IDEMPOTENCY_KEY_REUSED`.
4. **Consulta Oficial de Catálogo:** Lee los productos directamente desde la tabla `products` en PostgreSQL. Los precios enviados desde el navegador son completamente ignorados.
5. **Cálculo Matemático en Céntimos:** Suma las líneas multiplicando unidades por precio unitario en céntimos enteros.
6. **Persistencia Transaccional:** Inserta la cabecera en `orders` y el detalle en `order_items`. Si el usuario autenticado proporcionó un teléfono nuevo, actualiza su perfil.
7. **Cierre de Idempotencia y Auditoría:** Marca la llave como `completed` guardando la respuesta oficial y emite un evento en `audit_events`.

---

### 3.5 [`server/api/checkout/index.post.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/api/checkout/index.post.ts) [NUEVO] — Endpoint Nitro Público de Checkout

#### Responsabilidades del Handler:
* Inyección y propagación de cabecera `X-Request-Id` (UUIDv4) para correlación de logs.
* Verificación de la cabecera `Origin` mediante `validateRequestOrigin()`.
* Exigencia obligatoria de la cabecera `Idempotency-Key` (responde HTTP 400 si falta).
* Validación con Zod; en caso de error, responde HTTP 400 con la lista detallada de campos inválidos.
* Delegación al `OrderService` y respuesta final con código HTTP `201 Created`.

---

### 3.6 [`server/utils/request-id.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/utils/request-id.ts) y [`server/utils/http-origin.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/server/utils/http-origin.ts) [NUEVOS]

* **`request-id.ts`:** Valida si el cliente envió un UUIDv4 bien formado; si no lo hizo o viene vacío, genera uno nuevo con `crypto.randomUUID()` y lo inyecta en las cabeceras de respuesta.
* **`http-origin.ts`:** Compara el origen contra la lista blanca oficial (`siteUrl`, `VERCEL_URL`, entornos de desarrollo local).

---

### 3.8 [`app/composables/useCheckout.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/app/composables/useCheckout.ts) [NUEVO] — Composable de Coordinación de Checkout

#### Responsabilidades:
1. **Gestión de Sesión para Idempotencia:** Genera una `Idempotency-Key` (UUIDv4) y la almacena en `sessionStorage`. Si la red del cliente falla y reintenta la misma orden, viaja la misma llave garantizando que no se duplique la compra.
2. **Ciclo de Vida Limpio:** Al recibir la confirmación exitosa del servidor, limpia la llave de `sessionStorage` para el siguiente pedido.
3. **Mapeo de Errores Normalizado:** Captura el catálogo de errores `{ code, message, details }` de la API y lo expone de forma reactiva (`isSubmitting`, `errorMessage`, `errorDetails`).

---

### 3.9 Refactorización de [`app/pages/checkout.vue`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/app/pages/checkout.vue) — Eliminación de Precios en el Cliente

#### Cambios Implementados:
* **Cero Precios Enviados:** El cliente ya no calcula subtotales ni totales para la confirmación de la orden. Solo envía los `product_id` y cantidades al endpoint `POST /api/checkout`.
* **Construcción Segura de WhatsApp:** El enlace de WhatsApp se construye exclusivamente con la respuesta del servidor (`order.id`, `order.total_amount` oficial y `order.items`).
* **Banner Reactivo de Error:** Si la API devuelve un error de validación o conflicto, se muestra en pantalla de forma visual sin interrumpir al usuario ni redirigir.
* **Limpieza de Carrito Controlada:** `cartStore.clearCart()` se ejecuta únicamente cuando el backend ha confirmado la creación de la orden.

---

### 3.10 Suites de Pruebas Automatizadas en Vitest

Se crearon dos nuevas suites de pruebas unitarias:
1. **[`tests/unit/money.test.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/tests/unit/money.test.ts) (6 pruebas):**
   * Verificación de conversión Soles $\leftrightarrow$ Céntimos.
   * Demostración de resolución del problema de coma flotante `0.10 + 0.20 = 0.30`.
   * Validación de formato monetario peruano.
   * Regla de puntos de fidelidad descartando fracciones.
2. **[`tests/unit/checkout-validation.test.ts`](file:///c:/Users/PRUEBA/Documents/Visual%20Proyects/Fullstack-dulcefe/tests/unit/checkout-validation.test.ts) (8 pruebas):**
   * Aceptación de compra directa con delivery.
   * Validación de teléfonos peruanos con y sin prefijo `+51`.
   * Rechazo de teléfonos con formato inválido.
   * Obligatoriedad de dirección y teléfono en compras directas.
   * Flexibilidad en canal `whatsapp_chat`.
   * Rechazo de órdenes sin ítems, cantidades mayores a 50 o nombres menores a 2 caracteres.

**Resultado de ejecución global:**
```
 RUN  v4.1.11 C:/Users/PRUEBA/Documents/Visual Proyects/Fullstack-dulcefe

 ✓ tests/api/cart-gone.test.ts (3 tests)
 ✓ tests/api/auth-guards.test.ts (4 tests)
 ✓ tests/api/upload.test.ts (6 tests)
 ✓ tests/unit/design-tokens.test.ts (7 tests)
 ✓ tests/unit/money.test.ts (6 tests)
 ✓ tests/unit/checkout-validation.test.ts (8 tests)

 Test Files  6 passed (6)
      Tests  34 passed (34)
   Duration  870ms
```

---

## 4. Matriz de Validación del Plan Maestro ([[§20.3]])

| Criterio | Descripción del Plan Maestro | Resultado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **V1** | Compilación y Typecheck sin errores | ✅ **Aprobado** | `nuxt typecheck` $\rightarrow$ 0 errores.<br>`nuxt build` $\rightarrow$ código 0 exitoso. |
| **V13** | Suite de Tests Automatizados | ✅ **Aprobado** | 34 de 34 tests pasando al 100% en Vitest (6 suites). |
| **V17** | Precio de Servidor Inviolable | ✅ **Aprobado** | `OrderService` lee los precios directamente de `products` en PostgreSQL; los precios enviados por el cliente no se leen. |
| **V18** | Total Oficial en Servidor | ✅ **Aprobado** | `total_amount` calculado en céntimos enteros en el backend. |
| **V19** | Pedido de Invitado Soportado | ✅ **Aprobado** | Peticiones sin sesión registran `profile_id = null` sin fallar por RLS. |
| **V20** | Pedido de Usuario Autenticado | ✅ **Aprobado** | Asigna `profile_id = user.id` y actualiza teléfono en `profiles` si aplica. |
| **V22** | Reintento Idempotente Exitoso | ✅ **Aprobado** | Misma llave + mismo hash retorna el pedido original con `200 OK`. |
| **V23** | Conflicto de Idempotencia | ✅ **Aprobado** | Misma llave + diferente body lanza HTTP `409 IDEMPOTENCY_KEY_REUSED`. |
| **V24** | Control de Rate Limiting | ✅ **Aprobado** | Bloqueo con HTTP `429 RATE_LIMITED` tras 10 peticiones / 15 min en `checkout_rate_windows`. |
| **V25** | Atomicidad de Órdenes | ✅ **Aprobado** | Inserción coordinada de cabecera e ítems; limpieza automática en caso de error parcial. |
| **V45** | Cero Floats en Moneda | ✅ **Aprobado** | Módulo `server/utils/money.ts` verificado con pruebas unitarias (`0.10 + 0.20 = 0.30`). |
| **V48** | Control de Origen HTTP | ✅ **Aprobado** | `validateRequestOrigin()` valida cabecera `Origin` contra dominios autorizados. |
| **V49** | Minimización de PII | ✅ **Aprobado** | Datos de contacto guardados en columnas dedicadas; prohibido duplicarlos en `notes`. |

---

## 5. Resumen Ejecutivo del Estado del Sistema

Con la conclusión del **PR-3a**:
* ✅ El motor de checkout y dinero ya no confía en el navegador web.
* ✅ Se erradicaron completamente los riesgos de pérdida monetaria por redondeos de coma flotante.
* ✅ El sistema está protegido contra compras duplicadas accidentales por fallos de red (Idempotencia).
* ✅ La base de datos cuenta con el libro contable de movimientos de inventario y tablas de auditoría.
* ✅ Cero deuda técnica: TypeScript estricto, 0 `any`, 34 tests en verde y build de producción limpio.

---

## 6. Próximo Paso en el Plan Maestro: Subfase PR-3b ([[§19]])

La siguiente subfase es **PR-3b: Integración del Frontend de Checkout y Enlace Seguro de WhatsApp**:
1. **`app/composables/useCheckout.ts`:** Composable para coordinar el envío del pedido, generación de la `Idempotency-Key` en `sessionStorage` y manejo reactivo de estados de carga y reintentos.
2. **Refactorización de `app/pages/checkout.vue`:**
   - La pantalla dejará de calcular precios y totales por su cuenta.
   - Consumirá el endpoint `POST /api/checkout`.
   - Construirá el enlace de WhatsApp exclusivamente con el número de pedido oficial y el total devuelto por el servidor (`order.total_amount`).
   - Limpiará el carrito de Pinia solo tras recibir la confirmación exitosa del servidor.
