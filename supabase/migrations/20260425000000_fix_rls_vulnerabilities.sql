-- ============================================================================
-- RLS VULNERABILITY FIXES
-- Date: 2026-04-25
--
-- Fixes 4 security issues found in the original schema:
--
-- 1. CRITICAL: Guest orders are world-readable by any anonymous user
-- 2. HIGH:     Any user (even anonymous) can update store_modules feature flags
-- 3. MEDIUM:   Users have no INSERT policy on return_items (breaks returns flow)
-- 4. MEDIUM:   Admin/staff cannot INSERT notifications for other users
-- ============================================================================


-- ============================================================================
-- FIX 1 (CRITICAL): Guest orders world-readable
--
-- The original policy "Enable select for guest orders" lets ANY unauthenticated
-- caller read ALL guest orders with no filter:
--   SELECT * FROM orders WHERE user_id IS NULL
-- This exposes every guest customer's name, address, phone, items, and payment
-- status to anyone with the anon key.
--
-- Fix: Remove the open policy. Replace guest order lookup with a SECURITY
-- DEFINER function that verifies both order_number AND email before returning
-- data. The client calls the function instead of querying the table directly.
-- ============================================================================

DROP POLICY IF EXISTS "Enable select for guest orders" ON public.orders;
DROP POLICY IF EXISTS "Enable select for guest order items" ON public.order_items;

-- Secure RPC: returns an order only when BOTH order_number AND email match.
-- Handles both guest orders (user_id IS NULL) and authenticated user orders.
-- SECURITY DEFINER runs as the function owner so we control access entirely —
-- the caller never touches the orders table directly.
--
-- Security properties:
--   - Email is verified SERVER-SIDE before any data is returned
--   - Identical error for "not found" and "wrong email" (prevents enumeration)
--   - Works for both guest and logged-in customers
CREATE OR REPLACE FUNCTION public.get_order_by_number_and_email(
  p_order_number text,
  p_email        text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order   orders;
  v_items   jsonb;
BEGIN
  IF p_order_number IS NULL OR trim(p_order_number) = ''
     OR p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('error', 'order_number and email are required');
  END IF;

  SELECT * INTO v_order
  FROM orders
  WHERE order_number = trim(p_order_number)
    AND lower(email)  = lower(trim(p_email))
  LIMIT 1;

  IF v_order.id IS NULL THEN
    RETURN jsonb_build_object('error', 'Order not found');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id',           oi.id,
      'product_name', oi.product_name,
      'variant_name', oi.variant_name,
      'quantity',     oi.quantity,
      'unit_price',   oi.unit_price,
      'total_price',  oi.total_price,
      'metadata',     oi.metadata
    )
  )
  INTO v_items
  FROM order_items oi
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object(
    'order', row_to_json(v_order),
    'items', COALESCE(v_items, '[]'::jsonb)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_order_by_number_and_email(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_order_by_number_and_email(text, text) TO authenticated;


-- ============================================================================
-- FIX 2 (HIGH): store_modules UPDATE open to any user including anonymous
--
-- Original policy:
--   USING (auth.role() = 'authenticated' OR auth.role() = 'anon')
-- This lets a random visitor toggle your feature flags (payments, reviews, etc).
--
-- Fix: Restrict UPDATE to admin/staff only, matching the INSERT policy pattern.
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated update" ON public.store_modules;

CREATE POLICY "Allow admin update on store_modules"
  ON public.store_modules
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );


-- ============================================================================
-- FIX 3 (MEDIUM): return_items has no INSERT policy for regular users
--
-- The original schema has SELECT for users and ALL for staff, but no INSERT
-- for customers. When a customer submits a return, the return_items rows
-- cannot be inserted — the flow silently fails.
--
-- Fix: Add an INSERT policy that lets users insert items for their own
-- return requests.
-- ============================================================================

CREATE POLICY "Users insert own return items"
  ON public.return_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM return_requests
      WHERE return_requests.id = return_items.return_request_id
        AND return_requests.user_id = auth.uid()
    )
  );


-- ============================================================================
-- FIX 4 (MEDIUM): notifications INSERT locked to self — admin cannot notify users
--
-- The original policy:
--   FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
-- means only a user can write to their own notification row. Admin/staff
-- cannot send notifications to customers, which breaks the notification system.
--
-- Fix: Add a separate INSERT policy for admin/staff.
-- ============================================================================

CREATE POLICY "Staff insert notifications for users"
  ON public.notifications
  FOR INSERT
  WITH CHECK (is_admin_or_staff());


-- ============================================================================
-- VERIFICATION QUERIES
-- Run these in the SQL editor after applying — all should return > 0 rows.
-- ============================================================================

-- Check all 4 new/replaced policies exist:
-- SELECT policyname FROM pg_policies
-- WHERE tablename IN ('orders','order_items','store_modules','return_items','notifications')
--   AND policyname IN (
--     'Allow admin update on store_modules',
--     'Users insert own return items',
--     'Staff insert notifications for users'
--   );

-- Confirm the dangerous open policies are gone:
-- SELECT policyname FROM pg_policies
-- WHERE policyname IN (
--     'Enable select for guest orders',
--     'Enable select for guest order items',
--     'Allow authenticated update'
--   );
-- Should return 0 rows.
