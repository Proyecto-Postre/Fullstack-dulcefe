-- Migración: Soporte de Tracking Criptográfico de Invitados (Fase 6 / ADR-002 / D2)
-- Agrega tracking_token opaco e inmutable a la tabla orders.

BEGIN;

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_orders_tracking_token 
  ON public.orders(tracking_token);

COMMENT ON COLUMN public.orders.tracking_token IS 'Token criptográfico HMAC-SHA256 para consulta pública segura sin autenticación ni fuga de PII';

COMMIT;
