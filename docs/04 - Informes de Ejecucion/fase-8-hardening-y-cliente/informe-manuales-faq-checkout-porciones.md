# INFORME DE EJECUCIÓN: MANUALES, FAQ ATELIER, CHECKOUT FLEXIBLE Y PORCIONES DE PRODUCTOS

> **Fecha:** 2026-10-20  
> **Rama:** `feature/manuales-y-mejoras-cliente`  
> **Estado:** COMPLETADO CON ÉXITO Y VERIFICADO  
> **Suite de Pruebas:** 40/40 suites pasadas, 274/274 tests unitarios e integración al 100%  
> **Linters:** ESLint 0 errores, 0 warnings  
> **Compilación de Producción:** `npm run build` exitoso (código 0)  
> **Restricción de Estilo:** Cero emojis. Iconografía SVG exclusiva con Lucide Icons.

---

## 1. RESUMEN EJECUTIVO

Se completó integralmente el plan de mejoras de experiencia para el cliente y de administración operativa de Dulce Fe, estructurado en seis fases principales:

1. **Reorganización y Creación de Manuales de Usuario:**
   - Reorganización de informes históricos en 9 subcarpetas temáticas (`docs/04 - Informes de Ejecucion/`).
   - Creación de la suite modular de manuales de usuario en `docs/06 - Manuales de Usuario/` (Manuales 01 al 05 y README general).
2. **Sección y Página de Preguntas Frecuentes (FAQ):**
   - Creación del componente `app/components/ui/FaqAccordion.vue` con soporte completo de accesibilidad.
   - Creación de la página pública `app/pages/faq.vue`.
   - Inclusión de sección FAQ en el Home (`app/pages/index.vue`) y enlace permanente en el footer (`app/components/AppFooter.vue`).
3. **Modalidad de Entrega Flexible en Checkout:**
   - Selección entre **Delivery a Domicilio** (costo a coordinar vía WhatsApp según distrito) y **Punto de Encuentro Acordado** (ej. Parroquia / Iglesia o entrega personal, sin costo de delivery).
   - Manejo retrocompatible de dirección en base de datos (`orders.address`) y nuevas columnas opcionales de trazabilidad.
4. **Horarios de Entrega y Regla de 36h-48h de Anticipación:**
   - Regla de corte a las 4:30 PM (16:30): pedidos antes de las 4:30 PM habilitan entrega a partir de +2 días; pedidos posteriores saltan a +3 días.
   - 3 franjas horarias seleccionables: Mañana (08:00 - 10:00), Noche (19:00 - 22:00) y En el día / Previa coordinación por WhatsApp.
   - Casilla de excepción para horarios especiales o fechas anticipadas pre-coordinadas.
   - Aviso informativo visible sobre envíos diurnos con motorizado desde el taller.
5. **Porciones en Productos y Filtros del Menú:**
   - Columna `portions` en `products` vía migración `20261020120000_add_portions_and_delivery_options.sql`.
   - Soporte en administración de catálogo (`ProductModal.vue`) para ingresar porciones sugeridas.
   - Texto sutil con icono `lucide:users` en `CatalogProductCard.vue` (sin etiquetas flotantes para no competir con "Horneado Fresco").
   - Detalle destacado en `ProductDetailModal.vue`.
   - Filtros en el catálogo (`useCatalog.ts`, `CatalogSearchFilter.vue`, `menu.vue`): porciones (1-4, 6-10, 12+) y presupuesto (<S/30, S/30-60, >S/60).
6. **Visualización en Admin y Tracking:**
   - Distinción clara en `OrderDetailsModal.vue` y en `app/pages/pedido/[token].vue` entre punto de encuentro acordado y delivery a domicilio.
7. **Pruebas y Verificación:**
   - Nuevos tests unitarios: `tests/unit/checkout-delivery-mode.test.ts` y `tests/unit/catalog-filters.test.ts`.
   - Verificación de 274 pruebas pasadas y build de producción verificado.

---

## 2. DETALLE DE ARCHIVOS MODIFICADOS Y CREADOS

| Archivo | Tipo | Descripción |
| :--- | :--- | :--- |
| `docs/06 - Manuales de Usuario/*` | Nuevos | 5 manuales modulares de operación y guía general |
| `app/components/ui/FaqAccordion.vue` | Nuevo | Acordeón accesible para preguntas frecuentes |
| `app/pages/faq.vue` | Nuevo | Página dedicada de preguntas frecuentes |
| `app/pages/index.vue` | Modificado | Sección FAQ en portada |
| `app/components/AppFooter.vue` | Modificado | Enlace directo a `/faq` |
| `supabase/migrations/20261020120000_add_portions_and_delivery_options.sql` | Nuevo | Migración SQL para porciones y trazabilidad de entrega |
| `app/types/checkout.ts` | Modificado | Tipos `DeliveryMode`, `DeliverySlot`, `isCustomSchedule` |
| `server/utils/schemas/checkout.ts` | Modificado | Esquema Zod con validación condicional de dirección y franjas |
| `server/services/order.service.ts` | Modificado | Inserción en BD con resolución inteligente de dirección y horario |
| `app/components/ui/CustomDatePicker.vue` | Modificado | Soporte para prop `minDate` |
| `app/components/checkout/CheckoutCustomerForm.vue` | Modificado | Selector de entrega, franjas y aviso de motorizado |
| `app/pages/checkout.vue` | Modificado | Mapeo de estados y envío al servidor |
| `app/utils/whatsapp.ts` | Modificado | Construcción del mensaje para punto de encuentro |
| `app/types/catalog.ts` | Modificado | Soporte de `portions` en interfaces |
| `server/services/catalog.service.ts` | Modificado | Persistencia de `portions` en creación y edición |
| `server/api/products/index.post.ts` | Modificado | Extracción de `portions` en endpoint POST |
| `server/api/products/[id].put.ts` | Modificado | Extracción de `portions` en endpoint PUT |
| `app/components/admin/ProductModal.vue` | Modificado | Input de porciones en modal de producto |
| `app/components/catalog/CatalogProductCard.vue` | Modificado | Texto sutil con icono `lucide:users` |
| `app/components/catalog/ProductDetailModal.vue` | Modificado | Bloque de porciones en características clave |
| `app/composables/useCatalog.ts` | Modificado | Lógica de filtros por porciones y presupuesto |
| `app/components/catalog/CatalogSearchFilter.vue` | Modificado | Controles de filtro secundario sin emojis |
| `app/pages/menu.vue` | Modificado | Conexión de filtros en página de catálogo |
| `app/components/admin/OrderDetailsModal.vue` | Modificado | Distinción visual de punto de encuentro |
| `app/pages/pedido/[token].vue` | Modificado | Visualización de punto de encuentro en tracking |
| `tests/unit/checkout-delivery-mode.test.ts` | Nuevo | Pruebas unitarias de entrega y franjas |
| `tests/unit/catalog-filters.test.ts` | Nuevo | Pruebas unitarias de filtros de catálogo |

---

## 3. VERIFICACIÓN DE CALIDAD

1. **Pruebas Automatizadas (Vitest):**
   - `npm test`: 40 suites de prueba pasadas, 274 pruebas unitarias e integración en verde (tiempo: 3.60s).
2. **Control Estático de Código (ESLint):**
   - `npm run lint`: 0 errores, 0 warnings.
3. **Compilación y Empaquetado (Nuxt/Nitro Build):**
   - `npm run build`: compilación de cliente y servidor completada satisfactoriamente con código de salida 0.
4. **Verificación de Estilo:**
   - 0 emojis en interfaz gráfica y textos. Uso exclusivo de Lucide Icons.
