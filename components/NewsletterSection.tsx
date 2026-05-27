"use client";

import { useState } from 'react';
import Image from 'next/image';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSubmitStatus('success');
      setEmail('');
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative bg-stone-50 overflow-hidden border-t border-stone-200">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px]">
        
        {/* Left Side: Image (Hidden on small mobile, visible on sm+) */}
        <div className="relative hidden sm:block h-[400px] lg:h-auto overflow-hidden group">
          <Image 
            src="/newsletter_ghanaian.png" 
            alt="Stay in the loop" 
            fill 
            className="object-cover object-center group-hover:scale-105 transition-transform duration-[2000ms] ease-out"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-8 left-8 flex flex-col gap-2 z-10 mix-blend-difference">
            <span className="text-white text-[10px] font-black tracking-[0.4em] uppercase">The Inner Circle</span>
            <div className="w-10 h-px bg-white/50" />
          </div>
        </div>

        {/* Right Side: Content & Form */}
        <div className="flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-16 lg:py-24 bg-white relative">
          
          {/* Subtle background element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-stone-50 rounded-bl-full opacity-70 pointer-events-none" />

          <div className="relative z-10 max-w-lg w-full mx-auto lg:mx-0">
            {/* Tagline */}
            <div className="flex items-center gap-4 mb-8">
              <span className="w-12 h-[1px] bg-stone-900" />
              <span className="text-stone-900 text-[10px] font-bold tracking-[0.4em] uppercase">Join The Club</span>
            </div>

            {/* Heading */}
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-[3.5rem] text-stone-900 leading-[1.1] mb-6">
              Exclusive Drops <br />
              <span className="italic font-light text-stone-400">& 10% Off</span>
            </h2>

            <p className="text-stone-500 text-sm md:text-base font-light leading-relaxed mb-12">
              Be the first to know about new thrift finds, restocks and member-only deals. No spam — just pure style delivered straight to your inbox.
            </p>

            {/* Form */}
            {submitStatus === 'success' ? (
              <div className="bg-stone-50 border border-stone-200 p-8 rounded-2xl flex flex-col items-center gap-4 text-center">
                <div className="w-14 h-14 rounded-full bg-stone-900 flex items-center justify-center">
                  <i className="ri-check-line text-white text-2xl" />
                </div>
                <div>
                  <p className="text-stone-900 text-xl font-serif font-medium mb-1">Welcome to the inner circle.</p>
                  <p className="text-stone-500 text-sm">Check your inbox — your 10% code is on its way.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative w-full">
                <div className="flex flex-col gap-6">
                  <div className="relative group">
                    <label htmlFor="newsletter-email" className="sr-only">Email address</label>
                    <input
                      id="newsletter-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full bg-transparent border-b-2 border-stone-200 pb-3 text-stone-900 placeholder:text-stone-400 text-base md:text-lg font-medium focus:outline-none focus:border-stone-900 transition-colors duration-300 pr-12"
                    />
                    <i className="ri-mail-line absolute right-2 top-0 text-stone-300 text-xl group-focus-within:text-stone-900 transition-colors duration-300" />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-fit inline-flex items-center justify-center gap-4 bg-stone-900 hover:bg-black text-white px-10 py-4 text-[11px] font-black tracking-[0.3em] uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><i className="ri-loader-4-line animate-spin" /> Submitting…</>
                    ) : (
                      <>
                        Subscribe Now
                        <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform duration-300" />
                      </>
                    )}
                  </button>
                </div>

                {submitStatus === 'error' && (
                  <p className="text-red-500 text-xs flex items-center gap-2 mt-4 font-medium">
                    <i className="ri-error-warning-line" /> Something went wrong. Please try again.
                  </p>
                )}

                {/* Trust signals */}
                <div className="flex flex-wrap items-center gap-6 mt-10 pt-6 border-t border-stone-100">
                  {[
                    { icon: 'ri-mail-check-line', label: 'No spam, ever' },
                    { icon: 'ri-lock-line', label: 'Unsubscribe anytime' },
                  ].map(t => (
                    <div key={t.label} className="flex items-center gap-2 text-stone-500 text-[11px] font-medium tracking-wide">
                      <i className={`${t.icon} text-stone-400 text-lg`} />
                      <span>{t.label}</span>
                    </div>
                  ))}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
