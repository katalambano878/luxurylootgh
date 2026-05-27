'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { supabase } from '@/lib/supabase';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import {
  parseStorePricingValue,
  resolveCartLineUnitPrice,
} from '@/lib/pricing';

// ── Field wrapper ─────────────────────────────────────────────
function Field({
  id, label, error, children,
}: {
  id: string; label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-3">
        {label}
      </label>
      {children}
      {error && <p className="text-[10px] text-red-500 mt-1.5 font-medium">{error}</p>}
    </div>
  );
}

const inputCls = (err?: string) =>
  `w-full pb-3 border-b bg-transparent text-stone-900 text-sm outline-none transition-colors placeholder:text-stone-300 ${
    err ? 'border-red-400 focus:border-red-600' : 'border-stone-200 focus:border-stone-900'
  }`;

// ── Ghana regions ─────────────────────────────────────────────
const GHANA_REGIONS = [
  'Greater Accra', 'Ashanti', 'Western', 'Central', 'Eastern', 'Northern',
  'Volta', 'Upper East', 'Upper West', 'Brong-Ahafo', 'Ahafo', 'Bono',
  'Bono East', 'North East', 'Savannah', 'Oti', 'Western North',
];

// ── Checkout steps ────────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Shipping' },
  { n: 2, label: 'Delivery' },
  { n: 3, label: 'Payment' },
];

