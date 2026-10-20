# Informe de Ejecución: Refinamiento UI, Autenticación Dedicada, Checkout Perú y KDS

**Rama:** `feat/ui-refinements-auth-checkout-kds`  
**Fecha:** 2026-09-15  
**Autor:** Antigravity (Pair Programming con Jafeth)  
**Estado:** ✅ COMPLETADO (30 archivos de prueba, 201 tests passing, 0 lints, 0 typecheck errors, build exitoso)

---

## 1. Resumen Ejecutivo y Objetivos

Durante la sesión de pruebas visuales y funcionales en local y dispositivos móviles reales, se identificaron y resolvieron requerimientos prioritarios de experiencia de usuario, diseño responsive y estabilidad técnica:

1. **Pantalla dedicada para Login y Registro**: El login compartía el header y footer globales de la tienda pública, lo que generaba ruido visual y no correspondía a un flujo de autenticación limpio.
2. **Filtro de categorías y animación en el Catálogo**: Los botones píldora de categorías presentaban cortes horizontales en móvil y la transición al buscar/filtrar productos requería un desplazamiento suave y natural sin parpadeos.
3. **Categorías desde Base de Datos**: Necesidad de migrar las categorías fijas del código a PostgreSQL (`public.categories`), asegurando que si la tabla está vacía, no se rendericen botones vacíos.
4. **Checkout: Error 403 `FORBIDDEN_ORIGIN` y Validación WhatsApp Perú**:
   - Error 403 al enviar el formulario debido a que el servidor de desarrollo corría en el puerto 3002 y `http-origin.ts` solo admitía el puerto 3000 de forma rígida.
   - El número telefónico ingresado era de 8 dígitos; en Perú los números celulares constan estrictamente de 9 dígitos y comienzan con 9.
5. **Navegación KDS Cocina**: El botón de acceso al KDS desde `/admin` abría una pestaña externa en blanco (`target="_blank"`), desarticulando el flujo SPA.
6. **Diseño de Métodos de Pago y Logotipos Oficiales**:
   - Los botones de pago tenían los iconos encima del texto desperdiciando espacio vertical.
   - Se requería integrar los logotipos oficiales de Yape y Plin ubicados en el sistema local.
7. **Búsqueda Dinámica de Insumos y Paginación en Dashboard Admin**:
   - Barra de búsqueda de insumos integrada en el header del almacén con contador reactivo y estado vacío con botón de reinicio.
   - Paginación dinámica de 5 en 5 en las listas de productos por agotarse e insumos críticos para prevenir desbordamientos verticales.
8. **Navegación Móvil Integral (Sidebar Drawer)**:
   - Sustitución de menús móviles dispersos por un cajón lateral deslizable (drawer) unificado con desenfoque de fondo tanto en la tienda pública como en administración.
9. **Sincronización de Rutas y Persistencia en F5**:
   - Corrección del bug donde recargar F5 dentro de `/admin` redirigía erróneamente a `/perfil`.
   - Sincronización bidireccional entre la pestaña activa del panel de administración y la URL (`/admin?tab=...`) sin provocar recargas de página.
10. **Reorganización Ergonómica de Perfil y Footer Global**:
    - Reordenamiento de pestañas en `/perfil` situando "Datos Personales" como primera sección activa por defecto.
    - Soporte de deep linking directo (`/perfil?tab=personal`, `/perfil?tab=direcciones`, `/perfil?tab=pedidos`).
    - Compactación vertical del footer, formateo legible del teléfono de WhatsApp (`919 457 413`) y elevación universal de modales a `z-[9999]`.
11. **Pruebas en Dispositivos Reales y Persistencia de Sesión Local**:
    - Adición del script `npm run dev:host` (`nuxt dev --host 0.0.0.0`) para auditoría visual en smartphones conectados a la red Wi-Fi local.
    - Corrección de la cookie de autenticación de Supabase (`secure: process.env.NODE_ENV === 'production'`) para mantener la sesión activa sobre HTTP en la IP local.
