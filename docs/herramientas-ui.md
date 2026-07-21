# Stack Tecnológico y Sistema de Diseño

Este documento consolida las herramientas utilizadas para el desarrollo, diseño y estructuración del ERP Dulce Fe. Sirve como referencia arquitectónica y guía de estilos.

## 1. Stack Base (Frameworks)

- **Nuxt 3 (Vue 3)**: Framework principal frontend y backend. Proporciona *Server-Side Rendering*, rutas de API integradas (`/server/api`) y auto-imports de componentes.
- **Supabase**: Backend-as-a-Service (BaaS) actuando como base de datos PostgreSQL. Utilizado para almacenar el catálogo de productos, inventario de insumos (raw_materials) y las recetas (recipe_items).
- **Tailwind CSS**: Framework de utilidades CSS. Define absolutamente toda la estructura visual, colores, espaciados y diseño responsivo del sistema.

## 2. Librería de Íconos

- **Lucide Icons (`lucide`)**: Librería oficial de íconos del sistema. 
  - **Implementación**: Se utiliza a través del módulo `@nuxt/icon`.
  - **Uso en código**: `<Icon name="lucide:nombre-del-icono" class="..." />`
  - **Ejemplos frecuentes**:
    - `lucide:cake-slice` (Productos/Recetas)
    - `lucide:package-open` (Almacén de Insumos)
    - `lucide:calculator` (Escandallos/Costos)
    - `lucide:badge-dollar-sign` (Datos financieros)

## 3. Principios de Diseño (Neo-Brutalismo)

El sistema emplea una estética **Neo-Brutalista Botánica**, elegida para reflejar creatividad (pastelería) pero mantener una solidez corporativa (ERP).

- **Sombras Duras**: Las tarjetas y botones utilizan sombras sólidas sin difuminado, creando un efecto "Sticker" o de capas de papel físico. 
  - *Ejemplo Tailwind*: `shadow-[4px_4px_0px_#2A321B]`
- **Bordes Marcados**: Separación de elementos a través de bordes definidos de 2px de grosor.
- **Paleta de Colores**:
  - **Verde Dulce Fe (Primario)**: `#4A5D23` (Usado en botones primarios, iconos y acentos).
  - **Verde Oscuro (Texto/Contraste)**: `#2A321B` (Usado en títulos principales y bordes de componentes interactivos).
  - **Crema (Fondos)**: `#F4F1E1` (Usado en fondos secundarios para mitigar el blanco puro y dar un tono orgánico).

## 4. Componentes Clave del Design System

- **`CustomSelect.vue`**: Componente de *dropdown* creado desde cero para reemplazar la etiqueta nativa `<select>`. Integra la paleta neo-brutalista, animaciones de transición Vue (`<transition name="fade">`) y customización de colores mediante `props`.
- **Inputs Numéricos**: Todos los inputs de costo y cantidad tienen los *spinners* (flechas de incremento) desactivados globalmente vía CSS para mantener una estética de formulario financiero limpio.

## 5. Herramientas Auxiliares
- **ExcelJS**: Librería ejecutada en el lado del servidor (`server/api/recipes/export.get.ts`) para generar reportes dinámicos `.xlsx` con fórmulas matemáticas embebidas nativamente.
