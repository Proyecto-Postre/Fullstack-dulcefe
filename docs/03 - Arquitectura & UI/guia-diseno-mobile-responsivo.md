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

## 11. Patrón 8: Selectores Personalizados (`CustomSelect`) vs Selectores Nativos y Ajuste de Pantalla Única (Single-Screen Fit)

### 11.1 Prohibición Estricta de `<select>` Nativo
> [!CAUTION]
> **REGLA INMUTABLE DE UI/UX:**  
> Queda terminantemente prohibido utilizar el elemento HTML `<select>` nativo en cualquier vista, componente o modal de Dulce Fe.  
> Todo desplegable debe implementarse obligatoriamente mediante el componente oficial `CustomSelect.vue` (o `UiCustomSelect.vue`).

#### ¿Por qué está prohibido el `<select>` nativo?
1. **Flechas Nativas Desalineadas y Solapadas:** En navegadores de escritorio (Chrome, Edge) y móviles (Safari, Chrome Mobile), el elemento `<select>` nativo dibuja su propio glifo de flecha gris del sistema operativo, colisionando con iconos vectoriales personalizados o quedando desfasado del centro vertical.
2. **Menú Emergente Foráneo y Anti-Estético:** Al desplegar un `<select>` nativo, el sistema operativo abre un menú blanco plano o gris con selección azul eléctrico (`#0066cc`) típica de Windows/Android que rompe la paleta botánica cálida (`#2E4A28`, crema arena `#F4F1E1`, marfil) de Dulce Fe.
3. **Imposibilidad de Truncar y Anidar Información:** El `<select>` nativo no permite mostrar subtítulos secundarios (como costos unitarios o rendimientos calculados en vivo) ni enriquecer visualmente el elemento seleccionado.

#### Especificación Oficial de `CustomSelect.vue`:
```vue
<CustomSelect
  v-model="selectedValue"
  :options="formattedOptions"
  placeholder="Selecciona una opción..."
  size="sm"               <!-- 'sm' (h-9 compact) o 'md' (h-11 estándar) -->
  bgClass="bg-white"       <!-- Fondo adaptado a la tarjeta o modal -->
  :disabled="isLoading"   <!-- Estado deshabilitado consistente -->
/>
```
- **Icono Vectorial Centrado:** Utiliza `Icon name="lucide:chevron-down"`, anclado con `absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 pointer-events-none`.
- **Micro-Animación de Apertura:** Al desplegarse, la flecha gira 180° fluidamente con `transition-transform duration-300 rotate-180`.
- **Menú Popover 100% Opaco (Cero Transparencias):** Menú flotante con fondo estrictamente blanco sólido (`bg-white`), borde definido `border-brand-primary/20`, esquinas redondeadas `rounded-xl`, sombra profunda `shadow-2xl`, capa `z-50`, scrollbar personalizada botánica (`custom-scrollbar`) e indicador de confirmación `lucide:check` en la opción activa. Prohibido el uso de `backdrop-blur` o fondos translúcidos que generen manchones oscuros sobre tarjetas de color.

---

### 11.2 Regla de Ajuste a Una Sola Pantalla ("Single-Screen Fit")

En el taller de repostería y en la administración de productos, los modales y formularios no deben cortarse ni forzar desplazamientos incómodos en ninguna resolución de pantalla (smartphones, tablets, laptops o monitores ultrapanorámicos).

#### Arquitectura del Contenedor Modal:
```html
<div class="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] sm:max-h-[92vh] flex flex-col z-10">
  <!-- 1. Cabecera Fija (Header) -->
  <div class="px-5 py-4 border-b border-brand-primary/10 flex items-center justify-between bg-surface shrink-0">
    ...
  </div>

  <!-- 2. Cuerpo Scrollable Interno (Body) -->
  <div class="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
    ...
  </div>

  <!-- 3. Barra de Acciones Fija (Footer) -->
  <div class="px-5 py-3.5 bg-brand-cream/30 border-t border-brand-primary/10 flex items-center justify-end gap-3 shrink-0">
    ...
  </div>
</div>
```

