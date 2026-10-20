-- Migracion: Agregar porciones a productos y columnas de modalidad/franja de entrega a pedidos
-- Fecha: 2026-10-20

-- 1. Columna portions en products
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS portions INTEGER NULL;

COMMENT ON COLUMN public.products.portions IS 'Cantidad aproximada de porciones sugeridas que rinde el producto (ej. 1, 6, 8, 10, 12).';

-- 2. Valores iniciales de porciones para productos conocidos del catalogo
UPDATE public.products SET portions = 10 WHERE LOWER(name) LIKE '%cheesecake%' AND portions IS NULL;
UPDATE public.products SET portions = 12 WHERE LOWER(name) LIKE '%chocolate%' AND portions IS NULL;
UPDATE public.products SET portions = 8 WHERE LOWER(name) LIKE '%tarta%' AND portions IS NULL;
UPDATE public.products SET portions = 6 WHERE LOWER(name) LIKE '%brownie%' AND portions IS NULL;
UPDATE public.products SET portions = 12 WHERE LOWER(name) LIKE '%alfajor%' AND portions IS NULL;

-- 3. Columnas en orders para trazabilidad de entrega y punto de encuentro
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(30) DEFAULT 'delivery';

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_slot VARCHAR(30) NULL;

ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS meeting_point_details TEXT NULL;

COMMENT ON COLUMN public.orders.delivery_mode IS 'Modalidad de entrega: delivery o meeting_point.';
COMMENT ON COLUMN public.orders.delivery_slot IS 'Franja horaria seleccionada: morning (8-10 AM), night (7-10 PM), special.';
COMMENT ON COLUMN public.orders.meeting_point_details IS 'Detalles del punto de encuentro acordado con el cliente (ej. Parroquia, estacion).';
