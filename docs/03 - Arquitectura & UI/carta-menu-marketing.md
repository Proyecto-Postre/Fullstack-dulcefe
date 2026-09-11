# Arquitectura y Diseño: Sistema de Carta Digital y Material de Marketing "Dulce Fe"

## 1. Visión General
El módulo de Carta Digital y Material Publicitario de Dulce Fe traslada el diseño editorial y artesanal generado previamente como imagen a un **sistema en código modular, editable y exportable** a alta resolución (PDF de imprenta vectorial e Imagen PNG para redes sociales/WhatsApp).

---

## 2. Aislamiento y Organización del Módulo

Para evitar sobrecargar el núcleo transaccional de la tienda (Nuxt 3 / Supabase) con dependencias o maquetados rígidos de marketing, el sistema se estructura de forma independiente y versátil:

```text
fullstack_dulcefe/
├── marketing/
│   └── carta-menu/
│       ├── index.html       # Interfaz interactiva y visor de las 4 láminas
│       ├── css/
│       │   └── menu.css     # Reglas CSS de alta fidelidad, paleta, fuentes y @media print
│       ├── js/
│       │   ├── menu-data.js # Catálogo de datos desacoplado (secciones, productos, precios)
│       │   ├── menu-icons.js# Iconografía y sellos vectoriales SVG limpios
│       │   └── export.js    # Lógica de pestañas, modo de edición en vivo y exportación
│       └── assets/          # Ilustraciones botánicas de olivo y texturas
├── public/marketing/        # Copia servida estáticamente para acceso directo desde la web
└── app/pages/admin/         # Enlace directo desde el Sidebar administrativo
```

---

## 3. Tokens Visuales e Identidad Gráfica

| Token | Valor | Uso en la Carta |
| :--- | :--- | :--- |
| **Verde Olivo Profundo** | `#2D3E2B` | Títulos principales, badges de precios, siluetas onduladas laterales |
| **Verde Salvia / Musgo** | `#4A5D23` | Iconografía, trazos de pincel ("Brush Banner"), subtítulo "de Postres" |
| **Fondo Crema Pergamino** | `#F9F5EC` / `#FAF6EE` | Textura cálida de papel artesanal |
| **Pespunte / Punteado** | `#F4F1E1` (sobre verde) / `#A4B29E` | Líneas de guía y pespunte sobre ondas |
| **Dorado / Miel Pastelero** | `#C5A059` | Acentos de botones, edición y detalles de repostería |

### Tipografías (Google Fonts)
1. **Titulares Mayúsculas**: `Playfair Display` (Serif editorial, 700 / 600).
2. **Subtítulos Caligráficos**: `Great Vibes` (Cursiva fluida de alto impacto para "de Postres", "Bocaditos" y "Los postres húmedos...").
3. **Cuerpo de Producto y Precios**: `Montserrat` / `Inter` (Sans-serif limpia, legible a tamaños pequeños y en impresión).

---

## 4. Desglose de las 4 Láminas

1. **Lámina 1 (Postres 1)**:
   - Encabezado: "MENÚ de Postres" + Sello con batidor "HECHOS CON DEDICACIÓN" + Banner pincelado "INGREDIENTES DE CALIDAD...".
   - Sección Galletería (5 variedades con precio S/ 15.00 e ícono ilustrado).
   - Sección Cuchareables / Fríos (3 Leches, Selva Negra, Mokka a S/ 12.00).
   - Onda lateral derecha con pespunte y hojas de olivo en acuarela.
2. **Lámina 2 (Bocaditos Dulces)**:
   - Encabezado: "Dulce Fe Bocaditos".
   - Distribución en 2 columnas (Regular y Mini) para Roles de canela, Galletitas, Mini brownies y Tartaletitas.
3. **Lámina 3 (Postres 2)**:
   - Onda lateral izquierda.
   - Bizcochos y Horneados (Kekes, Muffins, Cupcakes, Brownies).
   - Masas Quebradas / Tartas (Mini tarta de manzana, Mini tartaletas).
4. **Lámina 4 (Bocaditos Tradicionales & Alfajorcitos)**:
   - Cuadrícula de 2 columnas de bocaditos tradicionales con icono en círculo.
   - Recuadro ornamental destacado: "COMBO SURTIDO" (hasta 4 variedades).
   - Sección de Alfajorcitos (Regulares y Chips) + Mini Triples clásicos y premium.

---

## 5. Modos de Uso y Exportación

1. **Doble clic en Windows**: Abrir `marketing/carta-menu/index.html` sin necesidad de internet ni servidores activos.
2. **Desde el Panel Admin**: Botón `Carta Digital / Menú` en el sidebar de `/admin`.
3. **Modo Edición Rápida**: Botón `✏️ Modo Edición Rápida` para modificar textos o precios haciendo clic directamente sobre ellos en la pantalla.
4. **Exportar a PDF**: Genera un archivo vectorial mediante `@page { size: A4 portrait; margin: 0; }` sin pixelación tipográfica.
5. **Descargar PNG**: Genera una imagen en resolución 2x Retina optimizada para compartir por WhatsApp.
