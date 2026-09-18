# Arquitectura de Componentes y Layouts (Vue 3 / Nuxt 4)

Este documento es una guía técnica exhaustiva para cualquier desarrollador que se integre al proyecto **ERP Dulce Fe**. Aquí explicamos los patrones de diseño frontend adoptados, la responsabilidad de cada capa, el sistema de layouts y las convenciones de estado.

---

## 1. Capa de Cascarón Global (Layouts System)

En Nuxt 4, la carpeta `app/layouts/` define los contenedores estructurales de la aplicación, eliminando la duplicación de headers, footers y drawers en las vistas.

### `app/layouts/default.vue` (Público / Tienda)
- **Propósito:** Aloja la estructura común para los clientes de la pastelería (`/`, `/menu`, `/login`, `/checkout`, `/perfil`).
- **Elementos Integrados:**
  - **Sticky Navbar:** Logotipo de marca con espiga (`lucide:wheat`), tipografía `font-playfair`, navegación activa, botón de carrito reactivo y botón de autenticación dinámico.
  - **CartDrawer Global:** Instanciado una única vez a nivel layout, eliminando su duplicación en cada vista.
  - **Fondo Botánico:** Elementos vectoriales decorativos de hojas en segundo plano.
  - **Footer Institucional:** Mensaje gastronómico, horarios, enlaces rápidos y WhatsApp oficial.

### `app/layouts/admin.vue` (Administración / ERP)
- **Propósito:** Aloja el cascarón de alta densidad para la gestión operativa y financiera de la pastelería (`/admin`).
- **Elementos Integrados:**
  - **Header de Gestión ERP:** Branding `Dulce Fe | ERP`, badge `Costos & Vitrina`, botón "Ver Tienda", datos del admin autenticado y botón de cierre de sesión.
  - **Fondo Botánico ERP:** Vectores de fondo en segundo plano.
  - **Sidebar Drawer Móvil:** Cajón lateral deslizable con acceso a todos los tabs y KDS en celulares.

### `app/layouts/auth.vue` (Autenticación Dedicada)
- **Propósito:** Cascarón inmersivo y enfocado para Login y Registro (`/login`), libre de headers, banners o footers comerciales que distraigan de la conversión.
- **Elementos Integrados:**
  - **Atmósfera Botánica & Iluminación:** Fondo cálido marfil (`#faf7f2`) con dos fuentes difusas de luz ambiental (resplandor ámbar/miel y verde bosque).
  - **Header Flotante:** Píldora de vidrio mate (`bg-white/80 backdrop-blur-md`) con botón "Volver a la tienda" y logotipo con subtítulo artesanal.
  - **Viewport Centrado & Responsivo:** Escala fluidamente desde smartphones hasta pantallas ultrawide (2K/4K) manteniendo equilibrio óptico sin saltos de altura.

---

## 2. Patrón Orquestador (Views / Pages)

En Nuxt 4, la carpeta `app/pages/` determina el enrutamiento. Nuestro objetivo arquitectónico es que las "Pages" no contengan cascarón visual duplicado, sino que actúen como "Orquestadores" o "Controladores de Interfaz".

### `app/pages/admin/index.vue`
Este es el panel principal de administración del sistema. Su responsabilidad se limita estrictamente a:
1. **Gestión de Layout y Navegación**: Usa `layout: 'admin'` y `middleware: 'admin-only'`, renderizando el menú lateral (Sidebar) y manteniendo el estado de la pestaña activa (`currentTab`).
2. **Distribución de Estado**: Mantiene variables globales compartidas entre módulos, por ejemplo `activeProductForRecipe`. Si el usuario hace clic en "Ir a receta" en la pestaña de Productos, este orquestador cambia la vista a `recipes` y le pasa ese objeto por medio de `props`.
3. **Carga Condicional (Lazy Loading / v-if)**: Evita renderizar todo el DOM de golpe usando `v-if="currentTab === 'products'"` para montar solo el componente de módulo que el usuario necesita en ese instante, mejorando el rendimiento.

---

## 3. Componentes de Módulo (Smart Components / Tabs)

Los componentes que viven en `app/components/admin/` son "Componentes Inteligentes" (Smart Components). Poseen su propio estado local (`ref`, `reactive`), hacen llamadas asíncronas a la base de datos (Supabase a través de Nitro) y manejan su propio ciclo de vida y manejo de errores.

