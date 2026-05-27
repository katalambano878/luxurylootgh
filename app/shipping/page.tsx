import Link from 'next/link';

const deliveryOptions = [
  {
    type: 'Standard Delivery',
    time: '2–5 Business Days',
    cost: 'GHS 20',
    description: 'Perfect for regular orders with no rush. Delivered across all Ghana regions.',
    icon: 'ri-truck-line',
    featured: false,
  },
  {
    type: 'Express Delivery',
    time: 'Next Day',
    cost: 'GHS 40',
    description: 'Available for Accra & Kumasi orders placed before 2 pm.',
    icon: 'ri-rocket-line',
    featured: true,
  },
  {
    type: 'Store Pickup',
    time: 'Same Day',
    cost: 'FREE',
    description: 'Collect directly from our Obuasi store within 24 hours.',
    icon: 'ri-store-2-line',
    featured: false,
  },
];

const zones = [
  { zone: 'Zone 1', name: 'Accra Metro', areas: 'East Legon, Osu, Labone, Airport, Dzorwulu, Cantonments, Adabraka, Tema', standard: '1–2 days', express: 'Next day' },
  { zone: 'Zone 2', name: 'Greater Accra', areas: 'Madina, Legon, Haatso, Achimota, Dansoman, Spintex, Teshie, Kasoa', standard: '2–3 days', express: 'Next day' },
  { zone: 'Zone 3', name: 'Major Cities', areas: 'Kumasi, Takoradi, Cape Coast, Tamale, Sunyani, Ho, Koforidua', standard: '3–4 days', express: '1–2 days' },
  { zone: 'Zone 4', name: 'Other Areas', areas: 'All other locations within Ghana', standard: '4–5 days', express: 'N/A' },
];

const howItWorks = [
  { icon: 'ri-checkbox-circle-line', title: 'Order Processing', body: 'Orders placed before 2 pm are processed same day. We carefully pack each item before dispatch.' },
  { icon: 'ri-send-plane-line',       title: 'Dispatch',           body: 'Handed to our delivery partner. You\'ll receive a tracking number via email and SMS.' },
  { icon: 'ri-radar-line',            title: 'Track Your Order',   body: 'Use your tracking number for real-time updates at every stage of the journey.' },
  { icon: 'ri-home-smile-line',       title: 'Delivery',           body: 'Our partner will call before arrival. Sign for your package and enjoy your purchase.' },
];

