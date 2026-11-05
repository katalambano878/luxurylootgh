import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What the "complete your payment" page (/pay/<order id>) shows. The link in
 * the payment-reminder email carries the order's random id, which is the
 * permission to see this summary; order numbers (guessable) are not accepted.
 * Only the fields the page needs are returned.
 */
export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
    const limit = checkRateLimit(`pay-page:${getClientIdentifier(request)}`, RATE_LIMITS.payment);
    if (!limit.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { id } = await ctx.params;
    if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, email, payment_status, status, subtotal, shipping_total, discount_total, total, shipping_address, metadata')
        .eq('id', id)
        .maybeSingle();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const shipping = (order.shipping_address || {}) as Record<string, unknown>;
    const meta = (order.metadata || {}) as Record<string, unknown>;
    return NextResponse.json({
        order: {
            id: order.id,
            order_number: order.order_number,
            email: order.email,
            payment_status: order.payment_status,
            status: order.status,
            subtotal: order.subtotal,
            shipping_total: order.shipping_total,
            discount_total: order.discount_total,
            total: order.total,
            shipping_address: { firstName: shipping.firstName, lastName: shipping.lastName },
            metadata: { first_name: meta.first_name, last_name: meta.last_name },
        },
    });
}
