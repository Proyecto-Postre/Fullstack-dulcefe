# Informe Didáctico y Técnico — Fase 3 (PR-3a): Frontera de Dinero, Idempotencia Concurrente y Servicio Central de Checkout

**Estado:** ✅ Completado, Verificado y Certificado con 0 Errores  
**Fecha:** 4 de Septiembre, 2026  
**Documento de referencia:** [[architecture-refactor-plan]] (§7.3, §7.7, §7.8, §7.9, §10 Fase 3, §14.1, §15, §17, §18, §19 PR-3a, §20.3 V1, V13, V17, V18, V19, V20, V22, V23, V24, V25, V45, V48, V49)  
**Rama activa:** `feat/fase-03-restructuration_proyect`  
**Entrega:** Subfase PR-3a (Aritmética Monetaria en Céntimos + Esquemas Zod + Migraciones SQL de Idempotencia y Soporte en Supabase + Sincronización Oficial de `database.types.ts` + `order.service.ts` Transaccional + Endpoint `POST /api/checkout` + Tests Unitarios en Vitest)

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

## 3. Detalle Exhaustivo de Archivos Creados y Modificados en PR-3a

### 3.1 [`server/utils/money.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/utils/money.ts) [NUEVO] — Motor de Aritmética Monetaria Exacta
Centraliza todas las transformaciones de dinero de la pastelería, asegurando redondeo simétrico half-up y protección contra fracciones flotantes.
* `solesToCents(amount)`: Convierte valores monetarios a enteros en céntimos (`"42.50"` $\rightarrow$ `4250`).
* `centsToSoles(cents)`: Convierte enteros al estándar oficial de dos decimales para APIs y PostgreSQL (`4250` $\rightarrow$ `"42.50"`).
* `formatPEN(cents)`: Formato para interfaz con moneda peruana (`S/ 42.50`).
* `calculateLoyaltyPoints(totalCents)`: 1 punto por cada Sol entero completado (`floor(cents / 100)`).

### 3.2 [`server/utils/schemas/checkout.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/utils/schemas/checkout.ts) [NUEVO] — Esquemas Zod y DTOs Tipados
Valida canales `direct` vs `whatsapp_chat`, teléfonos válidos de Perú con expresión regular `/^(?:\+51)?9\d{8}$/`, límites de 1 a 30 productos y 1 a 50 unidades por línea, y minimización de datos personales en notas.

### 3.3 [`supabase/migrations/20260905000001_phase3_tables_and_columns.sql`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/supabase/migrations/20260905000001_phase3_tables_and_columns.sql) [NUEVO]
Ensancha columnas a `numeric(12,2)`, añade columnas de control `inventory_processed`, `points_awarded`, `customer_name`, `customer_phone` y `address`, y crea las tablas de apoyo: `checkout_idempotency_keys`, `checkout_rate_windows`, `audit_events` e `inventory_movements`.

### 3.4 [`server/services/order.service.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/services/order.service.ts) [NUEVO] — Servicio Central de Órdenes
Control de rate limit por IP, reclamo atómico de idempotencia con hash SHA-256 canónico, lectura de precios oficiales desde PostgreSQL, inserción atómica de cabecera e ítems, registro en auditoría y cierre de ciclo de vida de idempotencia.

### 3.5 [`server/api/checkout/index.post.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/server/api/checkout/index.post.ts) [NUEVO] — Endpoint Público de Checkout
Valida origen HTTP, exige cabecera obligatoria `Idempotency-Key`, inyecta `X-Request-Id` y delega la ejecución al `OrderService` respondiendo `201 Created`.

### 3.6 [`tests/unit/money.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/money.test.ts) y [`tests/unit/checkout-validation.test.ts`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/tests/unit/checkout-validation.test.ts) [NUEVOS]
14 pruebas unitarias dedicadas a garantizar la precisión matemática monetaria y la estricta validación de los pedidos.

---

## 4. Matriz de Validación del Plan Maestro

| Criterio | Descripción | Resultado |
| :---: | :--- | :---: |
| **V1** | Compilación y Typecheck sin errores | ✅ **Aprobado** |
| **V17** | Precios leídos de PostgreSQL, ignorando precios de cliente | ✅ **Aprobado** |
| **V18** | Total calculado en servidor en céntimos | ✅ **Aprobado** |
| **V19** | Soporte de compradores invitados (`profile_id = null`) | ✅ **Aprobado** |
| **V20** | Soporte de usuarios autenticados (`profile_id = user.id`) | ✅ **Aprobado** |
| **V22** | Reintento idempotente exitoso retorna `200 OK` con orden original | ✅ **Aprobado** |
| **V23** | Conflicto por clave de idempotencia reutilizada con otro body lanza `409` | ✅ **Aprobado** |
| **V24** | Rate limit de 10 pedidos cada 15 min lanza `429` | ✅ **Aprobado** |
| **V45** | Cero floats en moneda verificado por pruebas unitarias | ✅ **Aprobado** |
| **V48** | Control de Origin HTTP verificado | ✅ **Aprobado** |
| **V49** | Minimización de PII (teléfono y dirección en columnas dedicadas) | ✅ **Aprobado** |
