# Informe de Ejecución: Rediseño Premium y Responsivo del Seguimiento de Pedidos

**Fecha:** 2026-09-18  
**Autor:** Antigravity AI  
**Rama:** `feat/ui-refinements-auth-checkout-kds`  
**Estado:** Completado (10/10) — Build verificado y Tests limpios  

---

## 1. Contexto y Objetivos
El usuario detectó que la pantalla de seguimiento individual (`/pedido/[token]`):
1. No era accesible de forma recurrente desde el perfil del cliente ("Mis Pedidos").
2. Mostraba la leyenda *"Pedido Registrado: Tu orden fue recibida y confirmada por el sistema"* incluso cuando el cliente había elegido la modalidad **"Coordinar por WhatsApp"**, lo cual era inexacto (la orden por WhatsApp es una solicitud pendiente de confirmación en el chat y no un pedido cerrado).
3. Carecía de un diseño premium y de ergonomía responsiva adaptada a móviles (timeline horizontal rígido, ausencia de fotos de postres, detalle sin precios ni subtotales, botón de WhatsApp poco integrado).
4. Se requirió explícitamente registrar toda la arquitectura, contratos y componentes en la documentación del repositorio para evitar duplicidad o pérdida de conocimiento.

---

## 2. Cambios Implementados

### A. Acceso Personalizado desde "Mis Pedidos"
- **Contrato de Perfil (`app/types/profile.ts`):**  
  Se incorporó el campo `tracking_token?: string | null` en la interfaz `ProfileOrder`.
- **Consulta Supabase (`app/composables/useProfileOrders.ts`):**  
  Se actualizó el `.select(...)` de la tabla `orders` para recuperar `tracking_token`.
- **Historial de Pedidos (`app/components/profile/ProfileOrdersHistory.vue`):**  
  - **Pedidos en curso (`activeOrders`):** Se añadió una barra de acción inferior con un botón destacado `Ver cómo va mi pedido` (icono `lucide:truck` y radar animado) vinculado directamente a `/pedido/[tracking_token]`.
  - **Pedidos anteriores (`pastOrders`):** Se añadió el enlace `Ver seguimiento / detalle` junto al botón `Repetir Pedido`.

---

### B. Detección de Canal y Estado Contextual de WhatsApp
- **Endpoint del Servidor (`server/api/orders/track/[token].get.ts`):**  
  - Se añadieron a la consulta las columnas `address`, `notes`, `payment_method`, `payment_status` y `total_amount`.
  - Detección algorítmica: Si no hay dirección física de entrega o las notas/métodos corresponden a WhatsApp (`isWhatsAppCoordination`), el canal se clasifica como `'whatsapp_chat'`.
  - **Paso 1 del Timeline:**
    - **Por WhatsApp:** Etiqueta `"Solicitud Recibida"`, descripción: *"Tu solicitud fue recibida. Estamos coordinando la confirmación y detalles de tu pedido por WhatsApp."*
    - **Compra Directa:** Etiqueta `"Pedido Registrado"`, descripción: *"Tu orden fue recibida y registrada por nuestro taller para su preparación."*
  - **Ítems Enriquecidos:** Cada ítem ahora retorna `name`, `quantity`, `price_at_time` e `image_url` obtenida de la relación con `products`.
  - **Iconos Operativos:** Cada paso del timeline entrega su icono temático (`lucide:message-square` o `lucide:clipboard-check`, `lucide:chef-hat`, `lucide:package-check`, `lucide:heart-handshake`).

---

### C. Rediseño UI/UX Mobile-First y Desktop (`app/pages/pedido/[token].vue`)
- **Barra Superior de Navegación y Utilidades:**
  - Botón píldora `← Volver a Mis Pedidos` con microinteracción hover.
  - Botón `Compartir` con función nativa `navigator.clipboard` y feedback reactivo con toast (`vue-sonner`).
- **Hero Card (Identidad Dulce Fe Soft Botánico):**
  - Barra de acento con gradiente botánico verde militar (`#4A5D23` a `#2A321B`).
  - Badge dinámico de estado con microanimación `animate-ping` cuando está en curso.
  - Saludo personalizado en `font-playfair font-black text-2xl sm:text-3xl`.
  - Referencia oficial `#short_id` en píldora con botón de 1 toque para copiar.
  - Tarjeta de entrega programada (`delivery_date` y `delivery_time`) en fondo crema suave.
