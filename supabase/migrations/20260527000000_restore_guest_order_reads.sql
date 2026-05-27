-- ============================================================================
-- RESTORE GUEST ORDER READS (HOTFIX)
-- Date: 2026-05-27
--
-- The previous migration `20260425000000_fix_rls_vulnerabilities.sql` dropped
-- the "Enable select for guest orders" and "Enable select for guest order
-- items" policies to close a data-exposure vulnerability. That change
-- inadvertently broke the live checkout flow because:
--
--   1. checkout/page.tsx does `.insert(...).select().single()` to read back
--      the inserted order so it can use the returned `id` for order_items.
--      Without a SELECT policy for guests, the returning select gets nothing.
--
--   2. The `order_items` INSERT policy contains
--          EXISTS (SELECT 1 FROM orders WHERE ...)
--      and that subquery is subject to the orders SELECT policies. With no
--      guest SELECT policy, the EXISTS check fails and guest order_items
--      inserts are rejected.
--
--   3. order-success/page.tsx reads the order directly via
--      `supabase.from('orders')` to display the confirmation page.
--
-- Re-adding the broad guest-readable policy restores the live site behaviour
-- that the storefront already depends on. The longer-term fix is to migrate
-- the checkout/order-success flows to a SECURITY DEFINER RPC (see
-- `get_order_by_number_and_email` for the pattern) so guests don't need a
-- table-level SELECT policy.
-- ============================================================================

-- Re-create the guest SELECT policy on orders.
DROP POLICY IF EXISTS "Enable select for guest orders" ON public.orders;
CREATE POLICY "Enable select for guest orders"
  ON public.orders
  FOR SELECT
  USING (user_id IS NULL);

-- Re-create the guest SELECT policy on order_items.
DROP POLICY IF EXISTS "Enable select for guest order items" ON public.order_items;
CREATE POLICY "Enable select for guest order items"
  ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
        AND orders.user_id IS NULL
    )
  );
