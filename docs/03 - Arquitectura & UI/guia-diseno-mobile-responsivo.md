# Guía de Ingeniería y Patrones de Diseño Móvil Responsivo: Dulce Fe

**Autor:** Antigravity & Jafeth  
**Ubicación:** `docs/03 - Arquitectura & UI/guia-diseno-mobile-responsivo.md`  
**Estado:** ✅ ACTIVO / ESTÁNDAR OFICIAL  
**Última Actualización:** 2026-09-15  

---

## 1. Filosofía y Principios de Diseño Móvil en Dulce Fe

El diseño de **Dulce Fe** en dispositivos móviles no es simplemente una adaptación forzada de la versión de escritorio mediante `flex-col`, sino una experiencia pensada ergonómicamente para la mano del usuario:

1. **La Zona del Pulgar (Thumb Zone):** Los controles principales, botones de confirmación, interruptores y carruseles deben estar al alcance cómodo de una mano, con un área táctil mínima de **44 × 44 px** para evitar toques accidentales.
2. **Erradicación del Scroll Infinito Apilado (Visual Chunking):** Mostrar múltiples tarjetas, tablas y listas largas una debajo de otra genera fatiga cognitiva y desorientación. Aplicamos **carruseles horizontales** para métricas y **controles segmentados (tabs)** para alternar listas relacionadas.
3. **Cero Movimientos Involuntarios:** Ninguna acción automática de la interfaz (como la rotación de un carrusel) debe desplazar o jalar la posición vertical del scroll del usuario (`window.scrollY`).
4. **Acabado Visual Limpio (Sin Ruido del Navegador):** Supresión total de barras de desplazamiento grises nativas con flechas, tooltips amarillos por defecto y flechas en inputs numéricos.

---

## 2. Patrón 1: Carrusel Horizontal de Métricas sin Saltos de Pantalla

### Contexto del Problema
En el panel de administración (`AdminDashboardTab.vue`), las 4 métricas operativas (Productos en vitrina, Insumos registrados, Productos por agotarse e Insumos con stock bajo) en escritorio se distribuyen en una cuadrícula de 4 columnas. En móviles, apilar las 4 tarjetas verticalmente consumía más de 350px de altura antes de poder ver cualquier lista de pedidos o alertas.

### Implementación Arquitectónica
Se transforma responsivamente en un carrusel táctil suave en pantallas pequeñas (`< sm`) que se expande a la cuadrícula habitual en escritorio:

```html
<!-- Contenedor: Flex horizontal con snap en móvil / Grid en escritorio -->
<div
  ref="metricsCarouselRef"
  @scroll="onCarouselScroll"
  @touchstart="pauseCarousel"
  @touchend="resumeCarousel"
  @mouseenter="pauseCarousel"
  @mouseleave="resumeCarousel"
  class="relative flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible snap-x snap-mandatory sm:snap-none hide-scrollbar scroll-smooth"
>
  <!-- Cada Tarjeta: ancho completo del contenedor en móvil -->
  <div class="w-full shrink-0 snap-center sm:w-auto sm:shrink bg-white rounded-2xl p-3.5 sm:p-4 border border-[#4A5D23]/10 shadow-soft-sm ...">
    ...
  </div>
</div>
```

### Indicadores de Puntos (Dots) Táctiles
Bajo el carrusel se renderizan 4 indicadores visuales exclusivos para móvil (`flex sm:hidden`). El punto activo se expande a forma de píldora horizontal (`w-5 bg-brand-primary`), mientras que los inactivos se mantienen compactos (`w-1.5 bg-brand-primary/25`):

```html
<div class="flex sm:hidden items-center justify-center gap-1.5 mt-2.5">
  <button
    v-for="i in 4"
    :key="i"
    type="button"
    @click="scrollToMetric(i - 1)"
    :class="[
      'h-1.5 rounded-full transition-all duration-300 cursor-pointer',
      activeMetricIndex === i - 1 ? 'w-5 bg-brand-primary' : 'w-1.5 bg-brand-primary/25 hover:bg-brand-primary/40'
    ]"
    :aria-label="`Ir a métrica ${i}`"
  />
</div>
```

### La Regla de Oro: `container.scrollTo()` vs `scrollIntoView()`

> [!CAUTION]
> **NUNCA usar `Element.scrollIntoView()` para mover carruseles horizontales internos.**  
> Por especificación web, si el contenedor del carrusel está total o parcialmente fuera del viewport (por ejemplo, el usuario hizo scroll hacia abajo para leer una tabla), `scrollIntoView()` forzará al navegador a desplazar verticalmente toda la página hacia arriba, causando un tirón violento y frustrante.

**La Solución Estándar:**
```ts
function scrollToMetric(index: number): void {
  activeMetricIndex.value = index;
  if (metricsCarouselRef.value) {
    const container = metricsCarouselRef.value;
    const cards = container.children;
    if (cards && cards[index]) {
      const firstCard = cards[0] as HTMLElement;
      const targetCard = cards[index] as HTMLElement;
      const baseOffset = firstCard ? firstCard.offsetLeft : 0;
      const targetLeft = targetCard.offsetLeft - baseOffset;
      
      // Desplazamiento horizontal estricto dentro del contenedor interno:
      container.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
    }
  }
}
```