const importantInfo = [
  { icon: 'ri-time-line',             title: 'Cut-off Times',      body: 'Orders before 2 pm dispatch same day. Orders after 2 pm dispatch the next business day.' },
  { icon: 'ri-calendar-line',         title: 'Business Days',      body: 'Delivery windows exclude weekends and public holidays. We process Monday to Friday.' },
  { icon: 'ri-phone-line',            title: 'Delivery Contact',   body: 'Our partner calls before arrival. Keep your phone number correct and reachable.' },
  { icon: 'ri-home-line',             title: 'Failed Deliveries',  body: 'Two attempts will be made. After that, the package is held at a collection point for 5 days.' },
  { icon: 'ri-shield-check-line',     title: 'Package Security',   body: 'All packages are insured in transit. Report damage or missing items within 48 hours.' },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative bg-stone-950 overflow-hidden" style={{ minHeight: '52vh' }}>
        <div className="absolute inset-0 bg-[url('/hero_watches_sunglasses.png')] bg-cover bg-center opacity-10" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

        {/* Ghost letter */}
        <div aria-hidden="true"
          className="absolute -right-4 bottom-0 font-serif italic text-white/[0.03] leading-none pointer-events-none select-none"
          style={{ fontSize: 'clamp(10rem, 26vw, 22rem)' }}>S</div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 flex flex-col justify-center" style={{ minHeight: '52vh' }}>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-10 h-px bg-amber-400" />
            <span className="text-amber-400 text-[9px] font-black tracking-[0.55em] uppercase">Delivery Info</span>
          </div>
          <h1 className="font-serif italic leading-[0.92]">
            <span className="block text-white" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>Shipping &</span>
            <span className="block text-amber-400" style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)' }}>Delivery</span>
          </h1>
          <p className="text-stone-400 text-sm font-light mt-8 max-w-sm leading-relaxed">
            Fast, reliable delivery across Ghana. Free standard shipping on orders over GHS 300.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">

        {/* ── DELIVERY OPTIONS ─────────────────────────────────── */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-amber-400" />
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">Options</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl italic text-stone-900 mb-10 leading-tight">
            How would you like<br />
            <span className="text-stone-400 font-light">it delivered?</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            {deliveryOptions.map((opt) => (
              <div key={opt.type} className={`rounded-2xl p-7 transition-all ${
                opt.featured ? 'bg-stone-950' : 'bg-white border border-stone-200 hover:border-stone-400'
              }`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-6 ${
                  opt.featured ? 'bg-white/10' : 'bg-stone-100'
                }`}>
                  <i className={`${opt.icon} text-xl ${opt.featured ? 'text-amber-400' : 'text-stone-600'}`}></i>
                </div>
                <p className={`text-[9px] font-black tracking-[0.4em] uppercase mb-2 ${opt.featured ? 'text-stone-500' : 'text-stone-400'}`}>
                  {opt.time}
                </p>
                <h3 className={`font-serif text-xl italic mb-1 ${opt.featured ? 'text-white' : 'text-stone-900'}`}>
                  {opt.type}
                </h3>
                <p className={`text-lg font-bold mb-4 ${opt.featured ? 'text-amber-400' : 'text-stone-800'}`}>
                  {opt.cost}
                </p>
                <p className={`text-xs leading-relaxed ${opt.featured ? 'text-stone-400' : 'text-stone-500'}`}>
                  {opt.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── FREE SHIPPING BANNER ─────────────────────────────── */}
        <div className="mb-20 bg-stone-950 rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
          <div aria-hidden="true"
            className="absolute right-0 bottom-0 font-serif italic text-white/[0.04] leading-none pointer-events-none select-none text-[10rem]">
            ₵
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-400 flex items-center justify-center flex-shrink-0">
            <i className="ri-gift-line text-2xl text-stone-950"></i>
          </div>
          <div className="relative z-10 text-center sm:text-left">
            <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-400 mb-1">Free Shipping</p>
            <h3 className="font-serif text-xl italic text-white mb-1">Spend GHS 300 or more</h3>
            <p className="text-stone-400 text-sm leading-relaxed">Get free standard delivery anywhere in Ghana on qualifying orders.</p>
          </div>
        </div>

        {/* ── DELIVERY ZONES ───────────────────────────────────── */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-amber-400" />
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">Coverage</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl italic text-stone-900 mb-10 leading-tight">
            Delivery zones<br />
            <span className="text-stone-400 font-light">& timeframes</span>
          </h2>

          <div className="rounded-2xl overflow-hidden border border-stone-100">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_2fr_80px_80px] gap-4 px-6 py-4 bg-stone-950">
              {['Zone', 'Areas Covered', 'Standard', 'Express'].map(h => (
                <span key={h} className="text-[9px] font-black tracking-[0.3em] uppercase text-stone-500">{h}</span>
              ))}
            </div>
            {zones.map((z, i) => (
              <div key={z.zone} className={`grid grid-cols-[1fr_2fr_80px_80px] gap-4 px-6 py-5 ${
                i < zones.length - 1 ? 'border-b border-stone-100' : ''
              } hover:bg-stone-50 transition-colors`}>
                <div>
                  <p className="text-xs font-black text-stone-900">{z.zone}</p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">{z.name}</p>
                </div>
                <p className="text-xs text-stone-500 leading-relaxed">{z.areas}</p>
                <p className="text-xs font-semibold text-stone-700">{z.standard}</p>
                <p className={`text-xs font-semibold ${z.express === 'N/A' ? 'text-stone-300' : 'text-stone-700'}`}>{z.express}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── HOW IT WORKS + IMPORTANT INFO ────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">

          {/* How it works */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-amber-400" />
              <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">Process</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl italic text-stone-900 mb-8 leading-tight">
              How shipping works
            </h2>
            <div className="space-y-0">
              {howItWorks.map((s, i) => (
                <div key={i} className="flex gap-5 pb-8 relative">
                  {i < howItWorks.length - 1 && (
                    <div className="absolute left-[18px] top-11 bottom-0 w-px bg-stone-100" />
                  )}
                  <div className="w-9 h-9 rounded-xl bg-stone-950 flex items-center justify-center flex-shrink-0 z-10">
                    <i className={`${s.icon} text-sm text-amber-400`}></i>
                  </div>
                  <div className="pt-1">
                    <p className="text-xs font-black tracking-wider uppercase text-stone-900 mb-1.5">{s.title}</p>
                    <p className="text-xs text-stone-500 leading-relaxed">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important info */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-amber-400" />
              <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">Important</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl italic text-stone-900 mb-8 leading-tight">
              Good to know
            </h2>
            <div className="space-y-3">
              {importantInfo.map((info, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-stone-50 border border-stone-100">
                  <div className="w-8 h-8 rounded-lg bg-stone-950 flex items-center justify-center flex-shrink-0">
                    <i className={`${info.icon} text-sm text-amber-400`}></i>
                  </div>
                  <div>
                    <p className="text-xs font-black tracking-wider uppercase text-stone-800 mb-1">{info.title}</p>
                    <p className="text-xs text-stone-500 leading-relaxed">{info.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TRACKING STATUSES ────────────────────────────────── */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-px bg-amber-400" />
            <span className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500/80">Tracking</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl italic text-stone-900 mb-10 leading-tight">
            Follow your order<br />
            <span className="text-stone-400 font-light">every step</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: 'ri-checkbox-circle-line', label: 'Order Confirmed', n: '01' },
              { icon: 'ri-package-line',          label: 'Processing',       n: '02' },
              { icon: 'ri-truck-line',            label: 'Out for Delivery', n: '03' },
              { icon: 'ri-home-smile-line',       label: 'Delivered',        n: '04' },
            ].map((s, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${i === 2 ? 'bg-stone-950 border-stone-950' : 'border-stone-100 bg-stone-50'}`}>
                <p className={`text-[9px] font-black tracking-[0.4em] mb-3 ${i === 2 ? 'text-stone-600' : 'text-stone-300'}`}>{s.n}</p>
                <i className={`${s.icon} text-2xl block mb-3 ${i === 2 ? 'text-amber-400' : 'text-stone-400'}`}></i>
                <p className={`text-xs font-bold ${i === 2 ? 'text-white' : 'text-stone-700'}`}>{s.label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/order-tracking"
            className="inline-flex items-center gap-3 bg-stone-950 hover:bg-stone-800 text-white px-8 py-4 rounded-xl text-xs font-bold tracking-[0.25em] uppercase transition-colors"
          >
            <i className="ri-radar-line text-sm"></i> Track Your Order
          </Link>
        </div>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <div className="bg-stone-950 rounded-2xl p-10 sm:p-14 text-center relative overflow-hidden">
          <div aria-hidden="true"
            className="absolute -right-4 -bottom-6 font-serif italic text-white/[0.04] leading-none pointer-events-none select-none text-[12rem]">?</div>
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-400 mb-3">Need Help</p>
          <h2 className="font-serif text-2xl sm:text-3xl italic text-white mb-4 leading-snug">
            Questions about your delivery?
          </h2>
          <p className="text-stone-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
            Our team is happy to help with shipping costs, delivery times, or tracking queries.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-stone-950 px-7 py-3.5 rounded-xl text-xs font-black tracking-[0.2em] uppercase transition-colors">
              Contact Support
            </Link>
            <Link href="/order-tracking"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-7 py-3.5 rounded-xl text-xs font-bold tracking-[0.2em] uppercase transition-colors">
              Track Order
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
