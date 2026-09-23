# Informe de Ejecución: Estandarización Universal de CustomSelect, Ajuste de Pantalla Única (Single-Screen Fit) y Erradicación de Avisos Retail

**Fecha:** 23 de Septiembre de 2026  
**Rama:** `feat/batch-recipes-yielding`  
**Pull Request:** #20 (Abierto para revisión del usuario)  
**Estado:** ✅ COMPLETADO / LISTO PARA REVISIÓN  
**Autor:** Antigravity & Jafeth

---

## 1. ¿Por Qué Se Hizo? (Contexto y Problema Detectado)

Durante la inspección de usabilidad y revisión visual de la Fase 7 (Tandas Maestras y Escandallo por Rendimiento), se identificaron tres discrepancias críticas respecto al estándar estético y funcional de **Dulce Fe**:

1. **Selectores Nativos con Flechas Desalineadas y Menús Grises:**
   - En `ProductBatchMappingModal.vue`, `BatchRecipeModal.vue`, `QuickPieceDeductionModal.vue`, `AdminRecipesTab.vue`, `MaterialModal.vue` y `NewOrderModal.vue` se habían implementado elementos HTML `<select>` nativos.
   - En navegadores de escritorio (Chrome, Edge) y móviles (Safari, Chrome Mobile), el elemento `<select>` nativo renderizaba flechas grises del sistema operativo solapadas sobre iconos vectoriales, textos apretados y menús desplegables blancos/grises con selección azul eléctrico (`#0066cc`) típica de Windows/Android, rompiendo la armonía estética de la paleta botánica cálida (`#2E4A28`, marfil, crema arena `#F4F1E1`).
2. **Desbordamiento Vertical y Falta de Ajuste a Una Sola Pantalla (Single-Screen Fit):**
   - En dispositivos móviles o tablets con teclado en pantalla o barras de navegación nativas, los modales se extendían más allá del viewport y las filas con múltiples campos (select de insumo + cantidad + unidad + costo + eliminar) se comprimían horizontalmente hasta deformar los controles táctiles, impidiendo trabajar cómodamente en el taller de repostería.
   - En `AdminRecipesTab.vue`, los controles comerciales (precio de venta, stock y botón de publicación) estaban restringidos a `hidden lg:flex`, dejando a los usuarios móviles sin la capacidad directa de ajustar precios o stock de vitrina desde su teléfono.
3. **Inconsistencia de Vitrina Retail en la Portada (`app/pages/index.vue`):**
   - La sección de productos destacados de la página de inicio conservaba una directiva condicional heredada (`product.stock <= 5`) que renderizaba badges con tono alarmista de supermercado (`🔴 ÚLTIMAS 3 UNIDADES`), violando el estándar artesanal definido en el **ADR-004** (`🌿 Horneado Fresco` / `Agotado por hoy`).

---

## 2. ¿Qué Se Hizo? (Alcance Técnico)

### A. Estandarización Universal de `CustomSelect.vue` (Cero `<select>` Nativos)
- **Erradicación al 100%:** Se eliminaron todos los `<select>` nativos de HTML en el 100% de la aplicación.
- **Componente Oficial Enriquecido (`app/components/ui/CustomSelect.vue` y `app/components/CustomSelect.vue`):**
  - Soporte para tamaños responsivos: `size="sm"` (h-9, padding compacto para formularios densos) y `size="md"` (h-11 estándar).
  - Propiedad `disabled` para bloqueo visual uniforme (`opacity-50 cursor-not-allowed`).
  - Flecha vectorizada Lucide (`lucide:chevron-down`) centrada en el eje vertical (`absolute top-1/2 -translate-y-1/2 right-3 sm:right-4 pointer-events-none`).
  - Micro-animación de apertura suave (`rotate-180 transition-transform duration-300`).
  - Popover flotante con desenfoque de fondo (`backdrop-blur-md`), sombra suave (`shadow-soft-xl`), scrollbar botánica personalizada verde oliva (`#4A5D23`) e ícono de confirmación `lucide:check` en la opción seleccionada.