export default function CheckoutPage() {
  usePageTitle('Checkout');
  const router = useRouter();
  const { cart, subtotal: cartSubtotal, clearCart } = useCart();

  const [currentStep,   setCurrentStep]   = useState(1);
  const [isLoading,     setIsLoading]     = useState(false);
  const [checkoutType,  setCheckoutType]  = useState<'guest' | 'account'>('guest');
  const [saveAddress,   setSaveAddress]   = useState(false);
  const [user,          setUser]          = useState<any>(null);
  const { getToken, verifying } = useRecaptcha();

  const [shippingData, setShippingData] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', address: '', city: '', region: '',
  });

  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod]                     = useState('moolre');
  const [errors,         setErrors]         = useState<any>({});

  // ── Auth check ───────────────────────────────────────────────
  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setCheckoutType('account');
        setShippingData(prev => ({ ...prev, email: session.user.email || '' }));
      }
    }
    checkUser();
  }, []);

  // ── Scroll to top on step change ─────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // ── Totals ───────────────────────────────────────────────────
  const subtotal    = cartSubtotal;
  const shippingCost: number = 0;
  const tax         = 0;
  const total       = subtotal + shippingCost + tax;

  // ── Validation ───────────────────────────────────────────────
  const validateShipping = () => {
    const e: any = {};
    if (!shippingData.firstName) e.firstName = 'Required';
    if (!shippingData.lastName)  e.lastName  = 'Required';
    if (!shippingData.email)     e.email     = 'Required';
    else if (!/\S+@\S+\.\S+/.test(shippingData.email)) e.email = 'Invalid email';
    if (!shippingData.phone)   e.phone   = 'Required';
    if (!shippingData.address) e.address = 'Required';
    if (!shippingData.city)    e.city    = 'Required';
    if (!shippingData.region)  e.region  = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinueToDelivery = () => { if (validateShipping()) setCurrentStep(2); };
  const handleContinueToPayment  = async () => { await handlePlaceOrder(); };

  // ── Place order ──────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (cart.length === 0) { alert('Your cart is empty'); return; }
    setIsLoading(true);

    const isHuman = await getToken('checkout');
    if (!isHuman) {
      alert('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const trackingId  = Array.from({ length: 6 }, () =>
        'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]
      ).join('');
      const trackingNumber = `SLI-${trackingId}`;

      const isValidUUID = (s: string) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

      const resolvedLines: { item: (typeof cart)[0]; productId: string }[] = [];
      for (const item of cart) {
        let productId = item.id;
        if (!isValidUUID(productId)) {
          const { data: prodRow } = await supabase
            .from('products').select('id')
            .or(`slug.eq.${productId},id.eq.${productId}`).single();
          if (!prodRow) throw new Error(`Product not found: ${item.name}. Please remove it and try again.`);
          productId = prodRow.id;
        }
        resolvedLines.push({ item, productId });
      }

      const uniqueIds = [...new Set(resolvedLines.map(l => l.productId))];

      const { data: pricingRow } = await supabase
        .from('site_settings').select('value').eq('key', 'store_pricing').maybeSingle();
      const salesActive = parseStorePricingValue(pricingRow?.value).sales_active;

      const { data: productsFull, error: productsFullError } =
        uniqueIds.length > 0
          ? await supabase.from('products')
              .select('id, price, sale_price, compare_at_price, metadata, product_variants(id, name, option1, option2, price, sale_price)')
              .in('id', uniqueIds)
          : { data: [] as any[], error: null };

      if (productsFullError) throw productsFullError;

      const productMap = new Map((productsFull || []).map((p: any) => [p.id, p]));
      let computedSubtotal = 0;
      const orderItemsPayload: Record<string, unknown>[] = [];

      for (const { item, productId } of resolvedLines) {
        const p = productMap.get(productId);
        if (!p) throw new Error(`Product not found: ${item.name}. Please remove it and try again.`);
        const unit = resolveCartLineUnitPrice(p, item.variant, salesActive);
        computedSubtotal += unit * item.quantity;
        orderItemsPayload.push({
          product_id: productId, product_name: item.name, variant_name: item.variant,
          quantity: item.quantity, unit_price: unit, total_price: unit * item.quantity,
          metadata: { image: item.image, slug: item.slug, preorder_shipping: p.metadata?.preorder_shipping || null },
        });
      }

      const checkoutTotal = computedSubtotal + shippingCost + tax;

      const { data: order, error: orderError } = await supabase.from('orders').insert([{
        order_number: orderNumber, user_id: user?.id || null,
        email: shippingData.email, phone: shippingData.phone,
        status: 'pending', payment_status: 'pending', currency: 'GHS',
        subtotal: computedSubtotal, tax_total: tax, shipping_total: shippingCost,
        discount_total: 0, total: checkoutTotal,
        shipping_method: deliveryMethod, payment_method: paymentMethod,
        shipping_address: shippingData, billing_address: shippingData,
        metadata: {
          guest_checkout: !user,
          first_name: shippingData.firstName, last_name: shippingData.lastName,
          tracking_number: trackingNumber,
        },
      }]).select().single();

      if (orderError) throw orderError;

      const { error: itemsError } = await supabase.from('order_items')
        .insert(orderItemsPayload.map(row => ({ ...row, order_id: order.id })));
      if (itemsError) throw itemsError;

      await supabase.rpc('upsert_customer_from_order', {
        p_email: shippingData.email, p_phone: shippingData.phone,
        p_full_name: `${shippingData.firstName} ${shippingData.lastName}`.trim(),
        p_first_name: shippingData.firstName, p_last_name: shippingData.lastName,
        p_user_id: user?.id || null, p_address: shippingData,
      });

      if (paymentMethod === 'moolre') {
        try {
          const paymentRes = await fetch('/api/payment/moolre', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId: orderNumber, amount: checkoutTotal, customerEmail: shippingData.email }),
          });
          const paymentResult = await paymentRes.json();
          if (!paymentResult.success) throw new Error(paymentResult.message || 'Payment initialization failed');
          clearCart();
          window.location.href = paymentResult.url;
          return;
        } catch (paymentErr: any) {
          console.error('Payment Error:', paymentErr);
          alert('Failed to initialize payment: ' + paymentErr.message);
          setIsLoading(false);
          return;
        }
      }

      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'order_created', payload: order }),
      }).catch(err => console.error('Notification trigger error:', err));

      clearCart();
      router.push(`/order-success?order=${orderNumber}`);

    } catch (err: any) {
      console.error('Checkout error:', err);
      alert('Failed to place order: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Empty cart ───────────────────────────────────────────────
  if (cart.length === 0 && !isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-6">
            <i className="ri-shopping-bag-line text-3xl text-stone-400"></i>
          </div>
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400 mb-3">Nothing here</p>
          <h2 className="font-serif text-3xl italic text-stone-900 mb-4">Your bag is empty</h2>
          <p className="text-stone-400 text-sm mb-8 leading-relaxed">Add some items before checking out.</p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-3 bg-stone-950 text-white px-8 py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase hover:bg-stone-800 transition-colors"
          >
            Browse Shop <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </main>
    );
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white">

      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">

        {/* ── TOP BAR ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">

          {/* Back to cart */}
          <Link
            href="/cart"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors group"
          >
            <i className="ri-arrow-left-line text-sm group-hover:-translate-x-0.5 transition-transform"></i>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Cart</span>
          </Link>

          {/* Step progress */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    currentStep > s.n  ? 'bg-amber-400 text-stone-950' :
                    currentStep === s.n ? 'bg-stone-950 text-white' :
                    'bg-stone-100 text-stone-400'
                  }`}>
                    {currentStep > s.n
                      ? <i className="ri-check-line text-xs"></i>
                      : s.n}
                  </div>
                  <span className={`text-[8px] font-black tracking-[0.3em] uppercase mt-1.5 hidden sm:block transition-colors ${
                    currentStep >= s.n ? 'text-stone-700' : 'text-stone-300'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 sm:w-14 h-px mx-1.5 transition-colors ${
                    currentStep > s.n ? 'bg-amber-400' : 'bg-stone-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Secure badge */}
          <div className="flex items-center gap-1.5">
            <i className="ri-shield-check-line text-sm text-amber-500"></i>
            <span className="text-[9px] font-bold tracking-[0.3em] uppercase text-stone-400 hidden sm:block">Secure</span>
          </div>
        </div>

        {/* ── PAGE HEADING ───────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-amber-400" />
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">
              {currentStep === 1 ? 'Step 1 · Shipping' : 'Step 2 · Delivery'}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl leading-tight">
            <span className="italic text-stone-900">
              {currentStep === 1 ? 'Where should we ' : 'How would you '}
            </span>
            <span className="italic text-stone-400 font-light">
              {currentStep === 1 ? 'send it?' : 'receive it?'}
            </span>
          </h1>
        </div>

        {/* ── MAIN GRID ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10 lg:gap-14">

          {/* ══════════════════════════════════════════════════
              LEFT: FORM
          ══════════════════════════════════════════════════ */}
          <div>

            {/* ── STEP 1: SHIPPING ─────────────────────────── */}
            {currentStep === 1 && (
              <div className="space-y-10">

                {/* Checkout type */}
                <div>
                  <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400 mb-4">Checkout as</p>
                  <div className="grid sm:grid-cols-2 gap-3">

                    {/* Guest */}
                    <button
                      onClick={() => !user && setCheckoutType('guest')}
                      disabled={!!user}
                      className={`p-5 rounded-2xl border text-left transition-all duration-200 ${
                        checkoutType === 'guest'
                          ? 'bg-stone-950 border-stone-950'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      } ${user ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${checkoutType === 'guest' ? 'bg-white/10' : 'bg-stone-100'}`}>
                          <i className={`ri-user-line text-base ${checkoutType === 'guest' ? 'text-amber-400' : 'text-stone-500'}`}></i>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          checkoutType === 'guest' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                        }`}>
                          {checkoutType === 'guest' && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                        </div>
                      </div>
                      <p className={`text-sm font-bold mb-1 ${checkoutType === 'guest' ? 'text-white' : 'text-stone-900'}`}>
                        Guest Checkout
                      </p>
                      <p className={`text-xs leading-relaxed ${checkoutType === 'guest' ? 'text-stone-500' : 'text-stone-400'}`}>
                        {user ? 'You are currently logged in' : 'Quick checkout, no account needed'}
                      </p>
                    </button>

                    {/* Account */}
                    <button
                      onClick={() => setCheckoutType('account')}
                      className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                        checkoutType === 'account'
                          ? 'bg-stone-950 border-stone-950'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${checkoutType === 'account' ? 'bg-white/10' : 'bg-stone-100'}`}>
                          <i className={`ri-account-circle-line text-base ${checkoutType === 'account' ? 'text-amber-400' : 'text-stone-500'}`}></i>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          checkoutType === 'account' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                        }`}>
                          {checkoutType === 'account' && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                        </div>
                      </div>
                      <p className={`text-sm font-bold mb-1 ${checkoutType === 'account' ? 'text-white' : 'text-stone-900'}`}>
                        {user ? 'My Account' : 'Create Account'}
                      </p>
                      <p className={`text-xs leading-relaxed ${checkoutType === 'account' ? 'text-stone-500' : 'text-stone-400'}`}>
                        {user ? `Logged in as ${user.email}` : 'Save info, track orders & earn points'}
                      </p>
                    </button>
                  </div>
                </div>

                {/* Shipping form */}
                <div>
                  <div className="flex items-center gap-3 mb-7">
                    <div className="w-5 h-px bg-stone-200" />
                    <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400">Delivery details</p>
                  </div>

                  <div className="space-y-8">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field id="firstName" label="First Name *" error={errors.firstName}>
                        <input id="firstName" type="text" value={shippingData.firstName}
                          onChange={e => setShippingData({ ...shippingData, firstName: e.target.value })}
                          className={inputCls(errors.firstName)} placeholder="John" />
                      </Field>
                      <Field id="lastName" label="Last Name *" error={errors.lastName}>
                        <input id="lastName" type="text" value={shippingData.lastName}
                          onChange={e => setShippingData({ ...shippingData, lastName: e.target.value })}
                          className={inputCls(errors.lastName)} placeholder="Doe" />
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field id="email" label="Email Address *" error={errors.email}>
                        <input id="email" type="email" value={shippingData.email} readOnly={!!user}
                          onChange={e => setShippingData({ ...shippingData, email: e.target.value })}
                          className={`${inputCls(errors.email)} ${user ? 'opacity-60 cursor-not-allowed' : ''}`}
                          placeholder="you@example.com" />
                      </Field>
                      <Field id="phone" label="Phone Number *" error={errors.phone}>
                        <input id="phone" type="tel" value={shippingData.phone}
                          onChange={e => setShippingData({ ...shippingData, phone: e.target.value })}
                          className={inputCls(errors.phone)} placeholder="+233 XX XXX XXXX" />
                      </Field>
                    </div>

                    <Field id="address" label="Street Address *" error={errors.address}>
                      <input id="address" type="text" value={shippingData.address}
                        onChange={e => setShippingData({ ...shippingData, address: e.target.value })}
                        className={inputCls(errors.address)} placeholder="House number and street name" />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <Field id="city" label="City *" error={errors.city}>
                        <input id="city" type="text" value={shippingData.city}
                          onChange={e => setShippingData({ ...shippingData, city: e.target.value })}
                          className={inputCls(errors.city)} placeholder="Accra" />
                      </Field>
                      <Field id="region" label="Region *" error={errors.region}>
                        <select id="region" value={shippingData.region}
                          onChange={e => setShippingData({ ...shippingData, region: e.target.value })}
                          className={`${inputCls(errors.region)} cursor-pointer`}
                        >
                          <option value="">Select region</option>
                          {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </Field>
                    </div>

                    {checkoutType === 'account' && (
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            saveAddress ? 'bg-stone-950 border-stone-950' : 'border-stone-300 group-hover:border-stone-500'
                          }`}
                          onClick={() => setSaveAddress(!saveAddress)}
                        >
                          {saveAddress && <i className="ri-check-line text-white text-[10px]"></i>}
                        </div>
                        <span className="text-xs text-stone-500 font-medium">Save this address for future orders</span>
                      </label>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleContinueToDelivery}
                  className="w-full bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors flex items-center justify-center gap-3 cursor-pointer"
                >
                  Continue to Delivery
                  <i className="ri-arrow-right-line text-sm"></i>
                </button>
              </div>
            )}

            {/* ── STEP 2: DELIVERY ─────────────────────────── */}
            {currentStep === 2 && (
              <div className="space-y-8">

                <div>
                  <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400 mb-4">Select method</p>
                  <div className="space-y-3">

                    {/* Store Pickup */}
                    <button
                      onClick={() => setDeliveryMethod('pickup')}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                        deliveryMethod === 'pickup'
                          ? 'bg-stone-950 border-stone-950'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${deliveryMethod === 'pickup' ? 'bg-white/10' : 'bg-stone-100'}`}>
                          <i className={`ri-store-3-line text-lg ${deliveryMethod === 'pickup' ? 'text-amber-400' : 'text-stone-500'}`}></i>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${deliveryMethod === 'pickup' ? 'text-white' : 'text-stone-900'}`}>
                            Store Pickup
                          </p>
                          <p className={`text-xs mt-0.5 ${deliveryMethod === 'pickup' ? 'text-stone-500' : 'text-stone-400'}`}>
                            Ready in 24 hours · Obuasi
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-black tracking-wider ${deliveryMethod === 'pickup' ? 'text-amber-400' : 'text-stone-500'}`}>
                          FREE
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          deliveryMethod === 'pickup' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                        }`}>
                          {deliveryMethod === 'pickup' && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                        </div>
                      </div>
                    </button>

                    {/* Doorstep */}
                    <button
                      onClick={() => setDeliveryMethod('doorstep')}
                      className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 cursor-pointer text-left ${
                        deliveryMethod === 'doorstep'
                          ? 'bg-stone-950 border-stone-950'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${deliveryMethod === 'doorstep' ? 'bg-white/10' : 'bg-stone-100'}`}>
                          <i className={`ri-truck-line text-lg ${deliveryMethod === 'doorstep' ? 'text-amber-400' : 'text-stone-500'}`}></i>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${deliveryMethod === 'doorstep' ? 'text-white' : 'text-stone-900'}`}>
                            Doorstep Delivery
                          </p>
                          <p className={`text-xs mt-0.5 ${deliveryMethod === 'doorstep' ? 'text-stone-500' : 'text-stone-400'}`}>
                            We'll contact you with delivery cost
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-xs font-medium ${deliveryMethod === 'doorstep' ? 'text-amber-400' : 'text-amber-600'}`}>
                          At cost
                        </span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          deliveryMethod === 'doorstep' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                        }`}>
                          {deliveryMethod === 'doorstep' && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment note */}
                <div className="flex items-start gap-3 p-5 rounded-2xl bg-stone-50 border border-stone-100">
                  <i className="ri-smartphone-line text-amber-500 text-lg flex-shrink-0 mt-0.5"></i>
                  <div>
                    <p className="text-xs font-bold text-stone-800 mb-1">Mobile Money Payment</p>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      You'll be redirected to Moolre to complete payment securely via MTN, Vodafone, or AirtelTigo.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  <button
                    onClick={() => setCurrentStep(1)}
                    disabled={isLoading}
                    className="flex-1 py-4 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-600 text-xs font-bold tracking-[0.2em] uppercase transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleContinueToPayment}
                    disabled={isLoading || verifying}
                    className="flex-[2] bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                  >
                    {isLoading ? (
                      <><i className="ri-loader-4-line animate-spin text-base"></i> Processing…</>
                    ) : verifying ? (
                      <><i className="ri-shield-check-line text-base"></i> Verifying…</>
                    ) : (
                      <><i className="ri-smartphone-line text-base"></i> Pay with Mobile Money</>
                    )}
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* ══════════════════════════════════════════════════
              RIGHT: ORDER SUMMARY
          ══════════════════════════════════════════════════ */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-stone-950 rounded-2xl overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
                <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-600 mb-1">Your Order</p>
                <p className="font-serif text-lg italic text-white leading-snug">
                  {cart.length} {cart.length === 1 ? 'item' : 'items'}
                </p>
              </div>

              {/* Items */}
              <div className="px-6 py-5 space-y-4 max-h-60 overflow-y-auto">
                {cart.map(item => (
                  <div key={`${item.id}-${item.variant || ''}`} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center text-stone-950 text-[9px] font-black">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold leading-snug line-clamp-2">{item.name}</p>
                      {item.variant && (
                        <p className="text-stone-600 text-[10px] mt-0.5">{item.variant}</p>
                      )}
                      <p className="text-amber-400 text-xs font-bold mt-1">
                        GH₵ {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-px bg-white/[0.06] mx-6" />

              {/* Totals */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-xs font-medium">Subtotal</span>
                  <span className="text-white text-sm font-semibold">GH₵ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500 text-xs font-medium">Shipping</span>
                  <span className={`text-sm font-bold ${shippingCost === 0 ? 'text-stone-400' : 'text-white'}`}>
                    {shippingCost === 0 ? 'FREE' : `GH₵ ${shippingCost.toFixed(2)}`}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="mx-6 mb-6 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                <div className="flex justify-between items-center">
                  <span className="text-stone-400 text-[9px] font-black tracking-[0.4em] uppercase">Total</span>
                  <span className="font-serif text-2xl font-bold text-amber-400">
                    GH₵ {total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Trust badge */}
              <div className="px-6 pb-5 flex items-center gap-2">
                <i className="ri-shield-check-line text-amber-500 text-sm"></i>
                <span className="text-[9px] text-stone-600 font-bold tracking-[0.3em] uppercase">
                  256-bit SSL · Secure Checkout
                </span>
              </div>
            </div>

            {/* Accepted payments */}
            <div className="mt-4 flex items-center justify-center gap-4 px-2">
              {['MTN MoMo', 'Vodafone Cash', 'AirtelTigo'].map(p => (
                <span key={p} className="text-[9px] text-stone-400 font-bold tracking-wider uppercase">{p}</span>
              ))}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
