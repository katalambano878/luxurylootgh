import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getUserForToken } from '@/lib/db/auth';
import { parseStorePricingValue, resolveCartLineUnitPrice } from '@/lib/pricing';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Create a storefront order. The browser sends only what the customer chose
 * (products, variants, quantities, delivery details); every price is read
 * from the database here, the order starts unpaid, and it is inserted with
 * the service role. Customers can no longer insert orders directly.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_LINES = 50;
const MAX_QTY = 100;

// Charged at checkout today: no shipping fee, no tax (delivery is arranged after payment).
const SHIPPING_COST = 0;
const TAX = 0;

type ShippingInput = {
    firstName: string; lastName: string; email: string; phone: string;
    address: string; city: string; region: string;
};

function str(v: unknown, max = 200): string {
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function bad(message: string, status = 400) {
    return NextResponse.json({ success: false, message }, { status });
}

export async function POST(request: Request) {
    const limit = checkRateLimit(`orders:${getClientIdentifier(request)}`, RATE_LIMITS.payment);
    if (!limit.success) return bad('Too many attempts. Please wait a minute and try again.', 429);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') return bad('Invalid request');

    const s = (body.shipping || {}) as Record<string, unknown>;
    const shipping: ShippingInput = {
        firstName: str(s.firstName, 80), lastName: str(s.lastName, 80),
        email: str(s.email, 160).toLowerCase(), phone: str(s.phone, 30),
        address: str(s.address, 300), city: str(s.city, 100), region: str(s.region, 60),
    };
    if (!shipping.firstName || !shipping.lastName || !shipping.address || !shipping.city || !shipping.region) {
        return bad('Please complete your delivery details.');
    }
    if (!/^\S+@\S+\.\S+$/.test(shipping.email)) return bad('Please enter a valid email address.');
    if (shipping.phone.replace(/\D/g, '').length < 9) return bad('Please enter a valid phone number.');

    const deliveryMethod = str(body.deliveryMethod, 40) || 'pickup';

    const rawItems: unknown[] = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) return bad('Your cart is empty.');
    if (rawItems.length > MAX_LINES) return bad('Too many items in one order.');

    const lines = rawItems.map((raw) => {
        const it = (raw || {}) as Record<string, unknown>;
        const qty = Number(it.quantity);
        return {
            ref: str(it.id, 200),
            variant: str(it.variant, 200) || null,
            quantity: Number.isInteger(qty) ? qty : NaN,
            name: str(it.name, 300),
            image: str(it.image, 1000) || null,
            slug: str(it.slug, 300) || null,
        };
    });
    if (lines.some((l) => !l.ref || !(l.quantity >= 1 && l.quantity <= MAX_QTY))) {
        return bad('One of the items in your cart is invalid. Please remove it and try again.');
    }

    // Signed-in customers: the order belongs to the account behind the token.
    const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
    const user = token ? await getUserForToken(token) : null;
    if (token && !user) return bad('Your session has expired. Please sign in again.', 401);

    // Resolve slugs (older carts) to product ids; only published products can be bought.
    const slugs = [...new Set(lines.filter((l) => !UUID_RE.test(l.ref)).map((l) => l.ref))];
    const ids = [...new Set(lines.filter((l) => UUID_RE.test(l.ref)).map((l) => l.ref))];
    const select = 'id, slug, name, status, price, sale_price, compare_at_price, metadata, product_variants(id, name, option1, option2, price, sale_price)';
    const found: any[] = [];
    if (ids.length) {
        const { data, error } = await supabaseAdmin.from('products').select(select).in('id', ids);
        if (error) return bad('Could not load products. Please try again.', 500);
        found.push(...(data || []));
    }
    if (slugs.length) {
        const { data, error } = await supabaseAdmin.from('products').select(select).in('slug', slugs);
        if (error) return bad('Could not load products. Please try again.', 500);
        found.push(...(data || []));
    }
    const byRef = new Map<string, any>();
    for (const p of found) {
        byRef.set(p.id, p);
        if (p.slug) byRef.set(p.slug, p);
    }

    const { data: pricingRow } = await supabaseAdmin
        .from('site_settings').select('value').eq('key', 'store_pricing').maybeSingle();
    const salesActive = parseStorePricingValue(pricingRow?.value).sales_active;

    let subtotal = 0;
    const itemsPayload: Record<string, unknown>[] = [];
    for (const l of lines) {
        const p = byRef.get(l.ref);
        if (!p || (p.status && p.status !== 'active')) {
            return bad(`"${l.name || 'An item'}" is no longer available. Please remove it and try again.`, 409);
        }
        const unit = resolveCartLineUnitPrice(p, l.variant, salesActive);
        if (!(unit > 0)) return bad(`"${p.name}" has no price set. Please contact the store.`, 409);
        const lineTotal = Math.round(unit * l.quantity * 100) / 100;
        subtotal += lineTotal;
        itemsPayload.push({
            product_id: p.id, product_name: p.name, variant_name: l.variant,
            quantity: l.quantity, unit_price: unit, total_price: lineTotal,
            metadata: { image: l.image, slug: p.slug, preorder_shipping: p.metadata?.preorder_shipping || null },
        });
    }
    subtotal = Math.round(subtotal * 100) / 100;
    const total = subtotal + SHIPPING_COST + TAX;

    const orderNumber = `ORD-${Date.now()}-${randomInt(100, 1000)}`;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const trackingNumber = `SLI-${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('')}`;

    const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert([{
        order_number: orderNumber, user_id: user?.id || null,
        email: shipping.email, phone: shipping.phone,
        status: 'pending', payment_status: 'pending', currency: 'GHS',
        subtotal, tax_total: TAX, shipping_total: SHIPPING_COST, discount_total: 0, total,
        shipping_method: deliveryMethod, payment_method: 'moolre',
        shipping_address: shipping, billing_address: shipping,
        metadata: {
            guest_checkout: !user,
            first_name: shipping.firstName, last_name: shipping.lastName,
            tracking_number: trackingNumber,
        },
    }]).select('id, order_number, total').single();
    if (orderError || !order) {
        console.error('[orders] insert failed:', orderError?.message);
        return bad('Could not create your order. Please try again.', 500);
    }

    const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(itemsPayload.map((row) => ({ ...row, order_id: order.id })));
    if (itemsError) {
        console.error('[orders] items insert failed:', itemsError.message);
        await supabaseAdmin.from('orders').delete().eq('id', order.id);
        return bad('Could not create your order. Please try again.', 500);
    }

    const { error: customerError } = await supabaseAdmin.rpc('upsert_customer_from_order', {
        p_email: shipping.email, p_phone: shipping.phone,
        p_full_name: `${shipping.firstName} ${shipping.lastName}`.trim(),
        p_first_name: shipping.firstName, p_last_name: shipping.lastName,
        p_user_id: user?.id || null, p_address: shipping,
    });
    if (customerError) console.error('[orders] customer upsert failed:', customerError.message);

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.order_number, total: order.total });
}