### `AdminDashboardTab.vue` (Centro de Comando & Métricas)
- **Responsabilidad**: Vista ejecutiva de KPIs operativos (valor de inventario, productos terminados, insumos registrados y stock crítico).
- **Ingeniería Móvil Responsiva**:
  - Carrusel horizontal continuo en `< sm` con auto-rotación cada 4s y 4 puntos indicadores interactivos.
  - Implementación con `container.scrollTo()` para eliminar completamente los tirones verticales de pantalla.
  - Pausa inteligente por visibilidad mediante `isElementInViewport()`.
  - Control segmentado (switch de pestañas) para alternar entre "Productos por agotarse" e "Insumos bajos", reduciendo la altura vertical en un 50%.
  - Paginación dinámica de 5 en 5 en ambas listas operativas para evitar scroll infinito.

### `AdminOrdersTab.vue` (Tablero Kanban & Gestión de Pedidos)
- **Responsabilidad**: Gestión del ciclo de vida de órdenes en tiempo real con columnas kanban y vista tabular.
- **Acciones Operativas**: Transiciones de estado (`pending` -> `processing` -> `ready` -> `completed` / `cancelled`), quiebre atómico de insumos, verificación de pagos en 1-click y apertura de modales de detalle.

### `AdminProductsTab.vue` (Vitrina Comercial)
- **Responsabilidad**: CRUD completo de productos finales que se venden al público (ej. "Torta de Chocolate").
- **Flujo de Datos**: Se conecta a la API `/api/products` para listar, crear, editar y eliminar.
- **Interacción con otros módulos**: Emite eventos (`@view-recipe`) hacia el Orquestador (`index.vue`) cuando un administrador desea configurar el escandallo de un producto.

### `AdminMaterialsTab.vue` (Almacén de Insumos)
- **Responsabilidad**: Gestión del inventario de materia prima (harina, huevos, azúcar, etc).
- **Búsqueda & Filtro**: Barra de búsqueda integrada en header con contador reactivo y estado vacío con botón de reinicio.
- **Regla de Negocio Crítica**: Obliga al usuario a definir una **Unidad de Medida** (kg, g, L, ml, und) que será la unidad base para las recetas. Calcula automáticamente el precio base (precio / cantidad) para que el resto del sistema no tenga que hacer esa matemática.

### `AdminRecipesTab.vue` (Escandallos y Rentabilidad)
- **Responsabilidad**: Es el módulo financiero y el corazón matemático del ERP.
- **Funcionamiento Interno**:
  1. Recibe un producto mediante la propiedad `v-model` (el producto activo).
  2. Consulta la tabla cruzada `recipe_items` haciendo un JOIN (`raw_materials (name, unit, purchase_price...)`) para armar la receta.
  3. Tiene estados reactivos para los "Costos Fijos" (Empaque, Luz, Mano de obra).
  4. Recalcula en tiempo real el "Margen Bruto" usando propiedades computadas (`computed`) cada vez que el precio de un insumo o un costo fijo cambia.
- **Capacidad de Exportación**: Contiene la lógica del lado del cliente para construir URLs dinámicas y descargar reportes vía ExcelJS apuntando a `/api/recipes/export`.

---

## 4. Componentes Atómicos UI (`app/components/ui/`)

Estos componentes son agnósticos a la lógica de negocio. Son piezas de Lego reutilizables que garantizan la consistencia visual del *Design System* a lo largo de toda la aplicación. Nunca deben hacer fetchings a la API.

### `CustomDatePicker.vue` (`app/components/ui/CustomDatePicker.vue`)
- Selector de fecha emergente con calendario interactivo, bloqueo de fechas pasadas y formateo instantáneo `DD/MM/AAAA`.

### `CustomTimePicker.vue` (`app/components/ui/CustomTimePicker.vue`)
- Selector de hora emergente con columnas para horas y minutos (intervalos de 15 min), con toggle `AM / PM`.

### `CustomSelect.vue` (`app/components/ui/CustomSelect.vue`)
- Dropdown select totalmente personalizado con soporte para cierre al hacer clic afuera, tipado estricto (0 `any`) y animaciones elásticas suaves.

### `AnimatedGrid.vue` (`app/components/ui/AnimatedGrid.vue`)
- **Propósito:** Cuadrícula de elementos genéricos con animación FLIP de alto rendimiento (60fps en GPU), cero parpadeos y deslizamiento suave en tiempo real al filtrar, reordenar o buscar.
- **Características Clave:**
  1. **Cero Parpadeo:** Elementos que dejan de cumplir el filtro se ocultan de inmediato de forma invisible (`visibility: hidden; opacity: 0; position: absolute`), liberando la celda del grid al instante.
  2. **FLIP Orgánico:** Las tarjetas restantes se deslizan con `transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)` hacia sus nuevas coordenadas sin esperas ni saltos bruscos.
  3. **Aislación de Micro-interacciones:** Envoltorio neutro `.animated-grid-item` que previene colisiones entre el `style="transform: ..."` de Vue FLIP y el `hover:-translate-y-1.5` de las tarjetas hijas.
  4. **Accesibilidad Integrada:** Respeta automáticamente `prefers-reduced-motion: reduce`.

