'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const mockOrders = [
  {
    id: 'ORD-2024-156',
    date: '2024-01-20',
    items: [
      {
        id: 1,
        name: 'Premium Leather Crossbody Bag',
        price: 289,
        image: 'https://readdy.ai/api/search-image?query=elegant%20premium%20leather%20crossbody%20bag%20in%20deep%20forest%20green%20color%20on%20clean%20minimal%20white%20studio%20background%20with%20soft%20natural%20lighting%20showcasing%20luxury%20craftsmanship&width=400&height=400&seq=return1&orientation=squarish',
        returnable: true,
      },
      {
        id: 2,
        name: 'Minimalist Ceramic Vase Set',
        price: 159,
        image: 'https://readdy.ai/api/search-image?query=modern%20minimalist%20ceramic%20vase%20set%20in%20matte%20cream%20and%20charcoal%20colors%20on%20pristine%20white%20background%20elegant%20home%20decor%20sophisticated%20styling&width=400&height=400&seq=return2&orientation=squarish',
        returnable: true,
      },
    ],
  },
];

const RETURN_REASONS = [
  'Wrong size / fit',
  'Wrong item received',
  'Defective / damaged item',
  'Not as described',
  'Changed my mind',
  'Better price elsewhere',
  'No longer needed',
  'Other',
];

const STEPS = [
  { n: 1, label: 'Find Order' },
  { n: 2, label: 'Select Items' },
  { n: 3, label: 'Submit' },
];