12. **Dashboard Móvil Ergonómico: Carrusel Suave sin Saltos de Pantalla y Tabs de Alertas**:
    - Transformación de las 4 tarjetas de métricas en móvil a un carrusel táctil suave (`snap-x`) con auto-rotación y dots indicadores.
    - Solución definitiva al tirón vertical de pantalla mediante `container.scrollTo()` y validación `isElementInViewport()`.
    - Eliminación de la barra de scroll horizontal nativa ("gris con flechas") mediante reglas `.hide-scrollbar` globales y locales.
    - Control segmentado para alternar entre "Productos por agotarse" e "Insumos bajos", reduciendo la altura vertical móvil en un 50%.

---

## 2. Diagnóstico Técnico y Soluciones Implementadas

### 2.1 Autenticación con Layout Dedicado y Adaptabilidad Fluida (`app/layouts/auth.vue` y `app/pages/login.vue`)

- **Implementación de Layout:** Se creó el layout `app/layouts/auth.vue` libre de headers/footers de tienda. Incluye botón flotante con chevron _"Volver a la tienda"_, fondo botánico con gradiente suave y contenedor centrado.
- **Adaptabilidad Responsiva sin Vacíos Excesivos:**
  - En pantallas anchas (1920x1080 / 2K), el contenedor ya no está restringido a 1024px (`max-w-5xl`), sino que escala fluidamente a `xl:max-w-[1140px]` y `2xl:max-w-[1240px]` con padding enriquecido (`xl:p-10 2xl:p-12`) y tipografía proporcional, eliminando el exceso de espacio vacío circundante.
  - En tablets (≥ 768px), el diseño de dos columnas se activa desde `md:` (evitando que se apile innecesariamente).
- **Equilibrio Óptico y Altura Estable (Login vs. Registro):**
  - Registro cuenta con 4 campos (`Nombre`, `Celular +51`, `Email`, `Contraseña`).
  - Login cuenta con 2 campos (`Email`, `Contraseña`) y un bloque de beneficios Dulce Fe (`Club Dulce Fe & Pedidos`) con `justify-between`, asegurando que la tarjeta no sufra saltos bruscos ni colapsos de altura al alternar entre ambos modos.

### 2.2 Catálogo: Píldoras con Scroll Suave y Transición FLIP (`app/components/catalog/CatalogSearchFilter.vue` y `app/pages/menu.vue`)

- **Corrección de corte:** Se ajustó el contenedor con `overflow-x-auto scroll-smooth justify-start sm:justify-center px-2 py-1` para que las píldoras puedan desplazarse con naturalidad sin truncarse.
- **Animación:** Se agregaron estilos de transición FLIP Vue (`.list-move`, `.list-enter-active`, `.list-leave-active`) para que los productos cambien de posición fluidamente al buscar o filtrar.

### 2.3 Categorías Dinámicas en Base de Datos Supabase

- **Migración SQL:** Se creó `supabase/migrations/20260914000001_create_categories_table.sql` con la tabla `public.categories` (`id`, `name`, `slug`, `icon`, `sort_order`, `is_active`, `created_at`), habilitando RLS con lectura pública para categorías activas.
- **Endpoint API:** Se implementó `server/api/categories/index.get.ts` que retorna las categorías ordenadas por `sort_order`.
- **Regla de Negocio:** `useCatalog.ts` consume el endpoint; si la tabla no tiene registros (`categories.length === 0`), `CatalogSearchFilter.vue` no renderiza píldoras vacías.

### 2.4 Checkout: Whitelist de Origen Multi-puerto y Validación Estricta de Celular Perú

- **Causa Raíz 403:** `server/utils/http-origin.ts` validaba contra `process.env.APP_URL` (puerto 3000 por defecto). Al iniciar Nuxt en el puerto 3002 por ocupación de puertos, las mutaciones POST eran rechazadas con `FORBIDDEN_ORIGIN`.
- **Solución Origen:** Se actualizó la expresión regular para admitir cualquier puerto local en desarrollo (`http://localhost:*`, `http://127.0.0.1:*`) y los entornos de Vercel (`*.vercel.app`). Se añadió suite de pruebas unitarias en `tests/unit/http-origin.test.ts`.
- **Validación Celular:**
  - `CheckoutCustomerForm.vue`: Entrada restringida a números, límite exacto de 9 caracteres, indicador visual de conteo `x/9` y advertencia en vivo si no inicia con 9 o está incompleto.
  - `checkout.vue`: Verificación en el envío y notificación interactiva mediante toast accesible si los datos están incompletos.
  - Test unitario agregado en `tests/unit/checkout-validation.test.ts` asegurando que 8 dígitos sea rechazado.

