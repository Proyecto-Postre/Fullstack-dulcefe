-- ============================================================================
-- MIGRACIÓN: Calibración y Sincronización Final de Catálogo e Insumos desde DEV
-- Fecha: 2026-11-04
-- Ajusta nombres, presentaciones y precios retocados en DEV para garantizar
-- paridad absoluta con producción.
-- ============================================================================

-- 1. CALIBRACIÓN DE INSUMOS (RAW_MATERIALS)
UPDATE public.raw_materials
SET name = 'Carne molida', purchase_price = 10.00
WHERE id = 38;

UPDATE public.raw_materials
SET name = 'Cebolla morada'
WHERE id = 40;

UPDATE public.raw_materials
SET purchase_price = 12.00
WHERE id = 41;

UPDATE public.raw_materials
SET name = 'Caja de bocaditos'
WHERE id = 42;

-- 2. CALIBRACIÓN DE PRODUCTOS (PUBLIC.PRODUCTS)
UPDATE public.products
SET name = 'Empanaditas Mixtas (Caja x25)'
WHERE id = 11;

UPDATE public.products
SET name = 'Empanaditas Mixtas (Caja x50)'
WHERE id = 12;

UPDATE public.products
SET name = 'Empanaditas Mixtas (Caja x100)'
WHERE id = 13;

UPDATE public.products
SET name = 'Alfajores Tradicionales (Caja x12)'
WHERE id = 27;

UPDATE public.products
SET name = 'Vaso Mokka (12 oz)'
WHERE id = 49;

UPDATE public.products
SET name = 'Vaso Red Velvet Suave (12 oz)'
WHERE id = 50;

UPDATE public.products
SET name = 'Vaso Chocolate Húmedo (12 oz)'
WHERE id = 51;
