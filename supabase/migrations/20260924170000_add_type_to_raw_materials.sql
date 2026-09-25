-- Migration: 20260924170000_add_type_to_raw_materials.sql
-- Description: Add type column to raw_materials to distinguish culinary ingredients from packaging items.

-- 1. Agregar columna type con default 'ingredient'
ALTER TABLE public.raw_materials 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'ingredient' NOT NULL;

-- 2. Asegurar restricción check
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'raw_materials_type_check'
  ) THEN
    ALTER TABLE public.raw_materials
    ADD CONSTRAINT raw_materials_type_check 
    CHECK (type IN ('ingredient', 'packaging'));
  END IF;
END $$;

-- 3. Índice para optimizar filtrados
CREATE INDEX IF NOT EXISTS idx_raw_materials_type ON public.raw_materials(type);

-- 4. Sembrado inicial de empaques comunes de repostería para conveniencia inmediata
INSERT INTO public.raw_materials (name, unit, purchase_price, purchase_quantity, stock, type)
SELECT 'Caja Torta / Pastel 25x25cm', 'und', 25.00, 10, 10, 'packaging'
WHERE NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE type = 'packaging');

INSERT INTO public.raw_materials (name, unit, purchase_price, purchase_quantity, stock, type)
SELECT 'Bolsa Kraft Dulce Fe (Mediana)', 'und', 15.00, 25, 25, 'packaging'
WHERE NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE name = 'Bolsa Kraft Dulce Fe (Mediana)');

INSERT INTO public.raw_materials (name, unit, purchase_price, purchase_quantity, stock, type)
SELECT 'Domo Transparente Individual', 'und', 18.00, 20, 20, 'packaging'
WHERE NOT EXISTS (SELECT 1 FROM public.raw_materials WHERE name = 'Domo Transparente Individual');
