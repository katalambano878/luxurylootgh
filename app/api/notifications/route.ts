import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyAuth } from '@/lib/auth';
import { query } from '@/lib/db/pool';
import { escapeHtml } from '@/lib/sanitize';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendWelcomeMessage, sendContactMessage, sendPaymentLink, sendEmail, sendSMS, emailLayout } from '@/lib/notifications';
import { checkRateLimit, getClientIdentifier, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: Request) {
    try {
        // Rate limiting
        const clientId = getClientIdentifier(request);
        const rateLimitResult = checkRateLimit(`notification:${clientId}`, RATE_LIMITS.notification);

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': rateLimitResult.resetIn.toString()
                    }
                }
            );
        }

        const body = await request.json();
        const { type, payload } = body;

        if (!type || !payload) {
            return NextResponse.json({ error: 'Type and payload required' }, { status: 400 });
        }

        // ============================================================
        // SECURITY: Authentication requirements
        // Admin-only types require admin auth token
        // 'order_created' requires a valid order to exist (verified below)
        // 'contact' is public but rate-limited
        // ============================================================
        // order_created: confirmations to customers go out automatically when an
        // order is paid; this manual resend is for staff only.
        // welcome: public for a brand-new account (checked below), else staff.
        const adminOnlyTypes = ['campaign', 'order_created', 'order_updated', 'order_status', 'payment_link'];
        const requiresAdminAuth = adminOnlyTypes.includes(type);

        if (requiresAdminAuth) {
            const auth = await verifyAuth(request, { requireAdmin: true });
            if (!auth.authenticated) {
                return NextResponse.json({ error: auth.error || 'Unauthorized' }, { status: 401 });
            }
        }

        // ============================================================
        // order_created — verify the order exists in the database
        // ============================================================
        if (type === 'order_created') {
            const orderRef = String(payload.order_number || '');
            if (!/^ORD-\d+-\d+$/.test(orderRef)) {
                return NextResponse.json({ error: 'Missing or invalid order number' }, { status: 400 });
            }
            // Send from the stored order, never from caller-supplied fields.
            const { data: order } = await supabaseAdmin
                .from('orders')
                .select('*')
                .eq('order_number', orderRef)
                .maybeSingle();
            if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            await sendOrderConfirmation(order);
            return NextResponse.json({ success: true, message: 'Order confirmation sent' });
        }

        if (type === 'order_updated') {
            const { order, status } = payload;
            if (!order || !status) {
                return NextResponse.json({ error: 'Missing order or status' }, { status: 400 });
            }
            await sendOrderStatusUpdate(order, status);
            return NextResponse.json({ success: true, message: 'Status update sent' });
        }

        // Handle order_status from admin panel
        if (type === 'order_status') {
            const { email, name, orderNumber, status, trackingNumber, phone } = payload;

            if (!orderNumber || !status) {
                return NextResponse.json({ error: 'Missing orderNumber or status' }, { status: 400 });
            }

            // Fetch full order data
            const { data: fullOrder } = await supabaseAdmin
                .from('orders')
                .select('id, order_number, email, phone, shipping_address, metadata')
                .eq('order_number', orderNumber)
                .single();

            const orderData = fullOrder || {
                order_number: orderNumber,
                email: email,
                phone: phone,
                shipping_address: { firstName: name, phone: phone },
                metadata: { tracking_number: trackingNumber }
            };

            if (!orderData.phone && phone) {
                orderData.phone = phone;
            }

            await sendOrderStatusUpdate(orderData, status);
            return NextResponse.json({ success: true, message: 'Status update sent' });
        }

        if (type === 'welcome') {
            const email = String(payload.email || '').trim().toLowerCase();
            if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });
            // Only to an account created in the last 15 minutes, once, using the
            // name stored on the account (the caller cannot choose who gets it).
            const { rows } = await query<{ id: string; first_name: string | null }>(
                `UPDATE auth.users
                    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"welcome_sent": true}'::jsonb
                  WHERE lower(email) = $1
                    AND created_at > now() - interval '15 minutes'
                    AND coalesce(raw_app_meta_data->>'welcome_sent', '') <> 'true'
                    AND deleted_at IS NULL
              RETURNING id, raw_user_meta_data->>'first_name' AS first_name`,
                [email]
            );
            if (rows[0]) {
                await sendWelcomeMessage({ email, firstName: rows[0].first_name || '' });
            }
            return NextResponse.json({ success: true, message: 'Welcome message processed' });
        }

        // ============================================================
        // contact — public but strictly validated and rate-limited
        // ============================================================
        if (type === 'contact') {
            const { name, email, subject, message } = payload;
            if (!name || !email || !subject || !message) {
                return NextResponse.json({ error: 'All contact fields required' }, { status: 400 });
            }
            // Basic email format check
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
            }
            // Length limits to prevent abuse
            if (name.length > 100 || subject.length > 200 || message.length > 5000) {
                return NextResponse.json({ error: 'Input too long' }, { status: 400 });
            }
            await sendContactMessage(payload);
            return NextResponse.json({ success: true, message: 'Contact message sent' });
        }

        if (type === 'payment_link') {
            if (!payload.id || !payload.order_number) {
                return NextResponse.json({ error: 'Missing order details' }, { status: 400 });
            }
            await sendPaymentLink(payload);
            return NextResponse.json({ success: true, message: 'Payment link sent' });
        }

        // ============================================================
        // campaign — admin only, with HTML sanitization
        // ============================================================
        if (type === 'campaign') {
            const { recipients, subject, message, channels } = payload;

            if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
                return NextResponse.json({ error: 'Recipients required' }, { status: 400 });
            }
            if (!subject || !message) {
                return NextResponse.json({ error: 'Subject and message required' }, { status: 400 });
            }

            // Deduplicate phone numbers and emails server-side
            const seenPhones = new Set<string>();
            const seenEmails = new Set<string>();
            const results = { email: 0, sms: 0, errors: 0 };

            // SECURITY: Sanitize subject and message to prevent XSS in emails
            const safeSubject = escapeHtml(subject);
            const safeMessage = escapeHtml(message);

            for (const recipient of recipients) {
                try {
                    // Send email (skip duplicates)
                    if (channels?.email && recipient.email) {
                        const emailKey = recipient.email.toLowerCase().trim();
                        if (!seenEmails.has(emailKey)) {
                            seenEmails.add(emailKey);
                            const recipientName = escapeHtml(recipient.name || 'Valued Customer');
                            const brandedHtml = emailLayout(`
<h2 style="margin:0 0 16px;color:#111827;font-size:22px;text-align:center;">${safeSubject}</h2>
<p style="color:#374151;font-size:14px;line-height:1.7;margin:16px 0;">Hi ${recipientName},</p>
<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">${safeMessage.replace(/\n/g, '</p><p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">')}</p>
`, safeSubject);
                            await sendEmail({
                                to: recipient.email,
                                subject: subject, // Keep original for email subject header
                                html: brandedHtml
                            });
                            results.email++;
                        }
                    }

                    // Send SMS (skip duplicates)
                    if (channels?.sms && recipient.phone) {
                        const phoneKey = recipient.phone.replace(/[\s\-\(\)\.]+/g, '');
                        if (!seenPhones.has(phoneKey)) {
                            seenPhones.add(phoneKey);
                            await sendSMS({
                                to: recipient.phone,
                                message: message // SMS is plain text, no XSS risk
                            });
                            results.sms++;
                        }
                    }
                } catch (err: any) {
                    console.error(`[Campaign] Failed for ${recipient.email || recipient.phone}:`, err.message);
                    results.errors++;
                }
            }

            return NextResponse.json({
                success: true,
                message: `Campaign sent: ${results.email} emails, ${results.sms} SMS.${results.errors > 0 ? ` (${results.errors} failed)` : ''}`
            });
        }

        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });

    } catch (error: any) {
        console.error('Notification API Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
