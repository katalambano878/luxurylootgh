import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// The middleware runs on the edge and cannot reach the database. It checks the
// session signature itself, then asks the app (same container, over loopback)
// for the live role, so a demoted or banned staff member loses the dashboard
// at once. Any failure denies access: there is no fail-open path.
const INTERNAL_ORIGIN = `http://127.0.0.1:${process.env.PORT || 3000}`;

const ROLE_CACHE_TTL_MS = 30 * 1000;
const roleCache = new Map<string, { userId: string; role: string; fetchedAt: number }>();

async function getRoleFromToken(token: string): Promise<{ userId: string; role: string } | null> {
    const secret = process.env.AUTH_JWT_SECRET || process.env.JWT_SECRET;
    if (!secret) return null;
    try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
        if (payload.typ === 'refresh' || typeof payload.sub !== 'string') return null;
    } catch {
        return null;
    }

    const now = Date.now();
    const cached = roleCache.get(token);
    if (cached && now - cached.fetchedAt < ROLE_CACHE_TTL_MS) {
        return { userId: cached.userId, role: cached.role };
    }
    try {
        const res = await fetch(`${INTERNAL_ORIGIN}/api/auth/session-role`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
        });
        if (!res.ok) return null;
        const body = (await res.json()) as { userId?: string; role?: string };
        if (!body.userId || !body.role) return null;
        if (roleCache.size > 500) roleCache.clear();
        roleCache.set(token, { userId: body.userId, role: body.role, fetchedAt: now });
        return { userId: body.userId, role: body.role };
    } catch {
        return null;
    }
}

function redirectToLogin(request: NextRequest, error?: string) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    if (error) loginUrl.searchParams.set('error', error);
    return NextResponse.redirect(loginUrl);
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const response = NextResponse.next();

    // ============================================================
    // Security headers for ALL routes
    // ============================================================
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // ============================================================
    // Admin route protection
    // ============================================================
    if (pathname.startsWith('/admin')) {
        response.headers.set('X-Robots-Tag', 'noindex, nofollow');
        response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');

        if (pathname === '/admin/login') {
            return response;
        }

        // Set by the admin login page and kept fresh by the admin layout.
        const token = request.cookies.get('sb-access-token')?.value;
        if (!token) return redirectToLogin(request);

        const auth = await getRoleFromToken(token);
        if (!auth) return redirectToLogin(request, 'session_expired');
        if (auth.role !== 'admin' && auth.role !== 'staff') {
            return redirectToLogin(request, 'unauthorized');
        }

        response.headers.set('x-user-id', auth.userId);
        response.headers.set('x-user-role', auth.role);
    }

    // ============================================================
    // API route security headers
    // ============================================================
    if (pathname.startsWith('/api/')) {
        response.headers.set('Cache-Control', 'no-store');
    }

    return response;
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/:path*',
    ],
};