### 2.5 Navegación SPA Fluida a KDS Cocina

- En `app/pages/admin/index.vue`, se eliminó el atributo `target="_blank"` tanto en la vista móvil como en escritorio.
- El middleware `app/middleware/admin-only.ts` se adaptó para reutilizar `authStore.initAuth()` respetando estrictamente los límites arquitectónicos de importaciones de `useSupabaseClient`.

### 2.6 Optimización de Espacio y Logotipos de Yape y Plin

- **Assets Estáticos:** Se migraron los archivos de logotipos oficiales desde Descargas a `public/images/payments/` (`logo_yape.png` y `logo_plin.png`).
- **Diseño Horizontal:** En `app/components/checkout/CheckoutPaymentSection.vue`, se refactorizó la distribución para que el icono o logotipo se posicione lateralmente junto al nombre y descripción del método, reduciendo la altura ocupada y mejorando la ergonomía táctil en móviles.

### 2.7 Optimización de Animación de Filtro y Eliminación de Parpadeos (Catálogo)

- **Cero Parpadeo en Búsqueda y Filtrado:** Las tarjetas que dejan de coincidir con la búsqueda o filtro se retiran de forma inmediata e invisible (`visibility: hidden; opacity: 0; position: absolute`), permitiendo que las tarjetas supervivientes se deslicen de inmediato a sus nuevas posiciones de cuadrícula con FLIP suave (`transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)`).
- **Sin Saltos a (0,0) ni Retrasos:** Se eliminó la espera de salida y las colisiones en coordenadas (0,0), erradicando por completo el parpadeo de tarjetas y el destello de opacidad cero durante la escritura en la barra de búsqueda.
- **Entrada Suave y Expansiva:** Las tarjetas que vuelven a entrar (al borrar texto o cambiar filtro) entran con un escalado sutil (`scale(0.96) -> 1` en 0.2s) sin traslaciones verticales excesivas que compitan con el cálculo FLIP.
- **Desacoplamiento de Hover y FLIP:** Cada tarjeta está envuelta en `.product-item`, separando el cálculo de posición del hover `hover:-translate-y-1.5`.
- **Categorías Estrictamente Dinámicas desde BD:** Se respetó la regla original de que si la tabla `public.categories` está vacía, no se renderiza ninguna píldora en la interfaz.

### 2.8 Refinamiento Visual y Responsivo de Autenticación (Login & Registro)

- **Atmósfera & Iluminación Ambiental (`app/layouts/auth.vue`):**
  - Se introdujo un fondo cálido marfil artesanal (`#faf7f2`) acompañado de dos halos de luz ambiental desenfocados (resplandor miel/ámbar en la esquina superior izquierda y verde bosque botánico en la esquina inferior derecha), creando profundidad orgánica sin sobrecargar el DOM.
  - Barra superior simplificada con botón de retorno en píldora de vidrio mate (`bg-white/80 backdrop-blur-md`) y logotipo con subtítulo "Pastelería Artesanal" en micro-tipografía oro/marrón.
- **Elevación Estratificada de la Tarjeta (`app/pages/login.vue`):**
  - Contenedor con borde doble de luz perimetral (`ring-1 ring-white/80 inset`, `border-stone-200/80`) y sombra profunda difusa (`shadow-[0_20px_60px_-15px_rgba(45,74,34,0.12)]`).
  - Panel izquierdo de marca en gradiente profundo verde selva (`#1b311f` a `#0c180e`), tarjetas de beneficios con efecto vidrio translúcido y 5 estrellas doradas sólidas vectoriales con brillo cálido.
- **Rediseño de Celda de Teléfono & Código de País (Perú):**
  - Se sustituyeron los emojis y cajas toscas por un prefijo integrado con la bandera peruana vectorial (SVG en proporción oficial 3:2, bandas roja-blanca-roja con micro-borde), código `+51` en tipografía de alto contraste y divisor sutil.
  - Indicador de estado en tiempo real: cambia automáticamente a chip verde esmeralda con icono de verificación (`Válido 9/9`) al completar los 9 dígitos reglamentarios que inician en 9.
