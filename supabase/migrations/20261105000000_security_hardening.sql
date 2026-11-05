-- ============================================================================
-- Security hardening (2026-11-05), applied after the move to plain Postgres.
--
-- 1. Customers can no longer change their own profiles.role (privilege
--    escalation to admin).
-- 2. Owner-rights functions that change orders, stock or customer records, or
--    list every customer's email/phone, are server-only: the browser roles
--    lose EXECUTE. The app calls them through supabaseAdmin after its own
--    checks.
-- 3. Guest orders are no longer readable by anyone: guests look their order up
--    with get_order_by_number_and_email (order number + email), or through
--    the server.
-- 4. Customers no longer insert orders from the browser; /api/orders prices
--    the cart from the database and inserts as the service role. Staff (POS)
--    keep their policy.
-- 5. New reviews start as pending and customers cannot approve their own.
--
-- Written to be re-runnable. Role names: on Supabase they are anon /
-- authenticated; on fleet-postgres the restore re-points policies to the
-- store's own roles, so grants are revoked from whichever exist.
-- ============================================================================

-- 1. profiles.role is set only by admins or server code ------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Server code runs with the service_role claim (or as the table owner).
    IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
       OR current_user = (SELECT pg_get_userbyid(relowner) FROM pg_class WHERE oid = 'public.profiles'::regclass) THEN
      RETURN NEW;
    END IF;
    IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Only an administrator can change account roles' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_role_change ON public.profiles;
CREATE TRIGGER profiles_prevent_role_change
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 2. Server-only functions ----------------------------------------------------
DO $$
DECLARE
  f record;
  r text;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public'
       AND p.proname IN (
         'mark_order_paid', 'reduce_stock_on_order', 'update_customer_stats',
         'upsert_customer_from_order', 'get_all_customer_emails', 'get_all_customer_phones')
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', f.sig);
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated', 'luxuryloot_anon', 'luxuryloot_authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
        EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM %I', f.sig, r);
      END IF;
    END LOOP;
  END LOOP;
END $$;

-- 3. No public reads of guest orders -------------------------------------------
DROP POLICY IF EXISTS "Enable select for guest orders" ON public.orders;
DROP POLICY IF EXISTS "Enable select for guest order items" ON public.order_items;

-- 4. Orders are created by the server (customers) or by staff (POS) -----------
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
DROP POLICY IF EXISTS "Enable insert for order items" ON public.order_items;
-- "Staff manage all orders" / "Staff manage order items" (FOR ALL, is_admin_or_staff())
-- remain and cover the POS.

-- 5. Reviews: pending until staff approve -------------------------------------
DROP POLICY IF EXISTS "Users create reviews" ON public.reviews;
CREATE POLICY "Users create reviews" ON public.reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');
DROP POLICY IF EXISTS "Users update own reviews" ON public.reviews;
CREATE POLICY "Users update own reviews" ON public.reviews
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND status = 'pending');