- **Línea de Tiempo Operativa Adaptable:**
  - **Desktop (`sm:`):** Stepper horizontal de 4 columnas con barra de progreso rellenable (`0%` a `100%`) según el avance del taller.
  - **Mobile (`< sm`):** Timeline vertical continua con línea conectora lateral, nodos con iconos de 38px y badge `"En curso"` para el paso activo.
- **Detalle Financiero del Pedido:**
  - Avatares de postres de 56x56px con `object-cover` o fallback botánico (`lucide:cake`).
  - Desglose por línea: nombre, cantidad `xN`, precio unitario `S/ XX.XX` y subtotal.
  - Resumen financiero: Modalidad/Dirección de entrega y Total del Pedido destacado en `font-playfair` e `inter`.
- **Tarjeta de Atención y Coordinación por WhatsApp:**
  - Si el pedido está en `pending` y es por WhatsApp: Guía al usuario a dar el paso final con botón verde `#25D366` de altura táctil completa (44px+) con mensaje prellenado oficial.
  - Si ya está confirmado/avanzado: Canal de soporte directo con el taller.

### D. Arquitectura en Tiempo Real con Server-Sent Events (SSE) vs Polling
- **Eliminación de Polling Periódico:**
  - Se suprimió completamente el temporizador `setInterval(..., 30000)` que consultaba la base de datos de Supabase cada 30 segundos indiscriminadamente.
- **Bus de Eventos en Memoria (`server/utils/order-events.ts`):**
  - Implementación con `EventEmitter` desacoplado de dependencias o proveedores de nube externos, evitando vendor lock-in en caso de migrar fuera de Supabase en el futuro.
  - Función `notifyOrderUpdated({ order_id, tracking_token, status, timestamp })`.
- **Endpoint SSE Nitro (`server/api/orders/track/[token]/stream.get.ts`):**
  - Usa `createEventStream` de H3/Nitro.
  - Transmite evento inicial `connected`.
  - Escucha el canal `order:token:${token}` y envía eventos `order_updated` únicamente cuando el taller o administrador cambia el estado del pedido.
  - Heartbeat `ping` cada 25 segundos para evitar timeouts en proxies móviles o HTTP/2.
  - Limpieza en `eventStream.onClosed` al desconectarse el cliente.
- **Disparo en Servicio de Órdenes (`server/services/order.service.ts`):**
  - En `OrderService.updateOrderStatus`, tras registrar el cambio en la base de datos y en la auditoría inmutable, se notifica al bus SSE automáticamente.
- **Consumo en Frontend (`app/pages/pedido/[token].vue`):**
  - Conexión nativa con `EventSource('/api/orders/track/' + token + '/stream')`.
  - Al recibir `order_updated`, ejecuta `refresh()` y muestra un toast informativo no invasivo al usuario.
  - Desconexión limpia en `onUnmounted`.

### E. Compactación de Pantalla y Blindaje Visual en Móviles
- **Layout de 1 Sola Pantalla:**
  - En Desktop: Grid de 2 columnas (`lg:grid lg:grid-cols-12`) donde la columna izquierda (`col-span-7`) agrupa Hero + Stepper + WhatsApp, y la columna derecha (`col-span-5`) agrupa Detalle de Ítems + Totales.
  - En Móvil: Alturas y paddings compactos (`p-3 sm:p-4`), reduciendo el scroll vertical a su mínima expresión.
- **Blindaje de Imágenes en Móvil:**
  - Se corrigió el error de clases inexistentes (`w-13 h-13`) fijando dimensiones exactas e invariables de 44x44px con `style="width: 44px; height: 44px; min-width: 44px; max-width: 44px;"` y `object-cover`, evitando cualquier desbordamiento visual.

---

## 3. Matriz de Pruebas y Validación de Calidad

| Suite | Comando | Resultado |
|---|---|---|
| Tests Unitarios & Arquitectura | `npm test` | **212 tests aprobados** (31 suites) |
| Validación de Tipos | `npm run typecheck` | **0 errores** de tipado TypeScript |
| Compilación de Producción | `npm run build` | **Exitoso** (`.output/server` 9.35 MB) |