- **Campos de Formulario Elevados:**
  - Segmented control superior para alternar entre "Iniciar Sesión" y "Crear Cuenta" con píldora blanca activa y sombras suaves.
  - Inputs con fondo cálido satinado (`bg-stone-50/80`), iconografía contextual que reacciona al foco (`focus-within:text-brand-primary`) y preservación estricta de atributos accesibles (`a11y-forms`).

### 2.9 Búsqueda Dinámica de Insumos y Paginación Operativa de Dashboard (`AdminMaterialsTab.vue` y `AdminDashboardTab.vue`)

- **Buscador de Almacén Integrado en Header:**
  - En `AdminMaterialsTab.vue`, se incorporó una barra de búsqueda en tiempo real dentro del header de la sección de insumos, incluyendo badge con conteo reactivo de coincidencias (`X insumos encontrados`).
  - Estado vacío contextual (`empty state`) cuando no hay coincidencias, con mensaje claro y botón accesible _"Limpiar búsqueda"_ que restablece la vista completa.
- **Paginación Inteligente de 5 en 5 en Dashboard:**
  - En `AdminDashboardTab.vue`, las listas operativas críticas (_"Productos por agotarse"_ e _"Insumos con stock bajo"_) implementaron paginación local computada (`paginatedLowStockProducts`, `paginatedLowStockMaterials`).
  - Cada bloque limita la renderización a 5 elementos por página con controles de _Anterior_ y _Siguiente_, reduciendo significativamente la altura total del dashboard y previniendo el scroll infinito.
  - Validado mediante suite de pruebas unitarias dedicada en `tests/unit/admin-dashboard-pagination.test.ts` (6 tests).

### 2.10 Prevención de Redirección Fantasma al Recargar (F5) y Sincronización de Pestañas con URL (`app/pages/admin/index.vue`, `useAdminNavState.ts`, `app/middleware/admin-only.ts`)

- **Causa Raíz del Bug F5:**
  - Al presionar F5 dentro de `/admin`, `authStore.initAuth()` ejecutaba en paralelo la verificación de sesión mientras el middleware `admin-only` o la guarda reactiva detectaba un estado transitorio `isLoading = true` o `profile = null`, provocando una redirección no intencionada a `/perfil` o al login.
- **Solución Arquitectónica:**
  - Se desacopló y centralizó el estado de navegación en `app/composables/admin/useAdminNavState.ts`.
  - El middleware `admin-only.ts` aguarda la resolución completa de `initAuth()` antes de emitir cualquier decisión de enrutamiento.
  - Sincronización bidireccional limpia con la URL: la pestaña activa del panel admin (`dashboard`, `orders`, `products`, `materials`, `recipes`) se refleja en el query param `?tab=...` mediante `navigateTo({ query: { tab: newTab } }, { replace: true })`, permitiendo compartir enlaces a secciones específicas y recargar la página sin perder el contexto de trabajo.

### 2.11 Drawer Lateral Unificado (Sidebar Móvil) para Tienda y Administración (`app/layouts/default.vue` y `app/layouts/admin.vue`)

- **Problema Previo:** La navegación móvil dependía de menús desplegables heterogéneos y botones dispersos en el header que resultaban difíciles de operar con una sola mano.
- **Implementación del Drawer:**
  - Se diseñó un cajón lateral deslizante (`fixed inset-y-0 left-0 w-[280px] sm:w-[320px] bg-white z-[9999]`) con animación fluida `transform transition-all duration-300 ease-out`.
  - Fondo con desenfoque de cristal (`backdrop-blur-sm bg-black/40`) y cierre al hacer clic fuera o presionar la tecla `Escape`.
  - **Tienda (`default.vue`):** Enlaces directos a Catálogo, Mi Perfil, Estado de Sesión, Carrito y botón dinámico a _Panel Administrador_ si el usuario posee rol admin.
  - **Administración (`admin.vue`):** Listado completo de pestañas operativas (Dashboard, Pedidos, Vitrina, Insumos, Recetas), acceso rápido a KDS de Cocina en la misma pestaña y botón de retorno a la tienda pública.
  - Cierre automático del drawer tras hacer clic en cualquier opción de navegación para una experiencia fluida e intuitiva.

### 2.12 Reestructuración de Mi Perfil & Deep Linking con Pestañas (`app/pages/perfil.vue`)

