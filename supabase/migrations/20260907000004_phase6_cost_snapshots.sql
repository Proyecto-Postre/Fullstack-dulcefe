-- Migration: 20260907000004_phase6_cost_snapshots.sql
-- Fase 6 / Subfase 6.5: Snapshot de Escandallo / Freeze Cost of Goods Sold al Ordenar (ADR-008 / D8)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cost_snapshot JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS total_cost_cents INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gross_margin_cents INTEGER DEFAULT NULL;

-- Comentarios explicativos para gobernanza de esquema
COMMENT ON COLUMN public.orders.cost_snapshot IS 'Snapshot inmutable de escandallo y costo de insumos congelado al entrar a producción';
COMMENT ON COLUMN public.orders.total_cost_cents IS 'Costo de los bienes vendidos (COGS) en céntimos';
COMMENT ON COLUMN public.orders.gross_margin_cents IS 'Margen bruto de la orden en céntimos (precio venta - costo insumos)';
