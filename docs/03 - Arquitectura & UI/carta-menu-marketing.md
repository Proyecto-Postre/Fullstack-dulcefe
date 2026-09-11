# Arquitectura y Diseño: Sistema de Carta Digital y Material de Marketing "Dulce Fe"

## 1. Visión General
El módulo de Carta Digital y Material Publicitario de Dulce Fe traslada el diseño editorial y artesanal generado previamente como imagen a un **sistema en código modular, editable y exportable** a alta resolución (PDF de imprenta vectorial e Imagen PNG para redes sociales/WhatsApp).

---

## 2. Aislamiento y Organización del Módulo

Para evitar sobrecargar el núcleo transaccional de la tienda (Nuxt 3 / Supabase) con dependencias o maquetados rígidos de marketing, el sistema se estructura de forma independiente y versátil:

```text
fullstack_dulcefe/
├── marketing/
│   ├── process-assets.mjs        # Procesador de canal alfa y transparencia suave
│   ├── extract-colors.mjs        # Extractor espectral de píxeles
│   ├── extract-original-assets.mjs # Extractor de ilustraciones y sellos originales
│   └── carta-menu/
│       ├── index.html            # Interfaz interactiva y visor de las 4 láminas
│       ├── css/
│       │   └── menu.css          # Reglas CSS con la paleta de colores original extraída
│       ├── js/
│       │   ├── menu-data.js      # Catálogo de datos desacoplado (secciones, productos, precios)
│       │   ├── menu-icons.js     # Iconografía y sellos vectoriales SVG limpios (cero emojis)
│       │   └── export.js         # Lógica de pestañas, modo de edición en vivo y exportación
│       └── assets/               # Ilustraciones y texturas en PNG transparente
├── public/marketing/             # Copia servida estáticamente para acceso directo desde la web
└── app/pages/admin/              # Enlace directo desde el Sidebar administrativo
```

---

## 3. Tokens Visuales e Identidad Gráfica Extraída Píxel a Píxel

| Token | Hex Extraído | Uso en la Carta |
| :--- | :--- | :--- |
| **Fondo Crema Pergamino** | `#F1E2CD` | Textura real de papel artesanal con fibras naturales |
| **Verde Título MENÚ / Dulce Fe** | `#353916` | Verde olivo profundo de máximo contraste editorial |
| **Dorado/Oliva Cursiva** | `#736429` | "de Postres" y "Bocaditos" |
| **Verde Onda Lateral** | `#4D4D29` | Siluetas orgánicas y divisorias |
| **Pespunte Punteado** | `#E4D4BC` | Línea de guía discontinua sobre las ondas |
| **Verde Badges de Precios** | `#333415` | Cápsulas de precios redondeadas |
| **Verde Brush Banner** | `#535233` | Trazo de brocha de acuarela/óleo con textura |
| **Puntos Suspensivos** | `#B0A382` | Línea punteada entre nombre y precio |

### Tipografías
1. **Titulares Mayúsculas**: `Playfair Display` (Serif editorial, 700 / 600).
2. **Subtítulos Caligráficos**: `Great Vibes` (Cursiva fluida de alto impacto para "de Postres", "Bocaditos" y "Los postres húmedos...").
3. **Cuerpo de Producto y Precios**: `Montserrat` / `Inter` (Sans-serif limpia, legible a tamaños pequeños y en impresión).

---

## 4. Ilustraciones y Elementos Visuales Transparentes (Cero Emojis)

1. **Ramas de Olivo**:
   - `orig_leaves_top_left.png`: Rama superior con caída natural en acuarela botánica.
   - `orig_leaves_bottom_right.png`: Rama ascendente vertical con florecillas y bayas.
2. **Sello "Hechos con Dedicación"**:
   - `orig_stamp_light.png`: Sello con batidor manual para fondo claro.
   - Sello vectorial SVG integrado en `menu-icons.js`.
3. **Ilustraciones de Bocaditos en PNG Transparente**:
   - `orig_rol_canela.png` (Rol de canela en espiral).
   - `orig_galletita.png` (Galleta mordida con chispas de chocolate).
   - `orig_brownie.png` (Cubo de brownie isométrico con nueces).
   - `orig_tartaleta.png` (Tartaleta con rodajas de manzana en abanico).
   - `orig_milhojas.png` (Bloque de milhojas hojaldrado).
   - `orig_orejitas.png` (Orejitas dobles en forma de corazón).
   - `orig_empanadita.png` y `orig_empanadita_carne.png` (Empanaditas con repulgue trenzado).
   - `orig_canastilla.png` (Canastilla de tartaleta con aceitunas).
   - `orig_enrolladito.png` (Enrolladito con salchicha).
   - `orig_alfajor_reg.png` y `orig_alfajor_chips.png` (Alfajorcitos con dulce de leche).
   - `orig_triple.png` y `orig_triple_prem.png` (Mini triples).
4. **Cajita de Paquete**:
   - SVG fino lineal `boxPackage()` que acompaña a cada "Paquete de 25 un", etc., sin usar emojis.
