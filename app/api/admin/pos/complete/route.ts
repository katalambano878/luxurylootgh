import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ORDER_NUMBER_RE, settlePaidOrder } from '@/lib/moolre';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Finish a POS sale after the till has created the (unpaid) order: record the
 * customer and, for cash or card, mark the order paid, which reduces stock,
 * updates customer totals and emails a receipt to a real address. Staff only;
 * these database functions are not callable from the browser.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request, { requireAdmin: true });
    if (!auth.authenticated) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const orderNumber = String(body.orderNumber || '');
    if (!ORDER_NUMBER_RE.test(orderNumber)) return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });

    const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, metadata')
        .eq('order_number', orderNumber)
        .maybeSingle();
    if (!order || !order.metadata?.pos_sale) {
        return NextResponse.json({ error: 'POS order not found' }, { status: 404 });
    }

    const c = body.customer || {};
    if (c.email) {
        const { error } = await supabaseAdmin.rpc('upsert_customer_from_order', {
            p_email: String(c.email),
            p_phone: c.phone ? String(c.phone) : null,
            p_full_name: c.fullName ? String(c.fullName) : null,
            p_first_name: c.firstName ? String(c.firstName) : null,
            p_last_name: c.lastName ? String(c.lastName) : null,
            p_user_id: null,
            p_address: c.address && typeof c.address === 'object' ? c.address : null,
        });
        if (error) console.error('[POS] customer upsert failed:', error.message);
    }

    if (body.markPaid) {
        const method = String(body.paymentMethod || 'cash').replace(/[^a-z]/gi, '').toUpperCase() || 'CASH';
        const result = await settlePaidOrder(orderNumber, `POS-${method}-${Date.now()}`);
        if (!result.settled && !result.alreadyPaid) {
            return NextResponse.json({ error: 'Could not mark the order paid' }, { status: 500 });
        }
    }
    return NextResponse.json({ success: true });
}
