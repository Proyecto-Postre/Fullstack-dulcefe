-- ============================================================================
-- MIGRACIÓN DE ESQUEMA Y DATOS: COLUMNA DESCRIPTION Y PRODUCTOS DE MUESTRA
-- Fecha: 2026-10-04
-- 1. Añade columna description a products para notas de autor de repostería.
-- 2. Inserta 2 postres de ejemplo para exhibición en vitrina.
-- ============================================================================

-- 1. Asegurar columnas description e is_featured en tabla products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false NOT NULL;

-- 2. Insertar los dos productos de ejemplo con su descripción artesanal
INSERT INTO public.products (id, name, price, stock, image_url, description, is_featured)
VALUES 
  (
    1,
    'Torta Artesanal de Chocolate & Frutos Rojos',
    95.00,
    6,
    '/images/desserts/torta-chocolate-frutos.jpg',
    'Bizcocho húmedo de cacao intenso al 70% con ganache bitter artesanal, frambuesas frescas, arándanos e higos seleccionados. Elaborada bajo pedido con ingredientes 100% naturales.',
    true
  ),
  (
    2,
    'Tartaletas Gourmet de Fresas & Pistacho',
    45.00,
    8,
    '/images/desserts/tartaleta-fresas-pistacho.jpg',
    'Masa sableé crujiente rellena de suave crema pastelera a la vainilla de Madagascar y lluvia de pistachos tostados de temporada.',
    true
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  stock = EXCLUDED.stock,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  is_featured = EXCLUDED.is_featured;

-- 3. Ajustar la secuencia de IDs de products para evitar colisiones en próximos registros
SELECT setval(pg_get_serial_sequence('public.products', 'id'), COALESCE((SELECT MAX(id) FROM public.products), 1));
