-- ============================================================================
-- FASE 3 (PR-3a): INFRAESTRUCTURA DE APOYO, IDEMPOTENCIA Y LIBRO DE INVENTARIO
-- ============================================================================

-- 1. Ensanchamiento y blindaje de la tabla orders
ALTER TABLE public.orders 
  ALTER COLUMN total_amount TYPE numeric(12,2) USING total_amount::numeric(12,2);

ALTER TABLE public.orders 
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS inventory_processed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS points_awarded boolean NOT NULL DEFAULT false;

-- Restricción de estados oficiales del sistema
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'ready', 'completed', 'cancelled'));

-- 2. Ensanchamiento y blindaje de la tabla order_items
ALTER TABLE public.order_items 
  ALTER COLUMN price_at_time TYPE numeric(12,2) USING price_at_time::numeric(12,2);

ALTER TABLE public.order_items 
  DROP CONSTRAINT IF EXISTS order_items_quantity_price_check;

ALTER TABLE public.order_items 
  ADD CONSTRAINT order_items_quantity_price_check 
  CHECK (quantity > 0 AND price_at_time >= 0);

-- 3. Tabla de llaves de idempotencia de Checkout y Admin (TTL 24h)
CREATE TABLE IF NOT EXISTS public.checkout_idempotency_keys (
  operation        text NOT NULL,
  principal_scope  text NOT NULL,
  key              text NOT NULL,
  request_hash     text NOT NULL,
  order_id         uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  lifecycle        text NOT NULL CHECK (lifecycle IN ('processing', 'completed')),
  status_code      int  NOT NULL DEFAULT 201,
  response_payload jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  expires_at       timestamptz NOT NULL,
  PRIMARY KEY (operation, principal_scope, key)
);

CREATE INDEX IF NOT EXISTS checkout_idempotency_keys_expires_at_idx
  ON public.checkout_idempotency_keys (expires_at);

-- 4. Tabla de Rate Limit (10 peticiones / 15 min por IP)
CREATE TABLE IF NOT EXISTS public.checkout_rate_windows (
  ip            inet NOT NULL,
  window_start  timestamptz NOT NULL,
  hit_count     int  NOT NULL DEFAULT 1,
  PRIMARY KEY (ip, window_start)
);

-- 5. Tabla de Auditoría Inmutable (sin PII)
CREATE TABLE IF NOT EXISTS public.audit_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    uuid,
  action      text NOT NULL CHECK (action IN (
    'checkout.create', 'order.create_admin', 'order.status', 
    'product.write', 'material.write', 'recipe.write', 
    'upload.write', 'stock.adjust'
  )),
  entity      text NOT NULL,
  entity_id   text,
  result      text NOT NULL CHECK (result IN ('ok', 'error')),
  request_id  text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 6. Libro Contable de Movimientos de Inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_material_id bigint NOT NULL REFERENCES public.raw_materials(id) ON DELETE RESTRICT,
  order_id        uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  type            text NOT NULL CHECK (type IN ('order_consumption', 'manual_adjustment')),
  quantity_delta  numeric(14,4) NOT NULL,
  stock_before    numeric(14,4) NOT NULL,
  stock_after     numeric(14,4) NOT NULL,
  reason          text,
  actor_id        uuid,
  request_id      text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS inventory_movements_one_consumption_per_order_material
  ON public.inventory_movements (order_id, raw_material_id)
  WHERE type = 'order_consumption';

-- 7. RLS estricto para tablas internas (solo accesible vía Service Role)
ALTER TABLE public.checkout_idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkout_rate_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
