# Sistema de Diseño y Reglas Frontend (Design System)

> **LOGIC:** Este documento actúa como la fuente de verdad (Single Source of Truth) para todas las decisiones de Interfaz de Usuario (UI) y Experiencia de Usuario (UX) en el ERP **Dulce Fe**. 
> Si eres un desarrollador nuevo integrándote al proyecto, debes leer este documento para entender *por qué* y *cómo* aplicamos clases CSS y qué patrones debes evitar para no romper la estética.

---

## Filosofía de Diseño: Neo-Brutalismo Botánico

El "Neo-Brutalismo" es una corriente de diseño web moderna caracterizada por contrastes muy altos, bordes gruesos y sombras sólidas (sin difuminar) que dan la ilusión de cajas físicas, pegatinas (stickers) o papel recortado. 
Hemos bautizado nuestra variante como **"Botánico"** porque sustituye los típicos colores chillones del brutalismo tradicional (amarillos fluorescentes, fucsias) por una paleta orgánica, seria y elegante (verdes militares, cremas, texturas pasteleras). El objetivo es que la aplicación se sienta creativa (para una pastelería) pero robusta (es un ERP financiero, los números deben ser lo más importante).

---

## 1. Paleta de Colores y Tokens

No se permite el uso de colores nativos de Tailwind (como `bg-blue-500` o `bg-green-500`) en ningún lado, a menos que sean los especificados aquí. 

| Rol | Hexadecimal | Clases Tailwind Frecuentes | Cuándo usarlo (Reglas de Implementación) |
|------|-----|--------------|-------------|
| **Brand Primary** | `#4A5D23` | `text-[#4A5D23]`, `bg-[#4A5D23]`, `border-[#4A5D23]` | Es nuestro verde militar (Verde Dulce Fe). Úsalo como fondo para el botón principal de cada formulario (ej. "Guardar Cambios"). Úsalo en el borde (`border-2`) de las tarjetas grandes para enmarcarlas. Úsalo como color base para los iconos principales del sistema. |
| **Brand Secondary** | `#2A321B` | `text-[#2A321B]`, `bg-[#2A321B]` | Es un verde oscuro casi negro. Úsalo exclusivamente para el texto de los títulos (`h1`, `h2`), para el texto dentro de los `input`, y para las sombras sólidas (`shadow-[..._#2A321B]`). Garantiza un contraste altísimo de lectura. |
| **App Background** | `#F4F1E1` | `bg-[#F4F1E1]` | Crema perlado/papel antiguo. Es el color de fondo de toda la pantalla de la aplicación (`body`). **Nunca uses blanco puro para el fondo de la pantalla**, el contraste sería demasiado agresivo para los ojos durante el uso prolongado del ERP. |
| **Surface** | `#FFFFFF` | `bg-white` | Blanco puro. Se usa **única y exclusivamente** como fondo para el interior de las Tarjetas (Cards) y los Inputs de texto. Esto hace que el contenido resalte del fondo crema. |
| **Danger / Destructive** | `#991B1B` | `text-[#991B1B]`, `bg-[#991B1B]` | Rojo carmesí. Usarlo siempre para el botón de "Borrar" (papelera), o para mensajes de error de servidor. |
| **Profit / Success** | `#a3e635` | `text-[#a3e635]` | Verde lima neón brillante. Usado en fondos oscuros para mostrar márgenes de rentabilidad positivos. Es el único color llamativo de la app y solo se usa para el "Premio" visual de ver las ganancias. |

---

## 2. Tipografía y Jerarquía

Para cargar las fuentes de manera óptima, están importadas vía Google Fonts en la cabecera de la aplicación en `nuxt.config.ts`.

1. **Titulares Principales (`font-playfair`)**: 
   - *Fuente*: Playfair Display.
   - *Uso*: Reservado exclusivamente para títulos de secciones o tarjetas (ej. `h1` "Vitrina Comercial", `h2` "Ficha Técnica"). Aporta el toque "premium" y gastronómico.
2. **Cuerpo, Tablas y Números (`font-inter` o default sans)**: 
   - *Fuente*: Inter (o la fuente sans-serif por defecto de Tailwind).
   - *Uso*: Todo el resto del sistema. Etiquetas de formularios, botones, inputs numéricos y textos descriptivos. Elegida por su perfecta legibilidad de los números (vital en un ERP de costos).

---

## 3. Sombras, Bordes e Interacción (Core Neo-Brutalist)

La interactividad es lo que vende la estética de la aplicación. Todo elemento clickeable debe sentirse físico.

### Bordes
- Los bordes nunca son sutiles (1px). Siempre deben ser marcados: `border-2`.
- El radio de redondeo es pronunciado. Los inputs usan `rounded-xl` y las tarjetas contenedoras usan `rounded-[2rem]` (muy orgánico).

### Sombras Físicas (Sticker Shadows)
Las sombras clásicas (`shadow-md` de Tailwind) usan un efecto de desenfoque (`blur`). Nosotros **no** usamos desenfoque.
- **Sombra para Botones (Pequeña):** `shadow-[4px_4px_0px_#2A321B]`. Crea una caja negra sólida de 4 píxeles hacia abajo y a la derecha.
- **Sombra para Tarjetas (Grande):** `shadow-[6px_6px_0px_#4A5D23]`. 

### Efecto Clic (Hover y Active)
Cuando un usuario hace clic en un botón, este debe hundirse físicamente en la pantalla, perdiendo su sombra.
- **Código estándar de un botón primario**:
  ```html
  <button class="bg-[#4A5D23] border border-[#2A321B] rounded-xl shadow-[4px_4px_0px_#2A321B] transition-all duration-300 active:translate-y-1 active:shadow-none">
     Guardar
  </button>
  ```
  *(Nota técnica: El `active:translate-y-1` mueve el botón 4px hacia abajo, y el `active:shadow-none` borra la sombra, generando el efecto de que el botón se empujó contra el fondo).*

---

## 4. Checklist de Aceptación de Código (PR Checklist)

Desarrollador, antes de dar por terminada tu tarea de UI o subir tu código, verifica obligatoriamente los siguientes puntos:

- [ ] **No Spinners en Formularios**: ¿Has verificado que tus `<input type="number">` tengan la clase o el estilo para ocultar las flechas nativas del navegador? (En Tailwind: `[&::-webkit-inner-spin-button]:appearance-none`). Un ERP no debe verse como un formulario básico de HTML5.
- [ ] **Uso Exclusivo de Íconos SVG**: ¿Usaste `@nuxt/icon` (con el prefijo `lucide:`) para la iconografía? Queda estrictamente prohibido usar Emojis del teclado para adornar la interfaz.
- [ ] **Contraste de Accesibilidad**: ¿Verificaste que tus textos descriptivos sobre fondos oscuros sean legibles? (Si usas texto secundario, usa una opacidad de `text-black/70` o `text-white/70`, nunca menor a 50%).
- [ ] **Sin Sombras Difuminadas**: ¿Te aseguraste de no haber colado accidentalmente una clase nativa como `shadow-lg`? Reemplázala por una sombra dura en corchetes `shadow-[Xpx_Ypx_0px_#Color]`.
- [ ] **Feedback Interactivo**: ¿Tienen todos los elementos sobre los que se puede hacer clic (tarjetas de productos en la lista, botones, selectores) el puntero correcto (`cursor-pointer`) y una transición visible al hacer *hover* o *active*?
