import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { ORDER_NUMBER_RE, settlePaidOrder } from '@/lib/moolre';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Staff confirm a payment received outside Moolre (mobile money to the shop
 * number, bank transfer, cash on delivery). Same path as an online payment:
 * stock is reduced once, customer totals updated and the receipt sent.
 */
export async function POST(request: Request) {
    const auth = await verifyAuth(request, { requireAdmin: true });
    if (!auth.authenticated) return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const orderNumber = String(body.orderNumber || '');
    if (!ORDER_NUMBER_RE.test(orderNumber)) return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });

    const result = await settlePaidOrder(orderNumber, `MANUAL-${auth.user?.id || 'staff'}`);
    if (!result.settled && !result.alreadyPaid) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    return NextResponse.json({ success: true, alreadyPaid: result.alreadyPaid });
}