### Pausa Inteligente por Visibilidad (`isElementInViewport`)
Para preservar batería y evitar cálculos de scroll en segundo plano cuando el usuario está interactuando más abajo:

```ts
function isElementInViewport(el: HTMLElement): boolean {
  if (typeof window === "undefined") return false;
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  return rect.bottom > 0 && rect.top < windowHeight;
}

// En el intervalo automático:
carouselInterval = setInterval(() => {
  if (!isCarouselPaused.value && metricsCarouselRef.value) {
    if (isElementInViewport(metricsCarouselRef.value)) {
      const nextIndex = (activeMetricIndex.value + 1) % 4;
      scrollToMetric(nextIndex);
    }
  }
}, 4000);
```

---

## 3. Patrón 2: Control Segmentado (Tabs Táctiles Móviles)

### Contexto del Problema
Cuando una pantalla contiene dos listas informativas paralelas (por ejemplo: _"Productos por agotarse"_ e _"Insumos con stock bajo"_), mostrarlas apiladas en móvil duplica la longitud vertical y obliga al usuario a scrollear extensamente.

### Implementación
En pantallas medianas/grandes (`lg:`), ambas listas se muestran en paralelo mediante `grid grid-cols-1 lg:grid-cols-2`.  
En pantallas móviles (`< lg`), se oculta la grilla simultánea y se activa un **control segmentado** en la parte superior:

```html
<!-- Switch Segmentado (Solo Mobile < lg) -->
<div class="lg:hidden">
  <div class="bg-[#F4F1E1] p-1 rounded-2xl flex border border-[#4A5D23]/15 shadow-2xs">
    <button
      @click="activeAlertTab = 'products'"
      type="button"
      :class="[
        'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
        activeAlertTab === 'products'
          ? 'bg-white text-brand-secondary shadow-soft-sm'
          : 'text-[#4A5D23]/70 hover:text-brand-secondary',
      ]"
    >
      <Icon name="lucide:cake" class="w-4 h-4 text-[#4A5D23]" />
      <span>Por agotarse</span>
      <span v-if="lowStockProducts.length" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        {{ lowStockProducts.length }}
      </span>
    </button>

    <button
      @click="activeAlertTab = 'materials'"
      type="button"
      :class="[
        'flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer',
        activeAlertTab === 'materials'
          ? 'bg-white text-brand-secondary shadow-soft-sm'
          : 'text-[#4A5D23]/70 hover:text-brand-secondary',
      ]"
    >
      <Icon name="lucide:scale" class="w-4 h-4 text-[#4A5D23]" />
      <span>Insumos bajos</span>
      <span v-if="lowStockMaterials.length" class="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        {{ lowStockMaterials.length }}
      </span>
    </button>
  </div>
</div>

<!-- En cada lista: visible si coincide el tab en móvil O siempre en desktop -->
<div :class="[activeAlertTab === 'products' ? 'flex' : 'hidden lg:flex']"> ... </div>
<div :class="[activeAlertTab === 'materials' ? 'flex' : 'hidden lg:flex']"> ... </div>
```

**Resultado:** Reduce la altura de scroll vertical en un **50%**, permitiendo que el usuario alterne instantáneamente entre ambas visiones operativas.

---

## 4. Patrón 3: Navegación Móvil con Sidebar Drawer

### Contexto del Problema
Los menús desplegables tradicionales (dropdowns) flotantes suelen quedar recortados por el viewport del teléfono, requieren precisión quirúrgica para presionar y entorpecen la vista de fondo.

### Implementación Arquitectónica
Tanto la tienda pública (`app/layouts/default.vue`) como el panel administrativo (`app/layouts/admin.vue`) utilizan el patrón **Sidebar Drawer lateral accesible**:

1. **Backdrop Oscurecido con Desenfoque:**  
   `fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity`
2. **Cajón Deslizable:**  
   `fixed inset-y-0 left-0 w-[280px] sm:w-[320px] bg-white z-[9999] shadow-soft-lg flex flex-col justify-between p-6 transform transition-all duration-300 ease-out`
3. **Control de Accesibilidad:**
   - Se cierra al presionar la tecla `Escape`.
   - Se cierra al tocar fuera del panel (sobre el backdrop).
   - Se cierra automáticamente tras hacer clic en cualquier enlace de navegación (`@click="closeDrawer"`).

---

## 5. Patrón 4: Footer Global Compacto y Ergonómico

### Contexto del Problema
Un footer con relleno vertical excesivo (`py-16`) empuja información vital y produce la sensación de una página desproporcionada en pantallas móviles.

### Reglas de Estilo en `AppFooter.vue`:
1. **Relleno Vertical Equilibrado:** `py-8 sm:py-10` (en lugar de `py-16`).
2. **Transición Apilada a Grilla:**
   - Móvil: `flex flex-col gap-6 text-center items-center`
   - Desktop: `md:grid md:grid-cols-4 md:text-left md:items-start`
