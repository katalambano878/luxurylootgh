'use client';

import { useState, useEffect } from 'react';

const toc = [
  { id: 'agreement',     num: '01', title: 'Agreement to Terms' },
  { id: 'use',           num: '02', title: 'Use of Website' },
  { id: 'products',      num: '03', title: 'Products & Pricing' },
  { id: 'orders',        num: '04', title: 'Orders & Payment' },
  { id: 'shipping',      num: '05', title: 'Shipping & Delivery' },
  { id: 'returns',       num: '06', title: 'Returns & Refunds' },
  { id: 'ip',            num: '07', title: 'Intellectual Property' },
  { id: 'usercontent',   num: '08', title: 'User Content' },
  { id: 'liability',     num: '09', title: 'Limitation of Liability' },
  { id: 'indemnity',     num: '10', title: 'Indemnification' },
  { id: 'law',           num: '11', title: 'Governing Law' },
  { id: 'severability',  num: '12', title: 'Severability' },
  { id: 'contact',       num: '13', title: 'Contact Information' },
];

export default function TermsPage() {
  const [active, setActive] = useState('agreement');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    toc.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

      {/* Hero */}
      <div className="relative bg-stone-950 overflow-hidden">
        <span className="pointer-events-none select-none absolute right-8 top-1/2 -translate-y-1/2 text-[220px] font-black text-white/[0.03] leading-none">T</span>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-400 mb-6">Legal</p>
          <h1 className="font-serif text-4xl lg:text-6xl text-white leading-tight mb-6">
            <em>Read carefully.</em>
            <br />
            <span className="text-stone-400">Use wisely.</span>
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed max-w-md mb-4">
            Please read these terms carefully before using our website and services.
          </p>
          <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-600">Last updated — February 2026</p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-20">

          {/* Sticky TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-1">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-stone-400 mb-6">Contents</p>
              {toc.map(({ id, num, title }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className={`flex items-center gap-3 py-2 group transition-colors ${active === id ? 'text-stone-900' : 'text-stone-400 hover:text-stone-700'}`}
                >
                  <span className={`text-[9px] font-black tracking-widest transition-colors flex-shrink-0 ${active === id ? 'text-amber-500' : 'text-stone-300 group-hover:text-amber-400'}`}>{num}</span>
                  <span className="text-[11px] font-medium leading-tight">{title}</span>
                </a>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="space-y-20 min-w-0">

            <section id="agreement">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">01</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Agreement to Terms</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                By accessing and using this website, you accept and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use our website or services.
              </p>
              <p className="text-stone-600 text-sm leading-relaxed">
                These terms apply to all visitors, users, and customers who access or use our service. We reserve the right to update or modify these terms at any time without prior notice. Your continued use of the website following any changes indicates your acceptance of the new terms.
              </p>
            </section>

            <section id="use">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">02</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Use of Website</h2>

              <div className="mb-8">
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Permitted Use</p>
                <p className="text-stone-600 text-sm leading-relaxed mb-5">You may use our website for lawful purposes only. You agree not to:</p>
                <div className="space-y-3">
                  {[
                    'Violate any local, national, or international law or regulation',
                    'Transmit any harmful code, viruses, or malicious software',
                    'Attempt to gain unauthorised access to our systems or networks',
                    'Use the website for fraudulent purposes or in connection with any criminal activity',
                    'Impersonate any person or entity or misrepresent your affiliation',
                    'Interfere with or disrupt the website or servers',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-[7px] flex-shrink-0" />
                      <p className="text-stone-600 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Account Responsibility</p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  If you create an account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorised use of your account or any other security breach.
                </p>
              </div>
            </section>

            <section id="products">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">03</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Products & Pricing</h2>

              <div className="space-y-6">
                <div className="flex gap-6">
                  <div className="w-px bg-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-900 mb-2">Product Information</p>
                    <p className="text-stone-500 text-sm leading-relaxed">We make every effort to display our products accurately, including colours, descriptions, and specifications. However, we cannot guarantee that your device&apos;s display will accurately reflect product colours or that descriptions are error-free.</p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-px bg-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-900 mb-3">Pricing</p>
                    <p className="text-stone-500 text-sm leading-relaxed mb-4">All prices are listed in Ghana Cedis (GHS) and include VAT where applicable. We reserve the right to:</p>
                    <div className="space-y-2">
                      {[
                        'Modify prices at any time without notice',
                        'Correct pricing errors, even after an order is placed',
                        'Limit quantities available for purchase',
                        'Discontinue products at any time',
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
                          <p className="text-stone-500 text-sm leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-stone-500 text-sm leading-relaxed mt-4">
                      If a product is listed at an incorrect price due to an error, we will contact you before processing your order. You may choose to cancel or proceed at the correct price.
                    </p>
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="w-px bg-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-900 mb-2">Availability</p>
                    <p className="text-stone-500 text-sm leading-relaxed">Product availability is subject to change without notice. If an ordered item becomes unavailable, we will notify you and offer a refund or replacement option.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="orders">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">04</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Orders & Payment</h2>

              <div className="mb-8">
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Order Acceptance</p>
                <p className="text-stone-600 text-sm leading-relaxed mb-5">Placing an order does not guarantee acceptance. We reserve the right to refuse or cancel any order for reasons including:</p>
                <div className="space-y-3">
                  {[
                    'Product unavailability or pricing errors',
                    'Suspected fraudulent or unauthorised transactions',
                    'Inaccuracies in product or pricing information',
                    'Failure to meet age or eligibility requirements',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
                      <p className="text-stone-600 text-sm leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Payment Methods</p>
                <div className="bg-stone-950 p-6">
                  <div className="space-y-4">
                    {[
                      { icon: 'ri-smartphone-line', label: 'Mobile Money', text: 'MTN, Vodafone, AirtelTigo — via Moolre' },
                      { icon: 'ri-bank-card-line', label: 'Card Payment', text: 'Visa, Mastercard — via Moolre' },
                    ].map(({ icon, label, text }) => (
                      <div key={label} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-white/10 flex items-center justify-center flex-shrink-0">
                          <i className={`${icon} text-amber-400 text-sm`} />
                        </div>
                        <div>
                          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-amber-400">{label}</p>
                          <p className="text-stone-400 text-xs">{text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed mt-4">
                  Payment must be received in full before order dispatch. By providing payment information, you confirm that you are authorised to use the payment method and that sufficient funds are available.
                </p>
              </div>

              <div>
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Order Modifications</p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  You may modify or cancel your order within 1 hour of placement. After this time, orders enter processing and cannot be changed. Contact customer service immediately if you need to make changes.
                </p>
              </div>
            </section>

            <section id="shipping">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">05</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Shipping & Delivery</h2>
              <div className="space-y-4">
                <p className="text-stone-600 text-sm leading-relaxed">
                  Delivery times and costs vary by location and shipping method selected. See our{' '}
                  <a href="/shipping" className="underline underline-offset-4 text-stone-900 hover:text-amber-600 transition-colors">Shipping Policy</a>{' '}
                  for detailed information.
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Risk of loss and title for products pass to you upon delivery to the carrier. We are not responsible for delays caused by the shipping carrier or circumstances beyond our control (weather, strikes, customs, etc.).
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  You must provide accurate and complete delivery information. We are not responsible for delivery failures due to incorrect addresses.
                </p>
              </div>
            </section>

            <section id="returns">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">06</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Returns & Refunds</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                We offer a 14-day return policy for most products. See our{' '}
                <a href="/returns" className="underline underline-offset-4 text-stone-900 hover:text-amber-600 transition-colors">Returns Policy</a>{' '}
                for complete details on eligibility, process, and conditions.
              </p>
              <p className="text-stone-600 text-sm leading-relaxed">
                Refunds are processed within 5–7 business days of receiving your return and issued to the original payment method.
              </p>
            </section>

            <section id="ip">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">07</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Intellectual Property</h2>
              <div className="space-y-4">
                <p className="text-stone-600 text-sm leading-relaxed">
                  All content on this website — including text, graphics, logos, images, videos, and software — is protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  You may not reproduce, distribute, modify, create derivative works of, publicly display, or otherwise use any content from this website without our express written permission.
                </p>
                <p className="text-stone-600 text-sm leading-relaxed">
                  Product names, logos, and brands are the property of their respective owners and are used for identification purposes only.
                </p>
              </div>
            </section>

            <section id="usercontent">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">08</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">User Content</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-5">
                You may submit reviews, comments, and other content to our website. By doing so, you grant us a non-exclusive, royalty-free, perpetual, worldwide licence to use, reproduce, modify, and display such content.
              </p>
              <p className="text-stone-600 text-sm leading-relaxed mb-5">You are solely responsible for your content and must ensure it:</p>
              <div className="space-y-3 mb-5">
                {[
                  'Does not violate any laws or third-party rights',
                  'Is not defamatory, offensive, or inappropriate',
                  'Does not contain viruses or malicious code',
                  'Is truthful and based on your genuine experience',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
                    <p className="text-stone-600 text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed">
                We reserve the right to remove any content that violates these terms or that we deem inappropriate.
              </p>
            </section>

            <section id="liability">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">09</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Limitation of Liability</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-5">
                To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from:
              </p>
              <div className="space-y-3 mb-6">
                {[
                  'Your use or inability to use the website or services',
                  'Unauthorised access to or alteration of your data',
                  'Errors or omissions in website content',
                  'Product defects or performance issues',
                  'Delivery delays or failures',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300 mt-[7px] flex-shrink-0" />
                    <p className="text-stone-600 text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-stone-600 text-sm leading-relaxed">
                Our total liability for any claim arising from your use of the website or purchase of products shall not exceed the amount you paid for the product or service in question.
              </p>
            </section>

            <section id="indemnity">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">10</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Indemnification</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                You agree to indemnify and hold harmless our company, its affiliates, officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the website, violation of these terms, or infringement of any third-party rights.
              </p>
            </section>

            <section id="law">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">11</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Governing Law & Disputes</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-4">
                These terms are governed by the laws of Ghana. Any disputes arising from these terms or your use of the website shall be subject to the exclusive jurisdiction of the courts of Ghana.
              </p>
              <p className="text-stone-600 text-sm leading-relaxed">
                Before initiating any legal action, you agree to first contact us to seek resolution through informal negotiation.
              </p>
            </section>

            <section id="severability">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">12</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Severability</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
              </p>
            </section>

            <section id="contact">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">13</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Contact Information</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-10">
                For questions about these Terms and Conditions, please contact us via the contact page on this website.
              </p>

              <div className="bg-stone-950 p-8 lg:p-10 relative overflow-hidden">
                <span className="pointer-events-none select-none absolute right-6 top-1/2 -translate-y-1/2 text-[140px] font-black text-white/[0.04] leading-none">T</span>
                <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-400 mb-4">Your agreement.</p>
                <p className="font-serif text-xl lg:text-2xl text-white italic mb-3">By using our website, you acknowledge</p>
                <p className="text-stone-400 text-sm leading-relaxed mb-8">that you have read, understood, and agree to be bound by these Terms and Conditions.</p>
                <a href="/shop" className="inline-block bg-amber-400 text-stone-950 px-8 py-3 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors">
                  Start Shopping
                </a>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
