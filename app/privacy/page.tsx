'use client';

import { useState, useEffect } from 'react';

const toc = [
  { id: 'collect',       num: '01', title: 'Information We Collect' },
  { id: 'use',           num: '02', title: 'How We Use Your Info' },
  { id: 'sharing',       num: '03', title: 'Sharing & Disclosure' },
  { id: 'security',      num: '04', title: 'Data Security' },
  { id: 'rights',        num: '05', title: 'Your Rights' },
  { id: 'cookies',       num: '06', title: 'Cookies & Tracking' },
  { id: 'children',      num: '07', title: "Children's Privacy" },
  { id: 'international', num: '08', title: 'International Transfers' },
  { id: 'retention',     num: '09', title: 'Data Retention' },
  { id: 'changes',       num: '10', title: 'Policy Changes' },
  { id: 'contact',       num: '11', title: 'Contact Us' },
];

export default function PrivacyPage() {
  const [active, setActive] = useState('collect');

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
        <span className="pointer-events-none select-none absolute right-8 top-1/2 -translate-y-1/2 text-[220px] font-black text-white/[0.03] leading-none">P</span>
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28">
          <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-400 mb-6">Legal</p>
          <h1 className="font-serif text-4xl lg:text-6xl text-white leading-tight mb-6">
            <em>Your privacy,</em>
            <br />
            <span className="text-stone-400">our commitment.</span>
          </h1>
          <p className="text-stone-400 text-sm leading-relaxed max-w-md mb-4">
            Learn how we collect, use, and protect your personal information.
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

            <section id="collect">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">01</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Information We Collect</h2>

              <div className="mb-8">
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Information You Provide</p>
                <p className="text-stone-600 text-sm leading-relaxed mb-5">When you create an account, place an order, or contact us, we collect:</p>
                <div className="space-y-3">
                  {[
                    ['Personal Details', 'Name, email address, phone number, date of birth'],
                    ['Delivery Information', 'Shipping and billing addresses'],
                    ['Payment Details', 'Payment method information (securely processed by third-party providers)'],
                    ['Communications', 'Messages, reviews, and feedback you submit'],
                  ].map(([label, text]) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
                      <p className="text-stone-600 text-sm leading-relaxed"><span className="font-semibold text-stone-900">{label}:</span> {text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-400 mb-4">Collected Automatically</p>
                <p className="text-stone-600 text-sm leading-relaxed mb-5">When you visit our website, we automatically collect:</p>
                <div className="space-y-3">
                  {[
                    ['Device Information', 'IP address, browser type, operating system, device identifiers'],
                    ['Usage Data', 'Pages viewed, products browsed, search queries, time spent on site'],
                    ['Cookies', 'Small data files stored on your device to improve your experience'],
                  ].map(([label, text]) => (
                    <div key={label} className="flex items-start gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
                      <p className="text-stone-600 text-sm leading-relaxed"><span className="font-semibold text-stone-900">{label}:</span> {text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="use">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">02</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">How We Use Your Information</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">We use your personal information for the following purposes:</p>

              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { icon: 'ri-shopping-bag-line', title: 'Order Processing', text: 'Process your orders, arrange delivery, send confirmations, handle returns and refunds, and provide customer support.' },
                  { icon: 'ri-line-chart-line', title: 'Service Improvement', text: 'Analyse website usage to improve our products, services, and user experience.' },
                  { icon: 'ri-mail-line', title: 'Marketing', text: "Send promotional emails and product recommendations — only if you've opted in." },
                  { icon: 'ri-shield-check-line', title: 'Fraud Prevention', text: 'Protect against fraudulent transactions, unauthorised access, and other security threats.' },
                  { icon: 'ri-scales-line', title: 'Legal Compliance', text: 'Comply with legal obligations, respond to lawful requests, enforce our terms, and resolve disputes.' },
                ].map(({ icon, title, text }) => (
                  <div key={title} className="bg-stone-50 p-6">
                    <div className="w-8 h-8 bg-stone-950 flex items-center justify-center mb-4">
                      <i className={`${icon} text-amber-400 text-sm`} />
                    </div>
                    <p className="text-[9px] font-black tracking-[0.3em] uppercase text-stone-700 mb-2">{title}</p>
                    <p className="text-stone-500 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="sharing">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">03</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Information Sharing & Disclosure</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">We do not sell your personal information. We may share your data with:</p>

              <div className="space-y-6">
                {[
                  { title: 'Service Providers', text: 'Trusted third parties who help us operate our business — payment processors, delivery partners, email service providers, analytics tools. They are contractually bound to protect your data.' },
                  { title: 'Business Transfers', text: 'If we merge with or are acquired by another company, your information may be transferred as part of the transaction. We will notify you of any such change.' },
                  { title: 'Legal Requirements', text: 'When required by law or to protect our rights, property, or safety, or that of our customers or others.' },
                  { title: 'With Your Consent', text: 'Any other disclosures will be made only with your explicit consent.' },
                ].map(({ title, text }) => (
                  <div key={title} className="flex gap-6">
                    <div className="w-px bg-amber-400 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-900 mb-2">{title}</p>
                      <p className="text-stone-500 text-sm leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="security">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">04</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Data Security</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">We implement robust security measures to protect your personal information:</p>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {[
                  { icon: 'ri-lock-line', title: 'Encryption', text: 'All data transmitted between your browser and our servers is encrypted using SSL/TLS technology.' },
                  { icon: 'ri-shield-check-line', title: 'Secure Storage', text: 'Your data is stored on secure servers with restricted access and regular security audits.' },
                  { icon: 'ri-bank-card-line', title: 'Payment Security', text: 'We never store your full payment card details. All payments are processed by PCI-DSS compliant providers.' },
                  { icon: 'ri-user-lock-line', title: 'Access Controls', text: 'Only authorised personnel have access to personal data, bound by strict confidentiality obligations.' },
                ].map(({ icon, title, text }) => (
                  <div key={title} className="bg-stone-50 p-6">
                    <div className="w-8 h-8 bg-stone-950 flex items-center justify-center mb-4">
                      <i className={`${icon} text-amber-400 text-sm`} />
                    </div>
                    <p className="text-[9px] font-black tracking-[0.3em] uppercase text-stone-700 mb-2">{title}</p>
                    <p className="text-stone-500 text-sm leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="bg-stone-950 p-6 relative overflow-hidden">
                <span className="pointer-events-none select-none absolute right-4 top-1/2 -translate-y-1/2 text-[80px] font-black text-white/[0.04] leading-none">!</span>
                <p className="text-[9px] font-black tracking-[0.4em] uppercase text-amber-400 mb-2">Important Note</p>
                <p className="text-stone-300 text-sm leading-relaxed">While we implement strong security measures, no method of transmission or storage is 100% secure. We cannot guarantee absolute security but continually work to protect your information.</p>
              </div>
            </section>

            <section id="rights">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">05</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Your Rights & Choices</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">You have the following rights regarding your personal information:</p>

              <div className="space-y-0">
                {[
                  { icon: 'ri-eye-line', title: 'Access', text: 'Request a copy of the personal information we hold about you.' },
                  { icon: 'ri-pencil-line', title: 'Correction', text: 'Update or correct inaccurate or incomplete information.' },
                  { icon: 'ri-delete-bin-line', title: 'Deletion', text: 'Request deletion of your personal information (subject to legal retention requirements).' },
                  { icon: 'ri-mail-close-line', title: 'Marketing Opt-Out', text: 'Unsubscribe from marketing emails at any time using the link in our emails or your account settings.' },
                  { icon: 'ri-download-line', title: 'Data Portability', text: 'Receive your data in a structured, commonly used format.' },
                  { icon: 'ri-hand-coin-line', title: 'Object to Processing', text: 'Object to certain types of data processing, such as direct marketing.' },
                ].map(({ icon, title, text }) => (
                  <div key={title} className="flex items-start gap-5 py-5 border-b border-stone-100 last:border-0">
                    <div className="w-8 h-8 bg-stone-100 flex items-center justify-center flex-shrink-0">
                      <i className={`${icon} text-stone-700 text-sm`} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-900 mb-1">{title}</p>
                      <p className="text-stone-500 text-sm leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-stone-500 text-sm leading-relaxed mt-6">
                To exercise any of these rights, please reach out through your account settings or the contact page. We will respond within 30 days.
              </p>
            </section>

            <section id="cookies">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">06</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Cookies & Tracking</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-8">We use cookies and similar technologies to enhance your browsing experience:</p>

              <div className="space-y-3 mb-6">
                {[
                  { title: 'Essential Cookies', text: 'Required for the website to function properly (e.g., shopping cart, login sessions). These cannot be disabled.' },
                  { title: 'Analytics Cookies', text: 'Help us understand how visitors use our website so we can improve it. These collect anonymous usage data.' },
                  { title: 'Marketing Cookies', text: 'Used to show you relevant advertisements based on your interests. You can opt out through your browser settings.' },
                  { title: 'Preference Cookies', text: 'Remember your preferences and settings (e.g., language, region) to provide a personalised experience.' },
                ].map(({ title, text }) => (
                  <div key={title} className="bg-stone-50 p-5 flex gap-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] font-black tracking-[0.4em] uppercase text-stone-800 mb-1.5">{title}</p>
                      <p className="text-stone-500 text-sm leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-stone-500 text-sm leading-relaxed">
                You can control cookie preferences through your browser settings. However, disabling certain cookies may affect website functionality.
              </p>
            </section>

            <section id="children">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">07</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Children's Privacy</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                Our website is not intended for children under 16 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a child, please contact us immediately and we will delete it.
              </p>
            </section>

            <section id="international">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">08</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">International Data Transfers</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                Your information may be transferred to and processed in countries outside Ghana, including countries that may have different data protection laws. We ensure appropriate safeguards are in place to protect your information in accordance with this privacy policy.
              </p>
            </section>

            <section id="retention">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">09</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Data Retention</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-6">We retain your personal information only for as long as necessary to fulfil the purposes outlined in this policy:</p>

              <div className="space-y-0">
                {[
                  ['Account Information', 'Until you request deletion or close your account'],
                  ['Order History', '7 years for tax and accounting purposes'],
                  ['Marketing Data', 'Until you unsubscribe or request deletion'],
                  ['Analytics Data', 'Typically 26 months'],
                ].map(([label, text]) => (
                  <div key={label} className="flex items-start gap-4 py-4 border-b border-stone-100 last:border-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-[7px] flex-shrink-0" />
                    <p className="text-stone-600 text-sm leading-relaxed"><span className="font-semibold text-stone-900">{label}:</span> {text}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="changes">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">10</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Changes to This Policy</h2>
              <p className="text-stone-600 text-sm leading-relaxed">
                We may update this privacy policy from time to time to reflect changes in our practices or for legal, operational, or regulatory reasons. We will notify you of significant changes by email or through a prominent notice on our website. The &ldquo;Last updated&rdquo; date at the top indicates when the policy was last revised.
              </p>
            </section>

            <section id="contact">
              <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-500 mb-3">11</p>
              <h2 className="font-serif text-2xl lg:text-3xl text-stone-900 italic mb-8">Contact Us</h2>
              <p className="text-stone-600 text-sm leading-relaxed mb-10">
                If you have any questions, concerns, or requests regarding this privacy policy or our data practices, please contact us via the contact page on this website.
              </p>

              <div className="bg-stone-950 p-8 lg:p-10 relative overflow-hidden">
                <span className="pointer-events-none select-none absolute right-6 top-1/2 -translate-y-1/2 text-[140px] font-black text-white/[0.04] leading-none">P</span>
                <p className="text-[9px] font-black tracking-[0.5em] uppercase text-amber-400 mb-4">Your data, protected.</p>
                <p className="font-serif text-xl lg:text-2xl text-white italic mb-6">Questions about how<br />we handle your data?</p>
                <a href="/contact" className="inline-block bg-amber-400 text-stone-950 px-8 py-3 text-[10px] font-black tracking-[0.3em] uppercase hover:bg-amber-300 transition-colors">
                  Get in Touch
                </a>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