- **Priorización de Datos Personales:** Se reordenó la pestaña _"Datos Personales"_ como la primera vista activa por defecto (`activeTab = 'personal'`), permitiendo a los usuarios actualizar inmediatamente su nombre, teléfono y contraseña sin tener que navegar por el historial de pedidos.
- **Deep Linking en Perfil:**
  - Soporte para parámetros de consulta `?tab=personal`, `?tab=direcciones`, `?tab=pedidos`.
  - Los enlaces directos desde el header o el sidebar drawer abren exactamente la sección deseada del perfil sin requerir clics adicionales.

### 2.13 Refactorización del Footer Global de Tienda y Limpieza de Tooltips Nativos (`app/components/common/AppFooter.vue`, `app/app.vue`)

- **Compactación y Balance Visual:**
  - Se redujo el espaciado vertical excesivo (`py-12 sm:py-16` -> `py-8 sm:py-10`), equilibrando los bloques de marca, enlaces de navegación, horario de atención y redes sociales.
- **Formateo Legible de WhatsApp:**
  - El número de contacto se normalizó a formato local legible `919 457 413` (o `+51 919 457 413`), evitando cadenas pegadas como `51919457413` que dificultaban la lectura rápida.
- **Botón "Subir arriba" y Eliminación de Tooltips Nativos:**
  - Se integró un botón flotante/inline ergonómico para volver a la cabecera de la página con desplazamiento suave.
  - Se eliminaron todos los atributos `title="..."` nativos en botones y enlaces del layout, erradicando los recuadros amarillos toscos por defecto del navegador y reemplazándolos por micro-interacciones hover naturales con sombras y escalas sutiles (`hover:scale-105 transition-all`).
- **Elevación Universal de Modales:** Todos los modales del sistema (`ProductModal`, `MaterialModal`, `OrderDetailsModal`, `NewOrderModal`, `ProfileAddressModal`, `CustomerOrderDetailsModal`) se estandarizaron con `z-[9999]`, garantizando que ningún elemento de la interfaz (incluyendo headers o footers) se superponga sobre ellos.

### 2.14 Infraestructura de Pruebas Móviles en Red Local (`dev:host`) y Autenticación Multi-dispositivo (`package.json`, `server/utils/server-supabase.ts`)

- **Script `dev:host`:**
  - Se añadió en `package.json`: `"dev:host": "nuxt dev --host 0.0.0.0"`.
  - Permite enlazar el servidor Vite/Nitro a todas las interfaces de red locales para probar la aplicación en teléfonos móviles reales vía Wi-Fi (`http://192.168.x.x:3000`).
- **Persistencia de Sesión HTTP Local:**
  - **Problema detectado:** Al iniciar sesión como administrador desde el celular a través de la IP local, la cookie de sesión de Supabase no se guardaba y la sesión se perdía al recargar.
  - **Causa Raíz:** En `server/utils/server-supabase.ts`, la configuración de cookies forzaba `secure: true` de forma rígida o dependía de HTTPS. En conexiones por IP local (`http://192.168.100.8:3000`), el navegador móvil rechaza cookies con el flag `Secure`.
  - **Solución:** Se ajustó la configuración a `secure: process.env.NODE_ENV === 'production'`, permitiendo que en desarrollo local sobre HTTP las cookies de sesión se almacenen de forma persistente tanto en la PC como en cualquier smartphone conectado.

### 2.15 Dashboard Móvil de Alto Rendimiento: Carrusel Suave sin Saltos de Pantalla y Pestañas Segmentadas (`AdminDashboardTab.vue`, `app/app.vue`)

- **Carrusel de Métricas en Mobile (`< sm`):**
  - Las 4 tarjetas de métricas operativas (Productos en vitrina, Insumos registrados, Productos por agotarse e Insumos con stock bajo) se transformaron en móvil en un carrusel táctil horizontal continuo con `snap-x snap-mandatory`, auto-rotación cada 4 segundos y 4 puntos (dots) indicadores interactivos.
  - En pantallas medianas y grandes (`>= sm`), las métricas mantienen intacta su cuadrícula clásica de 4 columnas (`sm:grid-cols-2 lg:grid-cols-4`).
