'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function OrderTrackingContent() {
  const searchParams  = useSearchParams();
  const urlOrderNumber = searchParams.get('order') || '';
  const urlEmail       = searchParams.get('email') || '';

  const [orderNumber, setOrderNumber] = useState(urlOrderNumber);
  const [email,       setEmail]       = useState('');
  const [isTracking,  setIsTracking]  = useState(false);
  const [order,       setOrder]       = useState<any>(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const fetchOrder = useCallback(async (orderNum: string, verifyEmail?: string) => {
    const emailToVerify = verifyEmail || email;
    if (!emailToVerify) { setError('Please enter your email address to verify your identity.'); return; }

    setLoading(true);
    setError('');

    try {
      // Use server-side RPC: email is verified on the server before any data
      // is returned, preventing client-side enumeration attacks.
      const { data, error: rpcError } = await supabase.rpc(
        'get_order_by_number_and_email',
        { p_order_number: orderNum.trim(), p_email: emailToVerify.trim() }
      );

      if (rpcError || !data || data.error) {
        setError('Order not found. Please check your order number and email address.');
        setIsTracking(false);
        return;
      }

      // Merge order + items into the shape the rest of the component expects
      const orderData = {
        ...data.order,
        order_items: data.items || [],
      };

      setOrder(orderData);
      setIsTracking(true);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    if (urlOrderNumber && urlEmail) { setEmail(urlEmail); fetchOrder(urlOrderNumber, urlEmail); }
  }, [urlOrderNumber, urlEmail, fetchOrder]);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!orderNumber) { setError('Please enter your order number'); return; }
    if (!email)       { setError('Please enter your email address for verification'); return; }
    fetchOrder(orderNumber, email);
  };

  const getTrackingSteps = () => {
    if (!order) return [];
    const status       = order.status       || 'pending';
    const paymentStatus = order.payment_status || 'pending';
    const statusOrder  = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return [
      {
        key: 'placed', title: 'Order Placed', description: 'Your order has been confirmed',
        date: new Date(order.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        icon: 'ri-checkbox-circle-line', status: 'completed' as const,
      },
      {
        key: 'payment', title: 'Payment', description: paymentStatus === 'paid' ? 'Payment confirmed' : 'Awaiting payment',
        date: paymentStatus === 'paid'
          ? (order.metadata?.payment_verified_at
            ? new Date(order.metadata.payment_verified_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : 'Confirmed')
          : 'Pending',
        icon: 'ri-bank-card-line',
        status: paymentStatus === 'paid' ? 'completed' as const : 'pending' as const,
      },
      {
        key: 'processing', title: 'Processing', description: 'Your order is being prepared',
        date: currentIndex >= 1 ? 'In progress' : 'Pending',
        icon: 'ri-box-3-line',
        status: currentIndex >= 1 ? 'completed' as const : currentIndex === 0 && paymentStatus === 'paid' ? 'active' as const : 'pending' as const,
      },
      {
        key: 'shipped', title: 'Packaged', description: 'Your order has been packaged',
        date: currentIndex >= 2 ? 'Packaged' : 'Pending',
        icon: 'ri-truck-line',
        status: currentIndex >= 2 ? 'completed' as const : currentIndex === 1 ? 'active' as const : 'pending' as const,
      },
      {
        key: 'delivered', title: 'Delivered', description: 'Your order has been delivered',
        date: currentIndex >= 3 ? 'Delivered' : 'Pending',
        icon: 'ri-home-smile-line',
        status: currentIndex >= 3 ? 'completed' as const : currentIndex === 2 ? 'active' as const : 'pending' as const,
      },
    ];
  };

  const getStatusBadge = () => {
    if (!order) return { label: 'Unknown', dark: false };
    const map: Record<string, { label: string; dark: boolean }> = {
      pending:    { label: 'Pending',    dark: false },
      processing: { label: 'Processing', dark: false },
      shipped:    { label: 'Packaged',   dark: false },
      delivered:  { label: 'Delivered',  dark: true  },
      cancelled:  { label: 'Cancelled',  dark: false },
    };
    return map[order.status] || { label: order.status, dark: false };
  };

  // ── SEARCH FORM ─────────────────────────────────────────────
  if (!isTracking || !order) {
    return (
      <main className="min-h-screen bg-white">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        <div className="max-w-xl mx-auto px-4 sm:px-6 py-14 lg:py-20">

          {/* Heading */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-amber-400" />
              <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">Order Status</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl leading-tight">
              <span className="italic text-stone-900">Track your </span>
              <span className="italic text-stone-400 font-light">order.</span>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleTrack} className="space-y-8 mb-10">
            <div>
              <label className="block text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-3">
                Order or Tracking Number
              </label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                className="w-full pb-3 border-b border-stone-200 focus:border-stone-900 bg-transparent text-stone-900 text-sm outline-none transition-colors placeholder:text-stone-300"
                placeholder="e.g. ORD-1770328211911-915 or SLI-ABC123"
              />
            </div>

            <div>
              <label className="block text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-3">
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pb-3 border-b border-stone-200 focus:border-stone-900 bg-transparent text-stone-900 text-sm outline-none transition-colors placeholder:text-stone-300"
                placeholder="you@example.com"
                required
              />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                <i className="ri-error-warning-line text-red-500 flex-shrink-0 mt-0.5"></i>
                <p className="text-xs text-red-600 leading-relaxed">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
            >
              {loading
                ? <><i className="ri-loader-4-line animate-spin text-base"></i> Searching…</>
                : <><i className="ri-radar-line text-base"></i> Track Order</>
              }
            </button>
          </form>

          {/* Help card */}
          <div className="bg-stone-950 rounded-2xl p-6 relative overflow-hidden">
            <div aria-hidden="true"
              className="absolute -right-3 -bottom-4 font-serif italic text-white/[0.04] leading-none pointer-events-none select-none text-[8rem]">?</div>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-4">
              <i className="ri-information-line text-base text-amber-400"></i>
            </div>
            <p className="text-[9px] font-black tracking-[0.45em] uppercase text-amber-400 mb-2">Need Help?</p>
            <p className="text-stone-400 text-xs leading-relaxed">
              Your order number and tracking number are in the SMS and email we sent after your order was confirmed.
            </p>
          </div>

        </div>
      </main>
    );
  }

  // ── ORDER RESULTS ────────────────────────────────────────────
  const trackingSteps    = getTrackingSteps();
  const statusBadge      = getStatusBadge();
  const trackingNumber   = order.metadata?.tracking_number || '';
  const shippingAddress  = order.shipping_address || {};
  const estimatedDelivery = new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen bg-white">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 lg:py-14">

        {/* Back */}
        <button
          onClick={() => { setIsTracking(false); setOrder(null); setOrderNumber(''); setEmail(''); }}
          className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors group mb-10 cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm group-hover:-translate-x-0.5 transition-transform"></i>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Track Another</span>
        </button>

        <div className="grid lg:grid-cols-[1fr_320px] gap-8">

          {/* Left: timeline + items */}
          <div className="space-y-6">

            {/* Order header card */}
            <div className="bg-stone-950 rounded-2xl p-7">
              <div className="flex items-start justify-between mb-6 gap-4">
                <div>
                  <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-600 mb-1">Order</p>
                  <p className="font-serif text-xl italic text-white leading-tight">{order.order_number}</p>
                  {trackingNumber && (
                    <p className="text-stone-500 text-xs mt-1 font-mono">{trackingNumber}</p>
                  )}
                  <p className="text-stone-600 text-xs mt-1">Est. delivery: {estimatedDelivery}</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-[9px] font-black tracking-[0.3em] uppercase flex-shrink-0 ${
                  statusBadge.dark ? 'bg-amber-400 text-stone-950' : 'bg-white/10 text-stone-300'
                }`}>
                  {statusBadge.label}
                </div>
              </div>

              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: 'ri-map-pin-line',           label: 'Shipping To', value: shippingAddress.city || shippingAddress.region || 'Ghana' },
                  { icon: 'ri-money-cny-circle-line',  label: 'Total',       value: `GH₵ ${Number(order.total).toFixed(2)}` },
                  { icon: 'ri-box-3-line',             label: 'Items',       value: `${order.order_items?.length || 0} product${(order.order_items?.length || 0) !== 1 ? 's' : ''}` },
                ].map((s, i) => (
                  <div key={i} className="bg-white/[0.04] rounded-xl p-3">
                    <i className={`${s.icon} text-sm text-amber-400 block mb-1.5`}></i>
                    <p className="text-[9px] text-stone-600 font-bold tracking-wider uppercase mb-0.5">{s.label}</p>
                    <p className="text-white text-xs font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white border border-stone-100 rounded-2xl p-7">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400 mb-6">Tracking Timeline</p>
              <div className="space-y-0">
                {trackingSteps.map((step, i) => (
                  <div key={step.key} className="flex gap-5 pb-7 last:pb-0 relative">
                    {i < trackingSteps.length - 1 && (
                      <div className={`absolute left-[18px] top-10 bottom-0 w-px ${
                        step.status === 'completed' ? 'bg-amber-400' : 'bg-stone-100'
                      }`} />
                    )}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                      step.status === 'completed' ? 'bg-amber-400' :
                      step.status === 'active'    ? 'bg-stone-950 ring-2 ring-stone-200' :
                      'bg-stone-100'
                    }`}>
                      <i className={`${step.icon} text-sm ${
                        step.status === 'completed' ? 'text-stone-950' :
                        step.status === 'active'    ? 'text-amber-400' :
                        'text-stone-400'
                      }`}></i>
                    </div>
                    <div className="pt-1">
                      <p className={`text-xs font-bold ${step.status === 'pending' ? 'text-stone-300' : 'text-stone-900'}`}>
                        {step.title}
                      </p>
                      <p className={`text-xs mt-0.5 ${step.status === 'pending' ? 'text-stone-300' : 'text-stone-500'}`}>
                        {step.description}
                      </p>
                      <p className={`text-[10px] mt-0.5 font-bold ${step.status === 'pending' ? 'text-stone-200' : 'text-amber-600'}`}>
                        {step.date}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order items */}
            <div className="bg-white border border-stone-100 rounded-2xl p-7">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400 mb-6">Order Items</p>
              <div className="space-y-4">
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-stone-50">
                    <div className="w-14 h-14 rounded-xl bg-stone-200 overflow-hidden flex-shrink-0">
                      {item.products?.product_images?.[0]?.url || item.metadata?.image ? (
                        <img
                          src={item.products?.product_images?.[0]?.url || item.metadata?.image}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <i className="ri-image-line text-xl text-stone-400"></i>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-stone-900 text-xs font-semibold leading-snug">{item.product_name}</p>
                      <p className="text-stone-400 text-[10px] mt-0.5">Qty: {item.quantity}</p>
                      {item.variant_name && <p className="text-stone-400 text-[10px]">{item.variant_name}</p>}
                    </div>
                    <p className="text-stone-800 text-sm font-bold flex-shrink-0">GH₵ {Number(item.unit_price).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right: help */}
          <div className="space-y-4">
            <div className="bg-stone-950 rounded-2xl p-6 relative overflow-hidden">
              <div aria-hidden="true"
                className="absolute -right-3 -bottom-4 font-serif italic text-white/[0.04] leading-none pointer-events-none select-none text-[8rem]">?</div>
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                <i className="ri-customer-service-2-line text-base text-amber-400"></i>
              </div>
              <p className="text-[9px] font-black tracking-[0.45em] uppercase text-amber-400 mb-2">Need Help?</p>
              <p className="font-serif text-lg italic text-white mb-4">We're here for you</p>
              <p className="text-stone-400 text-xs leading-relaxed mb-6">
                Contact our team for questions about your order, delivery, or returns.
              </p>
              <div className="space-y-2">
                <Link href="/contact"
                  className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-xs font-medium">
                  <i className="ri-customer-service-line text-amber-400"></i> Contact Support
                </Link>
                <Link href="/returns"
                  className="flex items-center gap-2 text-stone-300 hover:text-white transition-colors text-xs font-medium">
                  <i className="ri-arrow-left-right-line text-amber-400"></i> Returns Policy
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-stone-200 border-t-stone-900 rounded-full animate-spin" />
      </main>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}
