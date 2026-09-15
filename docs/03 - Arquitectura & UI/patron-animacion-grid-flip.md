# Patrón de Diseño UI: Cuadrículas Animadas FLIP de Alto Rendimiento

**Componente SSOT:** [`app/components/ui/AnimatedGrid.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/ui/AnimatedGrid.vue)  
**Dominio:** UI Primitives / Design System  
**Fecha:** 2026-09-14  

---

## 1. Problema Resuelto (Contexto y Diagnóstico)

En interfaces de catálogo, listados de productos y paneles de administración con filtros en tiempo real (búsqueda por texto o selector de categorías), las animaciones tradicionales con `<TransitionGroup>` en CSS Grid presentan 4 fallas graves:

1. **Parpadeo y Salto a (0,0):** La recomendación clásica de Vue (`.list-leave-active { position: absolute; }`) hace que los elementos salientes pierdan las dimensiones de su columna en el grid y salten a las coordenadas `(0, 0)`, montándose encima del primer elemento mientras se desvanecen.
2. **Retraso de Reposicionamiento:** Si los elementos salientes no usan `position: absolute`, ocupan espacio en el grid durante toda la duración de su transición (ej. 250ms). Los elementos supervivientes se quedan congelados y luego "pegan un brinco" tardío.
3. **Destellos de Opacidad (`opacity: 0`):** En búsquedas de texto rápido, cada pulsación de tecla oculta y vuelve a mostrar elementos desde opacidad 0, generando un efecto estroboscópico molesto.
4. **Colisión de `transform`:** Si la tarjeta hija tiene animaciones CSS al pasar el ratón (como `hover:-translate-y-1.5`), el cálculo inline `style="transform: ..."` de Vue FLIP colisiona con el hover, provocando vibraciones o cancelaciones visuales.

---

## 2. La Solución Arquitectónica: `AnimatedGrid.vue`

El componente [`AnimatedGrid.vue`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/ui/AnimatedGrid.vue) resuelve estos 4 problemas mediante:

1. **Salida Inmediata e Invisible (`zero-flicker`):**
   ```css
   .animated-grid-leave-active {
     position: absolute;
     opacity: 0;
     visibility: hidden;
     pointer-events: none;
     transition: opacity 0.05s ease;
   }
   ```
   Al volverse invisible instantáneamente y salir del flujo del grid, el navegador calcula de inmediato la nueva posición de los elementos restantes.

2. **Deslizamiento Orgánico FLIP (GPU 60fps):**
   ```css
   .animated-grid-move {
     transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
     will-change: transform;
   }
   ```
   Las tarjetas se deslizan hacia sus nuevas celdas con una curva de desaceleración natural (`ease-out-quint`).

3. **Entrada Sutil por Escala:**
   ```css
   .animated-grid-enter-active {
     transition: opacity 0.2s ease-out, transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
   }
   .animated-grid-enter-from {
     opacity: 0;
     transform: scale(0.96);
   }
   ```
   Al borrar letras en la búsqueda, los elementos que reaparecen se expanden sutilmente en su lugar sin traslaciones diagonales que desestabilicen el grid.

4. **Aislación de Hover (Envoltorio Neutro):**
   El componente envuelve cada ranura en un contenedor neutro `.animated-grid-item`. Vue FLIP mueve el contenedor exterior, mientras que la tarjeta interior gestiona su propio `hover:-translate-y-1.5` sin colisión alguna.

5. **Accesibilidad (a11y):**
   ```css
   @media (prefers-reduced-motion: reduce) {
     .animated-grid-move,
     .animated-grid-enter-active,
     .animated-grid-leave-active {
       transition: none !important;
       transform: none !important;
     }
   }
   ```

---

## 3. Guía de Uso Rápido

Para utilizar este patrón en cualquier vista o componente del proyecto:

```vue
<script setup lang="ts">
import AnimatedGrid from '~/components/ui/AnimatedGrid.vue'

const items = ref([
  { id: '1', title: 'Torta de Fresa' },
  { id: '2', title: 'Pie de Limón' }
])
</script>

<template>
  <AnimatedGrid
    :items="items"
    grid-class="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7"
  >
    <template #default="{ item }">
      <MyCardComponent :data="item" />
    </template>
  </AnimatedGrid>
</template>
```

### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :---: | :--- |
| `items` | `T[]` (donde `T` tiene `id`) | Requerido | Lista reactiva de elementos a renderizar |
| `gridClass` | `string` | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-7` | Clases de Tailwind para la cuadrícula CSS |
| `itemKey` | `keyof T` | `'id'` | Campo clave único para el seguimiento de elementos en Vue |
