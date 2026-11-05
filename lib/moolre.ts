import { getPool } from '@/lib/db/pool';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendOrderConfirmation } from '@/lib/notifications';

export const ORDER_NUMBER_RE = /^ORD-\d+-\d+$/;

/**
 * Ask Moolre whether the payment behind `externalRef` succeeded for exactly
 * `expectedAmount`. This is the only proof of payment the store accepts: a
 * callback body or a redirect flag can be forged, Moolre's status API cannot.
 */
export async function confirmMoolrePayment(
    externalRef: string,
    expectedAmount: number
): Promise<{ paid: boolean; reason?: string }> {
    const user = process.env.MOOLRE_API_USER;
    const key = process.env.MOOLRE_API_PUBKEY;
    if (!user || !key) return { paid: false, reason: 'Moolre credentials not configured' };

    try {
        const res = await fetch('https://api.moolre.com/embed/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-USER': user, 'X-API-PUBKEY': key },
            body: JSON.stringify({ externalref: externalRef }),
            cache: 'no-store',
        });
        const raw = await res.text();
        let body: any;
        try {
            body = JSON.parse(raw);
        } catch {
            return { paid: false, reason: `Moolre returned a non-JSON response (${res.status})` };
        }
        const status = String(body?.data?.status || '').toLowerCase();
        const ok = body?.status === 1 && ['success', 'successful', 'completed', 'paid'].includes(status);
        if (!ok) return { paid: false, reason: 'Payment not confirmed by Moolre' };
        const paid = parseFloat(body.data.amount);
        if (!Number.isFinite(paid) || Math.abs(paid - expectedAmount) > 0.01) {
            return { paid: false, reason: `Amount mismatch (expected ${expectedAmount}, got ${body.data.amount})` };
        }
        return { paid: true };
    } catch (e: any) {
        return { paid: false, reason: `Moolre status check failed: ${e.message}` };
    }
}

/**
 * Mark an order paid exactly once. The order row is locked, so a Moolre
 * callback and the customer's return page arriving together cannot both
 * settle it: only the caller that changes it from unpaid to paid updates
 * customer stats and sends the confirmation.
 */
export async function settlePaidOrder(
    orderNumber: string,
    moolreRef: string
): Promise<{ settled: boolean; alreadyPaid: boolean; order: any | null }> {
    const client = await getPool().connect();
    let order: any = null;
    try {
        await client.query('BEGIN');
        const { rows } = await client.query(
            `SELECT payment_status FROM orders WHERE order_number = $1 FOR UPDATE`,
            [orderNumber]
        );
        if (!rows[0]) {
            await client.query('ROLLBACK');
            return { settled: false, alreadyPaid: false, order: null };
        }
        if (rows[0].payment_status === 'paid') {
            await client.query('ROLLBACK');
            return { settled: false, alreadyPaid: true, order: null };
        }
        const res = await client.query(`SELECT public.mark_order_paid($1, $2) AS order_json`, [orderNumber, moolreRef]);
        order = res.rows[0]?.order_json ?? null;
        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK').catch(() => {});
        throw e;
    } finally {
        client.release();
    }

    if (order?.email) {
        const { error } = await supabaseAdmin.rpc('update_customer_stats', {
            p_customer_email: order.email,
            p_order_total: order.total,
        });
        if (error) console.error('[Payment] Customer stats failed:', error.message);
    }
    if (order) {
        try {
            await sendOrderConfirmation(order);
        } catch (e: any) {
            console.error('[Payment] Confirmation failed:', e.message);
        }
    }
    return { settled: true, alreadyPaid: false, order };
}
