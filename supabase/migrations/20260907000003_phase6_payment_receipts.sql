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

-- Bucket de almacenamiento para comprobantes de pago (Yape/Plin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('payment-receipts', 'payment-receipts', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas RLS para storage.objects del bucket payment-receipts
DROP POLICY IF EXISTS "Public Read Payment Receipts" ON storage.objects;
CREATE POLICY "Public Read Payment Receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Service Role Full Access Payment Receipts" ON storage.objects;
CREATE POLICY "Service Role Full Access Payment Receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'payment-receipts');

-- Ampliar dominio de acciones auditables para pagos
ALTER TABLE public.audit_events DROP CONSTRAINT IF EXISTS audit_events_action_check;
ALTER TABLE public.audit_events ADD CONSTRAINT audit_events_action_check 
  CHECK (action IN ('checkout.create', 'order.create_admin', 'order.status', 'product.write', 'material.write', 'recipe.write', 'upload.write', 'stock.adjust', 'payment.verify', 'payment.verified', 'payment.rejected'));

