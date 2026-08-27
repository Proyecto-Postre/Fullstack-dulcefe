# Arquitectura de Componentes (Vue 3 / Nuxt 3)

Este documento es una guía técnica exhaustiva para cualquier desarrollador que se integre al proyecto **ERP Dulce Fe**. Aquí explicamos los patrones de diseño frontend adoptados, la responsabilidad de cada capa y las convenciones de estado.

---

## 1. Patrón Orquestador (Views / Pages)

En Nuxt 3, la carpeta `app/pages/` determina el enrutamiento. Nuestro objetivo arquitectónico es que las "Pages" no contengan lógica de negocio pesada, sino que actúen como "Orquestadores" o "Controladores de Interfaz".

### `app/pages/admin/index.vue`
Este es el panel principal de administración del sistema. Su responsabilidad se limita estrictamente a:
1. **Gestión de Layout y Navegación**: Renderizar el menú lateral (Sidebar) y mantener el estado de la "pestaña activa" (`activeTab`).
2. **Distribución de Estado**: Mantiene variables globales compartidas entre módulos, por ejemplo `activeProductForRecipe`. Si el usuario hace clic en "Ir a receta" en la pestaña de Productos, este orquestador cambia la vista a `recipes` y le pasa ese ID por medio de `props`.
3. **Carga Condicional (Lazy Loading / v-if)**: Evita renderizar todo el DOM de golpe usando `v-if="activeTab === 'productos'"` para montar solo el componente de módulo que el usuario necesita en ese instante, mejorando el rendimiento.

---

## 2. Componentes de Módulo (Smart Components / Tabs)

Los componentes que viven en `app/components/admin/` son "Componentes Inteligentes" (Smart Components). Poseen su propio estado local (`ref`, `reactive`), hacen llamadas asíncronas a la base de datos (Supabase a través de Nitro) y manejan su propio ciclo de vida y manejo de errores.

### `AdminProductsTab.vue` (Vitrina Comercial)
- **Responsabilidad**: CRUD completo de productos finales que se venden al público (ej. "Torta de Chocolate").
- **Flujo de Datos**: Se conecta a la API `/api/products` para listar, crear, editar y eliminar.
- **Interacción con otros módulos**: Emite eventos (`@edit-recipe`) hacia el Orquestador (`index.vue`) cuando un administrador desea configurar el escandallo de un producto, enviándole los datos del producto seleccionado para que la pestaña de recetas sepa qué cargar.

### `AdminMaterialsTab.vue` (Almacén de Insumos)
- **Responsabilidad**: Gestión del inventario de materia prima (harina, huevos, azúcar, etc).
- **Regla de Negocio Crítica**: Obliga al usuario a definir una **Unidad de Medida** (kg, g, L, ml, und) que será la unidad base para las recetas. Calcula automáticamente el precio base (precio / cantidad) para que el resto del sistema no tenga que hacer esa matemática.
- **Validaciones**: Posee formularios densos para registrar el precio pagado y la cantidad adquirida, bloqueando el botón de envío (`isSubmitting`) para evitar doble inserción.

### `AdminRecipesTab.vue` (Escandallos y Rentabilidad)
- **Responsabilidad**: Es el módulo financiero y el corazón matemático del ERP.
- **Funcionamiento Interno**:
  1. Recibe un producto mediante la propiedad `v-model` (el producto activo).
  2. Consulta la tabla cruzada `recipe_items` haciendo un JOIN (`raw_materials (name, unit, purchase_price...)`) para armar la receta.
  3. Tiene estados reactivos para los "Costos Fijos" (Empaque, Luz, Mano de obra).
  4. Recalcula en tiempo real el "Margen Bruto" usando propiedades computadas (`computed`) cada vez que el precio de un insumo o un costo fijo cambia.
- **Capacidad de Exportación**: Contiene la lógica del lado del cliente para construir URLs dinámicas y descargar reportes vía ExcelJS apuntando a `/api/recipes/export`.

---

## 3. Componentes UI y Herramientas (Dumb Components)

Estos componentes son agnósticos a la lógica de negocio. Son piezas de Lego reutilizables que garantizan la consistencia visual del *Design System* a lo largo de toda la aplicación. Nunca deben hacer fetchings a la API.

### `CustomSelect.vue`
- **¿Por qué se creó?**: La etiqueta `<select>` nativa del HTML (junto con sus `<option>`) es renderizada por el sistema operativo del usuario (Windows, macOS) y no admite estilos CSS avanzados (como bordes gruesos o padding interno personalizado), rompiendo nuestra estética Neo-Brutalista.
- **Estructura Técnica**: 
  - Utiliza un `div` simular un select.
  - Recibe un `Array` de objetos en la propiedad `:options` (`[{ label: 'Gramos', value: 'g' }]`).
  - Emite el evento estándar `@update:modelValue` para ser 100% compatible con la directiva `v-model` de Vue.
  - Implementa el componente nativo `<Transition>` de Vue para animar la aparición del menú desplegable.
  - Contiene directivas personalizadas para cerrarse al hacer clic fuera de él (manejo del DOM global).

---

## Recomendaciones para Nuevos Componentes
Si necesitas crear un nuevo módulo (ej. "Reportes de Ventas"):
1. Crea la interfaz general dentro de `app/components/admin/AdminReportsTab.vue`.
2. Añádelo al menú lateral del orquestador en `app/pages/admin/index.vue`.
3. Si el módulo requiere una tabla o un gráfico que se pueda usar en otros lados, extrae ese fragmento específico como un "Dumb Component" dentro de `app/components/ui/`.
