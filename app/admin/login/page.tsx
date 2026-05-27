'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRecaptcha } from '@/hooks/useRecaptcha';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { getToken, verifying } = useRecaptcha();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const isHuman = await getToken('admin_login');
    if (!isHuman) {
      setError('Security verification failed. Please try again.');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax; Secure`;
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax; Secure`;
        router.push('/admin');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-[0.4]" style={{
        backgroundImage: 'linear-gradient(#d6d3d1 1px, transparent 1px), linear-gradient(90deg, #d6d3d1 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/[0.08] rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">

        {/* Logo / brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white border border-stone-200 mb-5 shadow-sm">
            <Link href="/">
              <img src="/logo.png" alt="Luxury Loots GH" className="h-8 w-8 rounded-xl object-cover" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-3 mb-1">
            <div className="w-6 h-px bg-stone-300" />
            <span className="text-stone-500 text-[9px] font-black tracking-[0.55em] uppercase">Admin Access</span>
            <div className="w-6 h-px bg-stone-300" />
          </div>
          <h1 className="font-serif italic text-3xl text-stone-900 mt-3">Welcome Back</h1>
        </div>

        {/* Card */}
        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">

          {error && (
            <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <i className="ri-error-warning-line text-red-500 text-lg flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 text-xs font-bold tracking-wide uppercase mb-0.5">Login Failed</p>
                <p className="text-red-600 text-xs">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">

            {/* Email */}
            <div>
              <label className="block text-[9px] font-black tracking-[0.45em] uppercase text-stone-500 mb-3">
                Email Address
              </label>
              <div className="relative">
                <i className="ri-mail-line absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                  placeholder="admin@adjoa.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[9px] font-black tracking-[0.45em] uppercase text-stone-500 mb-3">
                Password
              </label>
              <div className="relative">
                <i className="ri-lock-line absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 text-sm placeholder:text-stone-400 focus:outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900 transition-colors"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-lg`} />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || verifying}
              className="w-full bg-stone-900 hover:bg-black text-white py-3.5 rounded-xl font-black text-xs tracking-[0.3em] uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading || verifying ? (
                <><i className="ri-loader-4-line animate-spin" /> {verifying ? 'Verifying…' : 'Signing in…'}</>
              ) : (
                <>Access Dashboard <i className="ri-arrow-right-line" /></>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-[10px] font-bold tracking-[0.25em] uppercase text-stone-500 hover:text-stone-900 transition-colors"
          >
            <i className="ri-arrow-left-line mr-1" />Back to Store
          </Link>
        </div>

      </div>
    </div>
  );
}
