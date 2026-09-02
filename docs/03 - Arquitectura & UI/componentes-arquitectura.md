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

### `AdminProductsTab.vue` (Vitrina Comercial)
- **Responsabilidad**: CRUD completo de productos finales que se venden al público (ej. "Torta de Chocolate").
- **Flujo de Datos**: Se conecta a la API `/api/products` para listar, crear, editar y eliminar.
- **Interacción con otros módulos**: Emite eventos (`@view-recipe`) hacia el Orquestador (`index.vue`) cuando un administrador desea configurar el escandallo de un producto.

### `AdminMaterialsTab.vue` (Almacén de Insumos)
- **Responsabilidad**: Gestión del inventario de materia prima (harina, huevos, azúcar, etc).
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
