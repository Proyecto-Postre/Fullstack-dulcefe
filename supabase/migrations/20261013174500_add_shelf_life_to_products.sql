-- Migración: Agregar tiempo de vida / conservación a productos
-- Permite especificar la recomendación de consumo óptimo por cada postre (ej: '1-2 días en frío', '3-4 días', '5-7 días')

ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS shelf_life TEXT DEFAULT '3-4 días';

COMMENT ON COLUMN public.products.shelf_life IS 'Tiempo y recomendación de consumo óptimo del postre (ej. 1-2 días en frío, 3-4 días, 5-7 días).';