### B. Arquitectura de Ajuste a Una Sola Pantalla ("Single-Screen Fit")
- **Estructura Tríptico en Modales:**
  - Contenedor con altura máxima estricta: `max-h-[90vh] sm:max-h-[92vh] flex flex-col`.
  - **Cabecera Fija (`shrink-0`):** Con título, subtítulo contextual y botón de cierre táctil (mínimo 44px).
  - **Cuerpo Central Scrollable (`flex-1 overflow-y-auto custom-scrollbar`):** El contenido fluye internamente sin desbordar nunca los límites físicos del dispositivo.
  - **Barra de Acciones Inferior Fija (`shrink-0`):** Botones "Cancelar" y "Guardar" siempre visibles y al alcance del pulgar.
- **Sub-Filas Táctiles en Pantallas Móviles (`< sm`):**
  - En móviles, las filas compuestas de insumos y empaques se desagregan de forma fluida: el `CustomSelect` ocupa el 100% de la línea superior para evitar textos cortados, mientras que en la sub-línea inferior se alinean la cantidad, la unidad, el subtotal y el botón de eliminación.
- **Controles de Vitrina Responsivos en `AdminRecipesTab.vue`:**
  - Se agregó una barra móvil dedicada (`flex lg:hidden`) para que el administrador pueda consultar el estado de vitrina (Activa / Borrador), editar el precio en Soles, actualizar el stock y publicar con 1 toque en celulares y tablets.
  - Se aplicó límite de altura `max-h-[460px] overflow-y-auto custom-scrollbar` en la lista de insumos registrados para evitar scroll infinito en el panel.

### C. Limpieza de Badges en Portada (`app/pages/index.vue`)
- Reemplazo del aviso retail por la insignia artesanal:
  - Si `stock > 0`: `🌿 Horneado Fresco` (badge verde esmeralda botánico).
  - Si `stock === 0`: `Agotado por hoy` (badge ámbar cálido) y botón "Pedir" deshabilitado (`disabled`).
- Actualización de pruebas de humo E2E (`tests/e2e/batch-recipes.smoke.spec.ts`) para certificar que ni `/` ni `/menu` emiten falsas alarmas de escasez de supermercado.

### D. Documentación Técnica Inmutable
- Incorporación del **Patrón 8: Selectores Personalizados y Ajuste de Pantalla Única** en `docs/03 - Arquitectura & UI/guia-diseno-mobile-responsivo.md`.
- Actualización de la arquitectura de componentes en `docs/03 - Arquitectura & UI/componentes-arquitectura.md`.
- Actualización del **Checklist de Aprobación para Nuevas Vistas y Modales**.

---

## 3. ¿Cómo Se Hizo? (Detalle de Archivos Modificados)

| Archivo Modificado | Tipo de Cambio | Justificación |
|---|---|---|
| `app/components/ui/CustomSelect.vue` | Refactor & Props | Añadido soporte para `size: 'sm' \| 'md'`, `disabled`, `buttonClass`, centrado absoluto de flecha Lucide y rotación a 180°. |
| `app/components/CustomSelect.vue` | Wrapper | Puente transparente entre la raíz de componentes y `ui/CustomSelect.vue`. |
| `app/components/admin/ProductBatchMappingModal.vue` | Refactor UI | Reemplazados 3 selects nativos por `CustomSelect` (Tanda, Corte y Empaques). Fila de empaques adaptativa para mobile. |
| `app/components/admin/QuickPieceDeductionModal.vue` | Refactor UI | Reemplazados 2 selects nativos por `CustomSelect`. Diseño de 2 columnas responsivo. |
| `app/components/admin/BatchRecipeModal.vue` | Refactor UI | Reemplazado select de insumos por `CustomSelect`. Sub-fila en mobile para insumos y rendimientos. |
| `app/components/admin/AdminRecipesTab.vue` | Refactor UI | Reemplazado select de insumo directo por `CustomSelect`. Barra de vitrina móvil (`lg:hidden`). Scroll delimitado en lista de insumos. |
| `app/components/admin/MaterialModal.vue` | Refactor UI | Reemplazado select nativo de unidad base (`g`, `ml`, `und`, `kg`, `L`) por `CustomSelect`. |
| `app/components/admin/NewOrderModal.vue` | Refactor UI | Reemplazado select nativo de productos por `CustomSelect`. |
| `app/pages/index.vue` | Refactor UI | Eliminado aviso `"ÚLTIMAS X UNIDADES"`. Implementado badge artesanal `🌿 Horneado Fresco` / `Agotado por hoy`. |
| `tests/e2e/batch-recipes.smoke.spec.ts` | Test Update | Pruebas de no regresión para vitrina limpia en `/` y `/menu`. |
| `docs/03 - Arquitectura & UI/guia-diseno-mobile-responsivo.md` | Documentación | Registro oficial del Patrón 8 y checklist de calidad. |
| `docs/03 - Arquitectura & UI/componentes-arquitectura.md` | Documentación | Especificación técnica de `CustomSelect.vue` y modales de Fase 7. |

