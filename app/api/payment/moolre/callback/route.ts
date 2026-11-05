import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';
import { confirmMoolrePayment, ORDER_NUMBER_RE, settlePaidOrder } from '@/lib/moolre';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Moolre payment callback. Moolre posts something like:
 *   { status: 1, message: "Transaction Successful", secret: "...",
 *     data: { txtstatus: 1, amount: "2", transactionid: "42252702",
 *             externalref: "ORD-1770330034217-441-R1770330000000", ... } }
 *
 * The body is only a hint that something happened. An order is marked paid
 * only after Moolre's status API confirms the payment for the order's total
 * (confirmMoolrePayment), so a forged callback cannot mark an order paid.
 */

function secretMatches(incoming: unknown, expected: string): boolean {
    if (typeof incoming !== 'string') return false;
    const a = Buffer.from(incoming);
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
}

async function readBody(req: Request): Promise<any> {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) return req.json();
    if (contentType.includes('form')) return Object.fromEntries((await req.formData()).entries());
    const raw = await req.text();
    try {
        return JSON.parse(raw);
    } catch {
        return Object.fromEntries(new URLSearchParams(raw).entries());
    }
}

export async function POST(req: Request) {
    const limit = checkRateLimit(`callback:${getClientIdentifier(req)}`, RATE_LIMITS.callback);
    if (!limit.success) return NextResponse.json({ success: false, message: 'Too many requests' }, { status: 429 });

    let body: any;
    try {
        body = (await readBody(req)) || {};
    } catch {
        return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
    }

    // The secret is logged, not enforced: Moolre's status API below is what
    // decides, so a secret that drifted from Moolre's dashboard never blocks a
    // real payment, and a forged callback still cannot mark anything paid.
    const expectedSecret = process.env.MOOLRE_CALLBACK_SECRET;
    if (expectedSecret && !secretMatches(body.secret, expectedSecret)) {
        console.warn('[Callback] Callback secret missing or different from MOOLRE_CALLBACK_SECRET');
    }

    const data = body.data || {};
    const rawExternalRef = String(data.externalref || body.externalref || '').trim();
    const orderNumber = rawExternalRef.replace(/-R\d+$/, '');
    if (!ORDER_NUMBER_RE.test(orderNumber)) {
        return NextResponse.json({ success: false, message: 'Missing or invalid order reference' }, { status: 400 });
    }
    const moolreRef = String(data.transactionid || data.thirdpartyref || 'callback').slice(0, 100);

    try {
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, order_number, payment_status, total, metadata')
            .eq('order_number', orderNumber)
            .maybeSingle();
        if (!order) return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
        if (order.payment_status === 'paid') {
            return NextResponse.json({ success: true, message: 'Order already processed' });
        }

        const externalRef = order.metadata?.moolre_externalref || rawExternalRef;
        const check = await confirmMoolrePayment(externalRef, Number(order.total));

        if (check.paid) {
            const result = await settlePaidOrder(orderNumber, moolreRef);
            console.log('[Callback] Order', orderNumber, result.settled ? 'marked paid' : 'already paid');
            return NextResponse.json({ success: true, message: 'Payment verified' });
        }

        // Not confirmed. Record an explicit failure from Moolre for the
        // dashboard, but never downgrade an order that is (or just became) paid.
        const txStatus = String(data.txtstatus ?? '');
        if (txStatus === '0' || txStatus === '-1') {
            await supabaseAdmin
                .from('orders')
                .update({
                    payment_status: 'failed',
                    metadata: {
                        ...(order.metadata || {}),
                        moolre_reference: moolreRef,
                        failure_reason: String(body.message || 'Payment failed').slice(0, 200),
                    },
                })
                .eq('order_number', orderNumber)
                .neq('payment_status', 'paid');
        }
        console.log('[Callback] Not marking', orderNumber, 'paid:', check.reason);
        return NextResponse.json({ success: false, message: 'Payment not confirmed' });
    } catch (e: any) {
        console.error('[Callback] Error:', e.message);
        return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ message: 'Moolre callback endpoint ready' });
}
