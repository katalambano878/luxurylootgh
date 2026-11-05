# Luxury Loots GH: Supabase → plain Postgres cutover

Live site: `luxurylootgh.com` / `www.luxurylootgh.com` on Vercel (team
`barblanca`), data in Supabase project "Adjoa Thrift" (`dwcnpnambunujyhjzpvr`,
org "New All", eu-west-2). The project was paused (INACTIVE) and restored on
2026-11-05; pause it again only after the cutover is verified.

Target: big-vps (169.58.8.203), database `store_adjoa_thrift` on
`fleet-postgres`, images in `/data/coolify/luxuryloot/storage`, email through
Postal (`postal.zoepayhub.com`, server `luxuryloot`, domain luxurylootgh.com
verified: SPF, DKIM, return path).

Staging: <https://luxurylootgh-staging.169-58-8-203.sslip.io>, Coolify project
`luxurylootgh` (`zibcifbkqbs4zevxd2mklefi`), app `luxurylootgh-staging`
(`roebwtwltpw5jwnqmigx3syi`), branch `staging/plain-postgres`. Staging uses the
same database name and image folder production will use; step 3 replaces the
database with a fresh copy, so staging test data never reaches production.

Secrets (never commit, never print): `~/.config/coolify-vps/luxuryloot-pg-pw`,
`luxuryloot-staging-jwt`, `luxuryloot-jwt` (production), `luxuryloot-cron-secret`,
`luxuryloot-postal-api-key`, `luxuryloot-qa-logins` (staging test accounts only).

## Before the cutover (blockers)

- Moolre keys for this store (`MOOLRE_API_USER` = Moolre login username,
  `MOOLRE_API_PUBKEY`, `MOOLRE_ACCOUNT_NUMBER`, `MOOLRE_MERCHANT_EMAIL`,
  optional `MOOLRE_SMS_API_KEY`, `MOOLRE_CALLBACK_SECRET`). The Vercel export
  has them masked. No DNS flip without working payments.
- `ADMIN_EMAIL`: the owner's inbox for new-order and contact alerts.
- Optional: reCAPTCHA keys (`NEXT_PUBLIC_RECAPTCHA_SITE_KEY`, `RECAPTCHA_SECRET_KEY`).

## Cutover steps

1. **Stop staging** (`luxurylootgh-staging` in Coolify) so nothing writes to
   `store_adjoa_thrift`.
2. **Fresh copy from Supabase, verified** (operator machine, then big-vps):
   ```bash
   cd migration-artifacts && ./supabase_login.sh
   ssh big-vps 'cd /root/luxuryloot-migration && ./sync_from_supabase.sh final \
     && ./restore_to_fleet.sh final store_adjoa_thrift_final ""'
   ```
   Required: `PARITY OK`, `superuser-owned objects: 0`, `public tables WITHOUT
   row level security: none`, `SYNC OK` with 0 missing files. Any MISMATCH stops
   the cutover. Note the time printed in `dumps/lux_final.dumped_at`.
3. **Harden and swap** (nothing is connected):
   ```bash
   (echo "SET ROLE store_adjoa_thrift;"; cat supabase/migrations/20261105000000_security_hardening.sql) \
     | ssh big-vps 'docker exec -i fleet-postgres psql -U postgres -d store_adjoa_thrift_final -v ON_ERROR_STOP=1 -q'
   ```
   ```sql
   ALTER DATABASE store_adjoa_thrift RENAME TO store_adjoa_thrift_staging_<date>;
   ALTER DATABASE store_adjoa_thrift_final RENAME TO store_adjoa_thrift;
   ```
4. **Production app**: merge `staging/plain-postgres` into `main`, push, and
   point a Coolify app at `main` with domains `https://luxurylootgh.com,
   https://www.luxurylootgh.com`, the same settings as staging except:
   `AUTH_JWT_SECRET` / `STORAGE_SIGNING_SECRET` = production secret
   (`luxuryloot-jwt`), `NEXT_PUBLIC_APP_URL` / `STORAGE_PUBLIC_URL` =
   `https://www.luxurylootgh.com`, **no** `NOTIFY_ALLOWLIST`, plus the Moolre
   keys, `ADMIN_EMAIL`, `CRON_SECRET`. Same volume
   `/data/coolify/luxuryloot/storage` → `/app/storage`. Verify on its sslip
   host before DNS.
5. **DNS (Hostinger)**: A `@` → `169.58.8.203`; `www` CNAME → `luxurylootgh.com`
   (remove the Vercel records). Keep the TXT/DKIM/_dmarc/psrp email records.
   If Traefik serves the default certificate, restart `coolify-proxy`.
6. **Orders taken on Vercel after step 2**: compare Supabase `orders` with
   `created_at` after `lux_final.dumped_at` and copy any over by hand (the store
   averages far below one order a day, so this is normally empty).
7. **Verify on the live domain** (`diagnose-site.mjs` PASS, admin login with the
   owner's real password, a Moolre payment link for a test order, signup and
   reset emails arrive).
8. **Moolre dashboard**: callback URL `https://www.luxurylootgh.com/api/payment/moolre/callback`.
9. Pause the Supabase project again once everything is verified (rollback copy).

## Rollback

Point DNS back at Vercel (A `@` 216.198.79.1, `www` CNAME
`4851648f6e88c994.vercel-dns-017.com.`). Supabase holds everything up to step
2; orders taken on big-vps afterwards exist only in `store_adjoa_thrift`.