- **Erradicación del Salto Vertical de Pantalla:**
  - **Problema:** Cada vez que el carrusel cambiaba de tarjeta automáticamente, la pantalla del celular saltaba violentamente hacia arriba si el usuario estaba leyendo las listas de abajo.
  - **Causa:** Se utilizaba `Element.scrollIntoView()`, el cual verifica la visibilidad vertical del elemento; si el carrusel estaba fuera de la pantalla, el navegador desplazaba el documento verticalmente hacia la cabecera.
  - **Solución:**
    1. Se reemplazó por [`container.scrollTo({ left: targetLeft, behavior: 'smooth' })`](file:///d:/Antigravity%20Proyects/ProyectoPostre/fullstack_dulcefe/app/components/admin/AdminDashboardTab.vue), el cual actúa **exclusivamente** sobre el eje horizontal del contenedor interno de tarjetas sin alterar el scroll vertical de la ventana (`window.scrollY`).
    2. Se añadió la función `isElementInViewport(metricsCarouselRef.value)` para pausar la auto-rotación cuando el carrusel no está visible en el campo visual del usuario, ahorrando recursos de procesamiento y batería.
- **Eliminación Total de la Barra de Scroll Nativa ("Gris con flechas"):**
  - Se añadieron estilos estrictos `.hide-scrollbar` tanto a nivel local scoped en `AdminDashboardTab.vue` como globalmente en `app/app.vue` (`::-webkit-scrollbar { display: none !important; }`, `scrollbar-width: none !important; -ms-overflow-style: none !important;`), eliminando cualquier barra de desplazamiento nativa no deseada en iOS, Android y Windows.
- **Control Segmentado (Tabs) para Alertas en Pantallas Móviles (`< lg`):**
  - Se integró un switch táctil estilizado con fondo `#F4F1E1`, píldora activa blanca y badges numéricos para alternar entre _"Por agotarse"_ (productos) e _"Insumos bajos"_ (materiales).
  - Reduce la altura vertical de la pantalla en un 50% en dispositivos móviles, permitiendo al administrador enfocarse en una lista a la vez sin fatiga de scroll.

### 2.16 Animación FLIP en Filtro de Almacén de Insumos (`AdminMaterialsTab.vue`)

- **Patrón FLIP en Tabla de Insumos:**
  - Se implementó `<TransitionGroup tag="tbody" name="material-row">` en la tabla principal de materias primas.
  - Al escribir o filtrar en el buscador, las filas no coincidentes salen del flujo inmediatamente (`position: absolute; opacity: 0; pointer-events: none; transition: opacity 0.05s ease;`), permitiendo que las filas restantes se deslicen suavemente a sus nuevas posiciones (`transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1); will-change: transform;`).
  - Al borrar letras o limpiar la búsqueda, los insumos reaparecen con una entrada sutil por escala y traslación vertical (`opacity 0.25s, transform translateY(-8px)`).
- **Feedback Interactivo en la Búsqueda:**
  - El badge del encabezado ahora muestra dinámicamente el conteo de coincidencias en tiempo real (`X de Y insumos`).
  - El botón de limpieza `(x)` cuenta con transición suave de desvanecimiento (`<Transition name="fade">`).
  - El dropdown de sugerencias se anima sutilmente (`<Transition name="dropdown">`) y previene pérdidas prematuras de foco mediante `@mousedown.prevent`.

---

## 3. Matriz de Verificación de Calidad

| Prueba / Verificación                 | Comando Ejecutado   | Resultado | Detalle                                                                        |
| :------------------------------------ | :------------------ | :-------: | :----------------------------------------------------------------------------- |
| **Pruebas Unitarias & Arquitectura**  | `npm test`          |  ✅ PASS  | 30 suites ejecutadas, 201 pruebas pasando al 100% (incluye animación FLIP)     |
| **Validación de Tipos (TypeScript)**  | `npm run typecheck` |  ✅ PASS  | 0 errores de tipado en cliente y servidor                                      |
| **Linter de Código (ESLint)**         | `npm run lint`      |  ✅ PASS  | 0 errores, 0 advertencias de estilo o formato                                  |
| **Compilación de Producción (Build)** | `npm run build`     |  ✅ PASS  | Compilación Nitro / Vite exitosa sin warnings                                  |

---

## 4. Estado de los Cambios

Los cambios se encuentran preparados, integrados y comiteados en la rama `feat/ui-refinements-auth-checkout-kds`. La base de código cuenta con paridad de experiencia móvil y de escritorio de alta fidelidad, con pruebas automatizadas y validación en dispositivos físicos reales.


