-- Migration: 20260907000003_phase6_payment_receipts.sql
-- Fase 6 / Subfase 6.4: Métodos de Pago (Yape/Plin/Efectivo) y Carga de Comprobantes (ADR-005 / D5)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cash' CHECK (payment_method IN ('cash', 'yape', 'plin', 'card')),
  ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'verified', 'rejected')),
  ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_verified_by UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- Índices de consulta rápida para búsqueda administrativa y conciliación
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);