---

### E. Desplegables 100% Opacos y Paginación Dinámica Adaptativa
- **Eliminación Total de Transparencias en Desplegables:**
  - Se suprimió la directiva `backdrop-blur` y el color semi-translúcido `bg-surface/98` en `CustomSelect.vue`.
  - El popover ahora utiliza estrictamente **`bg-white` 100% sólido y opaco**, borde definido `border-brand-primary/20` y sombra profunda `shadow-2xl`. Las tarjetas y elementos que quedan detrás ya no se traslucen en manchones borrosos.
- **Paginación Dinámica de Insumos y Tandas:**
  - En `AdminRecipesTab.vue`, la lista de insumos directos ahora pagina de **4 en 4** con pie de paginación (`Página X de Y`, botones táctiles `Anterior` / `Siguiente`).
  - Esto equilibra la altura de la columna derecha con la columna izquierda en PC, asegurando que **toda la vista entre en una sola pantalla sin cortarse ni obligar a hacer scroll vertical**.
  - La cuadrícula de tandas maestras también incluye paginación dinámica (6 por página).
- **Control Segmentado Mobile (App Nativa Feel):**
  - En móviles (`< lg`), se introdujo un selector segmentado tipo píldora para alternar instantáneamente entre:
    - 📊 **Cálculo & Costos** (Tarjeta de margen KPI tradicional, CIF y formulario rápido de insumo).
    - 📋 **Insumos Registrados** (Lista paginada de 4 en 4 con paginador).
  - Esto erradica el scroll infinito en smartphones, permitiendo que la vista se sienta y opere con la fluidez de una aplicación móvil nativa.

### F. Erradicación Universal de Truncamiento de Texto (`truncate` / `line-clamp`)
- **Problema Solucionado:** El uso de elipsis (`...`) cortaba nombres extensos de materias primas, tandas maestras, formatos de rendimiento y motivos de descargo, ocultando información crucial para el pastelero y administrador.
- **Implementación Técnica:**
  - En `CustomSelect.vue`: Se sustituyó `truncate` en el botón principal y en las opciones (`opt.label` y `opt.sublabel`) por `break-words leading-tight` / `leading-snug`. Los nombres largos fluyen naturalmente a dos líneas sin cortar información.
  - En `QuickPieceDeductionModal.vue`: Se removió `truncate` y `line-clamp-1` en los motivos de descargo y en la lista de insumos calculados.
  - En `AdminRecipesTab.vue`: Se eliminó `line-clamp-1` de la descripción de tanda maestra y `truncate` del nombre de los formatos de corte de rendimiento.

---

## 4. Verificación y Resultados de Calidad

- **Grep de Verificación en Código:**
  - Cero etiquetas `<select>` nativas en los componentes Vue (`0 matches`).
  - Cero directivas `truncate` o `line-clamp` en los componentes de recetas y selectores del módulo (`0 matches`).
- **Pruebas Unitarias y de Integración (`npm test`):** 244 tests ejecutados, 244 aprobados (100% verde).
- **Chequeo de Tipos TypeScript (`npx nuxi typecheck`):** 0 errores.
- **Compilación de Producción (`npm run build`):** Código de salida 0 (éxito).

---

## 5. Estado de la Rama y Pull Request en GitHub

- **Rama:** `feat/batch-recipes-yielding`
- **Pull Request:** PR #20 (`feat/batch-recipes-yielding` -> `dev`)
- **Estado:** Abierto y pendiente de revisión del usuario (tal como fue ordenado explícitamente: *"pero no lo aceptes dejalo ahi para mi revision"*).