export default function ReturnsPortalPage() {
  const router = useRouter();

  const [step,          setStep]          = useState(1);
  const [orderNumber,   setOrderNumber]   = useState('');
  const [email,         setEmail]         = useState('');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [returnReasons, setReturnReasons] = useState<Record<number, string>>({});
  const [returnType,    setReturnType]    = useState<'refund' | 'exchange'>('refund');
  const [isLoading,     setIsLoading]     = useState(false);
  const [foundOrder,    setFoundOrder]    = useState<any>(null);

  const handleFindOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setFoundOrder(mockOrders[0]);
      setIsLoading(false);
      setStep(2);
    }, 1000);
  };

  const toggleItem = (id: number) =>
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSubmitReturn = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/returns/confirmation');
    }, 1500);
  };

  const canContinue =
    selectedItems.length > 0 && selectedItems.every(id => returnReasons[id]);

  // ── label / input helpers ────────────────────────────────────
  const Label = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-3">
      {children}
    </p>
  );

  const inputCls =
    'w-full pb-3 border-b border-stone-200 focus:border-stone-900 bg-transparent text-stone-900 text-sm outline-none transition-colors placeholder:text-stone-300';

  // ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-white">

      {/* Top accent line */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 lg:py-14">

        {/* ── TOP NAV ────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/"
            className="flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors group"
          >
            <i className="ri-arrow-left-line text-sm group-hover:-translate-x-0.5 transition-transform"></i>
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Home</span>
          </Link>

          {/* Step progress */}
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    step > s.n  ? 'bg-amber-400 text-stone-950' :
                    step === s.n ? 'bg-stone-950 text-white' :
                    'bg-stone-100 text-stone-400'
                  }`}>
                    {step > s.n ? <i className="ri-check-line text-xs"></i> : s.n}
                  </div>
                  <span className={`text-[8px] font-black tracking-[0.3em] uppercase mt-1.5 hidden sm:block transition-colors ${
                    step >= s.n ? 'text-stone-700' : 'text-stone-300'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-10 sm:w-16 h-px mx-1.5 transition-colors ${
                    step > s.n ? 'bg-amber-400' : 'bg-stone-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          <div className="w-16" /> {/* balance */}
        </div>

        {/* ── PAGE HEADING ───────────────────────────────────── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-amber-400" />
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">
              Returns & Exchanges
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl leading-tight">
            <span className="italic text-stone-900">
              {step === 1 && 'Find your '}
              {step === 2 && 'Choose what to '}
              {step === 3 && 'Review & '}
            </span>
            <span className="italic text-stone-400 font-light">
              {step === 1 && 'order.'}
              {step === 2 && 'return.'}
              {step === 3 && 'confirm.'}
            </span>
          </h1>
        </div>

        {/* ══════════════════════════════════════════════════════
            STEP 1 — FIND ORDER
        ══════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-10">
            <form onSubmit={handleFindOrder} className="space-y-8">

              <div>
                <Label>Order Number *</Label>
                <input
                  type="text"
                  value={orderNumber}
                  onChange={e => setOrderNumber(e.target.value)}
                  className={inputCls}
                  placeholder="ORD-2024-156"
                  required
                />
              </div>

              <div>
                <Label>Email Address *</Label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={inputCls}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
              >
                {isLoading
                  ? <><i className="ri-loader-4-line animate-spin text-base"></i> Searching…</>
                  : <>Find Order <i className="ri-search-line text-sm"></i></>
                }
              </button>
            </form>

            {/* Policy note */}
            <div className="bg-stone-950 rounded-2xl p-6 relative overflow-hidden">
              {/* Ghost letter */}
              <div
                aria-hidden="true"
                className="absolute -right-3 -bottom-4 font-serif italic text-white/[0.04] leading-none pointer-events-none select-none text-[8rem]"
              >R</div>

              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center mb-5">
                <i className="ri-shield-check-line text-lg text-amber-400"></i>
              </div>

              <p className="text-[9px] font-black tracking-[0.45em] uppercase text-amber-400 mb-2">
                Return Policy
              </p>
              <p className="font-serif text-lg italic text-white mb-5">What you need to know</p>

              <ul className="space-y-2.5">
                {[
                  'Returns accepted within 30 days of delivery',
                  'Items must be unused with original tags attached',
                  'Free return shipping for defective items',
                  'Refunds processed within 5–7 business days',
                ].map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                    <span className="text-stone-400 text-xs leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 2 — SELECT ITEMS
        ══════════════════════════════════════════════════════ */}
        {step === 2 && foundOrder && (
          <div className="space-y-8">

            {/* Order banner */}
            <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-stone-50 border border-stone-100">
              <div className="w-9 h-9 rounded-xl bg-stone-950 flex items-center justify-center flex-shrink-0">
                <i className="ri-shopping-bag-line text-sm text-amber-400"></i>
              </div>
              <div>
                <p className="text-xs font-bold text-stone-900">Order #{foundOrder.id}</p>
                <p className="text-[10px] text-stone-400 mt-0.5">Placed on {foundOrder.date}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <Label>Select items to return</Label>
              <div className="space-y-3">
                {foundOrder.items.map((item: any) => {
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className={`rounded-2xl border p-5 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-stone-950 border-stone-950'
                          : 'bg-white border-stone-200 hover:border-stone-400'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Custom checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                        }`}>
                          {isSelected && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                        </div>

                        {/* Image */}
                        <div className={`w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ${isSelected ? 'bg-stone-800' : 'bg-stone-100'}`}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover object-top" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-snug ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {item.name}
                          </p>
                          <p className={`text-xs font-bold mt-0.5 ${isSelected ? 'text-amber-400' : 'text-stone-600'}`}>
                            GH₵ {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Reason dropdown — shown when selected */}
                      {isSelected && (
                        <div
                          className="mt-5 pt-5 border-t border-white/[0.08]"
                          onClick={e => e.stopPropagation()}
                        >
                          <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-500 mb-3">
                            Reason for return *
                          </p>
                          <select
                            value={returnReasons[item.id] || ''}
                            onChange={e => setReturnReasons({ ...returnReasons, [item.id]: e.target.value })}
                            className="w-full pb-3 border-b border-white/20 focus:border-amber-400 bg-transparent text-stone-300 text-sm outline-none transition-colors cursor-pointer"
                          >
                            <option value="" className="text-stone-900 bg-white">Select a reason</option>
                            {RETURN_REASONS.map(r => (
                              <option key={r} value={r} className="text-stone-900 bg-white">{r}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Return type */}
            <div>
              <Label>What would you prefer?</Label>
              <div className="grid sm:grid-cols-2 gap-3">

                {/* Refund */}
                <button
                  onClick={() => setReturnType('refund')}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    returnType === 'refund'
                      ? 'bg-stone-950 border-stone-950'
                      : 'bg-white border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${returnType === 'refund' ? 'bg-white/10' : 'bg-stone-100'}`}>
                      <i className={`ri-refund-line text-base ${returnType === 'refund' ? 'text-amber-400' : 'text-stone-500'}`}></i>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      returnType === 'refund' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                    }`}>
                      {returnType === 'refund' && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                    </div>
                  </div>
                  <p className={`text-sm font-bold mb-1 ${returnType === 'refund' ? 'text-white' : 'text-stone-900'}`}>
                    Get a Refund
                  </p>
                  <p className={`text-xs leading-relaxed ${returnType === 'refund' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Money back to your original payment method
                  </p>
                </button>

                {/* Exchange */}
                <button
                  onClick={() => setReturnType('exchange')}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                    returnType === 'exchange'
                      ? 'bg-stone-950 border-stone-950'
                      : 'bg-white border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${returnType === 'exchange' ? 'bg-white/10' : 'bg-stone-100'}`}>
                      <i className={`ri-exchange-line text-base ${returnType === 'exchange' ? 'text-amber-400' : 'text-stone-500'}`}></i>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      returnType === 'exchange' ? 'border-amber-400 bg-amber-400' : 'border-stone-300'
                    }`}>
                      {returnType === 'exchange' && <i className="ri-check-line text-stone-950 text-[10px]"></i>}
                    </div>
                  </div>
                  <p className={`text-sm font-bold mb-1 ${returnType === 'exchange' ? 'text-white' : 'text-stone-900'}`}>
                    Exchange Item
                  </p>
                  <p className={`text-xs leading-relaxed ${returnType === 'exchange' ? 'text-stone-500' : 'text-stone-400'}`}>
                    Get a different size or colour instead
                  </p>
                </button>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-600 text-xs font-bold tracking-[0.2em] uppercase transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canContinue}
                className="flex-[2] bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              >
                Review Return <i className="ri-arrow-right-line text-sm"></i>
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            STEP 3 — REVIEW & SUBMIT
        ══════════════════════════════════════════════════════ */}
        {step === 3 && foundOrder && (
          <div className="space-y-8">

            {/* Return summary */}
            <div>
              <Label>Return summary</Label>
              <div className="bg-stone-950 rounded-2xl overflow-hidden">

                <div className="px-6 pt-5 pb-4 border-b border-white/[0.06]">
                  <p className="font-serif text-base italic text-white">
                    {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} · {returnType === 'refund' ? 'Refund' : 'Exchange'}
                  </p>
                </div>

                <div className="px-6 py-5 space-y-4">
                  {foundOrder.items
                    .filter((item: any) => selectedItems.includes(item.id))
                    .map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-800 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold leading-snug">{item.name}</p>
                          <p className="text-stone-500 text-[10px] mt-0.5">{returnReasons[item.id]}</p>
                        </div>
                        <p className="text-amber-400 text-sm font-bold flex-shrink-0">
                          GH₵ {item.price.toFixed(2)}
                        </p>
                      </div>
                    ))}
                </div>

                <div className="mx-6 mb-6 p-4 rounded-xl bg-white/[0.04] border border-white/[0.06] flex justify-between items-center">
                  <span className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-500">
                    {returnType === 'refund' ? 'Refund Amount' : 'Exchange Value'}
                  </span>
                  <span className="font-serif text-xl font-bold text-amber-400">
                    GH₵ {foundOrder.items
                      .filter((item: any) => selectedItems.includes(item.id))
                      .reduce((acc: number, item: any) => acc + item.price, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Next steps */}
            <div>
              <Label>What happens next</Label>
              <div className="space-y-3">
                {[
                  { icon: 'ri-mail-send-line',      text: 'A prepaid return label will be sent to your email' },
                  { icon: 'ri-box-3-line',           text: 'Pack items securely in their original packaging' },
                  { icon: 'ri-map-pin-line',         text: 'Attach the label and drop off at any shipping point' },
                  { icon: 'ri-radar-line',           text: 'Track your return status from your account' },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                    <div className="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center flex-shrink-0">
                      <i className={`${s.icon} text-sm text-amber-400`}></i>
                    </div>
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-[9px] font-black text-stone-400 mt-0.5 flex-shrink-0">{i + 1}</span>
                      <p className="text-sm text-stone-600 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 rounded-xl border border-stone-200 hover:border-stone-400 text-stone-600 text-xs font-bold tracking-[0.2em] uppercase transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={isLoading}
                className="flex-[2] bg-stone-950 hover:bg-stone-800 text-white py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
              >
                {isLoading
                  ? <><i className="ri-loader-4-line animate-spin text-base"></i> Submitting…</>
                  : <>Submit Return Request <i className="ri-check-line text-sm"></i></>
                }
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