---

## 5. Módulo de Catálogo & Checkout (`app/components/catalog/` y `app/components/checkout/`)

### `CatalogSearchFilter.vue`
- Barra de búsqueda de vitrina con debounce y píldoras de categorías dinámicas leídas desde Supabase. Contenedor con `hide-scrollbar` y desplazamiento táctil horizontal suave.

### `CatalogProductCard.vue`
- Tarjeta de postre con precio formateado en moneda peruana, indicador visual de stock disponible, botón táctil de agregar a carrito y apertura de modal con imagen ampliada.

### `CheckoutCustomerForm.vue`
- Formulario de datos de cliente con validación estricta de teléfono celular Perú (9 dígitos, prefijo `+51` con bandera SVG oficial y contador `x/9`).

### `CheckoutPaymentSection.vue`
- Selector de método de pago (Yape, Plin, Efectivo) con logotipos oficiales integrados y cargador seguro de comprobantes (voucher) con validación de imagen.

---

## 6. Módulo de Perfil de Usuario (`app/components/profile/`)

### `ProfileHeader.vue`
- Cabecera de perfil con bienvenida personalizada, avatar generado, badge de rol y saldo de puntos de fidelidad Dulce Fe.

### `ProfileUserCard.vue`
- Formulario reactivo para actualización de datos personales (nombre, teléfono y cambio de contraseña) con validaciones instantáneas.

### `ProfileAddressModal.vue`
- Modal para gestión de libreta de direcciones con selección de distrito de Lima y casilla de dirección predeterminada.

### `CustomerOrderDetailsModal.vue`
- Ficha detallada de pedido para clientes con desglose de ítems, estado del comprobante de pago, dirección de despacho y total liquidado.

---

## 7. Sistema de Modales y Portales (`z-[9999]`)

Todos los modales de la plataforma (`ProductModal`, `MaterialModal`, `OrderDetailsModal`, `NewOrderModal`, `ProfileAddressModal`, `CustomerOrderDetailsModal`) respetan las siguientes normas arquitectónicas:
1. **Elevación Universal:** `z-[9999]` estricto para garantizar que ningún elemento flotante o barra sticky se superponga sobre ellos.
2. **Teleport Controlado:** Envueltos en `<ClientOnly>` y teleportados a `#admin-modal-portal` o `body` para prevenir desajustes de hidratación SSR.
3. **Ergonomía Móvil:** Contenedor interno con `max-h-[85vh]` y scroll interno suave (`custom-scrollbar`) para evitar que el modal desborde la pantalla al desplegarse teclados virtuales en smartphones.

---

## 8. Módulo de Seguimiento de Pedidos (`app/pages/pedido/[token].vue`)

Permite a los clientes (tanto autenticados como invitados) monitorear en tiempo real el ciclo de preparación y despacho de su pedido mediante un token criptográfico HMAC-SHA256 seguro.

### Componentes y Flujo Operativo:
1. **Acceso Bidireccional desde Mis Pedidos:**
   - En `ProfileOrdersHistory.vue`, cada orden en curso cuenta con el botón primario `"Ver cómo va mi pedido"` enlazado a `/pedido/[tracking_token]`.
   - Las órdenes anteriores disponen del enlace secundario `"Ver seguimiento / detalle"`.
   - La vista de seguimiento incluye el botón `"← Volver a Mis Pedidos"` para navegación fluida.
2. **Timeline Adaptativo (Dual Display):**
   - **Móvil (`< sm`):** Stepper vertical continuo con conectores dinámicos, nodos de 38px con iconos representativos y badge animado `"En curso"`.
   - **Desktop (`sm:`):** Stepper horizontal de 4 columnas conectado por una barra de progreso que avanza porcentualmente según el estado del pedido.
3. **Contextualización WhatsApp vs Compra Directa:**
   - Si la orden fue registrada para coordinar por WhatsApp y está en estado `pending`, el paso 1 muestra `"Solicitud Recibida"` en lugar de `"Pedido Registrado"` para evitar asumir falsamente que el pedido ya fue confirmado antes de coordinar en el chat.
   - La tarjeta de soporte inferior adapta su copy a `"¿Aún no coordinas los detalles de tu pedido?"` con botón de acción directa a WhatsApp prellenado con la referencia `#short_id`.
4. **Detalle Enriquecido con Imágenes y Montos:**
   - Muestra miniaturas oficiales de los postres ordenados, precio unitario, desglose por línea, dirección o modalidad de entrega y total financiero en soles.


