-- Migration: 20261104160000_seed_initial_inventory_movements_balance.sql
-- Dominio: Auditoria & Trazabilidad de Almacen
-- Descripcion: Registro de asiento contable de apertura en inventory_movements para materias primas con stock inicial

INSERT INTO public.inventory_movements (
  raw_material_id,
  type,
  quantity_delta,
  stock_before,
  stock_after,
  reason,
  created_at
)
SELECT 
  rm.id,
  'manual_adjustment',
  rm.stock,
  0,
  rm.stock,
  'Inventario inicial / Apertura de almacén',
  now()
FROM public.raw_materials rm
WHERE rm.stock > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.inventory_movements im
    WHERE im.raw_material_id = rm.id
  );
