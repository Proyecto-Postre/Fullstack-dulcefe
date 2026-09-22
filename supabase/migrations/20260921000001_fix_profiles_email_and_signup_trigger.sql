-- Migration: 20260921000001_fix_profiles_email_and_signup_trigger.sql
-- Fix: Agregar columna email a public.profiles y robustecer función handle_new_user

-- 1. Agregar columna email a public.profiles si no existe
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Actualizar función trigger de creación de nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone, is_admin)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    email = COALESCE(EXCLUDED.email, profiles.email),
    phone = COALESCE(EXCLUDED.phone, profiles.phone);
  RETURN NEW;
END;
$$;

-- 3. Asegurar que storage.objects para payment-receipts tenga políticas explícitas con WITH CHECK
DROP POLICY IF EXISTS "Public Upload Payment Receipts" ON storage.objects;
CREATE POLICY "Public Upload Payment Receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Service Role Full Access Payment Receipts" ON storage.objects;
CREATE POLICY "Service Role Full Access Payment Receipts"
  ON storage.objects FOR ALL
  USING (bucket_id = 'payment-receipts')
  WITH CHECK (bucket_id = 'payment-receipts');