3. **Formateo de Contacto Telefónico Perú:**  
   Normalizar a bloques legibles de 3 dígitos: `919 457 413` o `+51 919 457 413`, evitando aglomeraciones ininteligibles como `51919457413`.
4. **Botón Interactivo "Subir Arriba":**  
   Permite al usuario volver suavemente a la cabecera mediante `window.scrollTo({ top: 0, behavior: 'smooth' })`.
5. **Erradicación de `title="..."`:**  
   Sustituir atributos de tooltip nativo por estados hover activos (`hover:scale-105 transition-all text-brand-primary`).

---

## 6. Patrón 5: Eliminación Universal de Barras de Scroll Nativas

### El Problema de las Barras Grises con Flechas
En navegadores Android (Chrome), Windows y emuladores móviles, un contenedor con `overflow-x-auto` renderiza por defecto una barra horizontal gris con flechas a los lados, rompiendo la estética limpia y artesanal de la aplicación.

### Regla CSS Canónica (Global y Scoped)
Se debe declarar tanto en `app.vue` (global) como en componentes con carruseles (`AdminDashboardTab.vue`, `CatalogSearchFilter.vue`):

```css
/* Ocultar barra en WebKit (Chrome, Safari, Edge móvil) */
.hide-scrollbar::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

/* Ocultar barra en Firefox e Internet Explorer/Edge */
.hide-scrollbar {
  -ms-overflow-style: none !important;
  scrollbar-width: none !important;
}
```

---

## 7. Patrón 6: Modales en Móviles y Capas Z-Index

### Reglas Críticas para Modales en Pantallas Pequeñas:
1. **Z-Index Estandarizado:** Todos los modales del sistema deben usar `z-[9999]`.
2. **Límite de Altura de Viewport:**  
   `max-h-[85vh] sm:max-h-[90vh] overflow-y-auto custom-scrollbar`  
   Esto asegura que en celulares con teclado virtual abierto o barras de navegación del navegador, el modal no se desborde fuera de los límites de la pantalla.
3. **Portal Limpio:** Los modales se teleportan al contenedor `#admin-modal-portal` o `<body>` envueltos en `<ClientOnly>` para evitar desajustes de hidratación SSR.

---

## 8. Patrón 7: Formularios y Teclados Móviles en Perú

### Entrada Celular Perú (`CheckoutCustomerForm.vue` y `login.vue`)
- **Atributos de Entrada:** `type="tel"`, `inputmode="numeric"`, `maxlength="9"`.
- **Prefijo Oficial con Bandera:** SVG vectorial 3:2 de la bandera del Perú con código `+51`.
- **Validación en Vivo:**
  - Los números celulares peruanos deben tener estrictamente **9 dígitos** y comenzar con el número **9**.
  - Indicador reactivo: Chip ámbar mientras está incompleto (`x/9`) que se transforma en chip verde esmeralda (`Válido 9/9`) al completarse.
- **Desactivación de Flechas en Inputs Numéricos (`app.vue`):**
  ```css
  input[type=number]::-webkit-inner-spin-button, 
  input[type=number]::-webkit-outer-spin-button { 
    -webkit-appearance: none; 
    margin: 0; 
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
  ```

---

## 9. Pruebas en Dispositivos Físicos Reales (`dev:host`)

### Cómo Probar en Teléfonos Móviles en la Misma Red Wi-Fi:
1. Iniciar el servidor con host abierto:
   ```bash
   npm run dev:host
   ```
2. El terminal indicará la IP local (ejemplo: `http://192.168.100.8:3000`).
3. Abrir la URL desde Chrome o Safari en el smartphone conectado a la misma red Wi-Fi.

### Persistencia de Sesión sobre HTTP Local:
En `server/utils/server-supabase.ts`, la configuración de cookies utiliza:
```ts
secure: process.env.NODE_ENV === "production"
```
Esto garantiza que las cookies de sesión **NO** sean rechazadas por el navegador móvil cuando se prueba sobre el protocolo `http://` en una red de área local.

---

## 10. Checklist de Aprobación para Nuevas Vistas Móviles

Antes de dar por completada cualquier nueva pantalla o componente responsivo en Dulce Fe, verificar:

- [ ] ¿Los botones principales y enlaces tienen al menos 44px de área de pulsación?
- [ ] ¿El carrusel horizontal utiliza `container.scrollTo()` y **NO** `scrollIntoView()`?
- [ ] ¿Tiene aplicada la clase `.hide-scrollbar` y no muestra barras grises nativas?
- [ ] ¿Las listas largas paralelas tienen una alternativa de switch segmentado en `< lg`?
- [ ] ¿El modal tiene `z-[9999]` y `max-h-[85vh]` con scroll interno?
- [ ] ¿Los campos de teléfono usan `type="tel"` / `inputmode="numeric"` y validación de 9 dígitos?
- [ ] ¿Se probó en un smartphone real vía `npm run dev:host`?
- [ ] ¿La suite de pruebas automatizadas pasa al 100% (`npm test`)?