#### Adaptación Ergonómica en Pantallas Móviles (`< sm`):
1. **Sub-Filas Táctiles en Formularios Densos:**
   - En pantallas grandes (`sm:`), un insumo se agrega en una sola fila horizontal: `[CustomSelect Insumo] [Input Cantidad] [Subtotal S/] [Botón Eliminar]`.
   - En móviles (`< sm`), la fila se desagrega automáticamente: el `CustomSelect` ocupa el 100% de la línea superior para permitir leer nombres largos sin truncamiento extremo, y debajo se ubica la sub-fila con la cantidad táctil, la unidad, el subtotal y el botón de papelera con área táctil cómoda.
2. **Controles de Vitrina Accesibles en Mobile:**
   - En `AdminRecipesTab.vue`, los controles comerciales (estado de vitrina, precio en Soles, stock y botón "Publicar") cuentan con una barra interactiva adaptada para tablets y móviles (`lg:hidden`), garantizando que la edición de precios y stock esté disponible inmediatamente sin requerir una laptop.
3. **Límite de Altura en Listas Largas:**
   - Toda lista o tabla interna dentro de una pestaña debe delimitarse con `max-h-[460px] sm:max-h-[520px] overflow-y-auto custom-scrollbar pr-1` para que una receta con más de 10 insumos no empuje el resto de la página fuera del alcance visual del usuario.

---

### 11.3 Política de Cero Truncamiento de Texto ("No-Truncation Policy")

> [!IMPORTANT]
> **REGLA DE LEGIBILIDAD INTEGRAL:**  
> Queda prohibido aplicar las clases `truncate`, `line-clamp-1` o `text-ellipsis` en nombres de productos, materias primas, tandas maestras, formatos de corte, opciones de selectores y motivos de descargo en modales y paneles operativos.
> 
> **Estándar de Envoltorio Tipográfico:**
> - En botones de selectores y opciones: Utilizar `break-words leading-tight` (o `leading-snug`) junto a `flex-1 min-w-0`.
> - En descripciones y notas: Usar `break-words leading-relaxed` sin recortar el texto con elipsis (`...`).
> - Los textos extensos deben distribuirse ordenadamente en dos o tres líneas con interlineado estético, garantizando que el usuario lea la denominación completa del insumo o postre sin ambigüedad.

---

## 12. Checklist de Aprobación para Nuevas Vistas y Modales

Antes de dar por completada cualquier nueva pantalla o componente responsivo en Dulce Fe, verificar obligatoriamente:

- [ ] ¿Está **100% libre** de elementos `<select>` nativos de HTML y utiliza `CustomSelect.vue`?
- [ ] ¿El popover de `CustomSelect` es **100% blanco sólido (`bg-white`)** sin transparencias ni `backdrop-blur`?
- [ ] ¿Está **100% libre** de truncamiento de texto (`truncate` / `line-clamp`) en selectores, insumos y modales, permitiendo lectura íntegra con `break-words`?
- [ ] ¿Las flechas de los selectores rotan suavemente a 180° y están centradas sin superponerse al texto?
- [ ] ¿Los modales aplican la arquitectura **Single-Screen Fit** (`max-h-[90vh] flex flex-col`, header y footer `shrink-0`, body con `overflow-y-auto custom-scrollbar`)?
- [ ] ¿Las filas compuestas (select + cantidad + subtotal + eliminar) se adaptan con sub-filas táctiles en móvil sin desbordar la pantalla?
- [ ] ¿Los botones principales y áreas interactivas tienen al menos **44 × 44 px** de área de pulsación?
- [ ] ¿El carrusel horizontal utiliza `container.scrollTo()` y **NO** `scrollIntoView()`?
- [ ] ¿Tiene aplicada la clase `.hide-scrollbar` o `.custom-scrollbar` sin mostrar barras grises nativas?
- [ ] ¿Las listas largas paralelas tienen una alternativa de switch segmentado en `< lg`?
- [ ] ¿El modal tiene `z-[9999]` y no es tapado por ningún elemento de navegación?
- [ ] ¿Los campos de teléfono usan `type="tel"` / `inputmode="numeric"` y validación de 9 dígitos para Perú?
- [ ] ¿Se probó visualmente tanto en resolución de escritorio (1280px+) como en resolución móvil (375px - 414px)?
- [ ] ¿La suite de pruebas automatizadas pasa al 100% limpia (`npm test`)?

