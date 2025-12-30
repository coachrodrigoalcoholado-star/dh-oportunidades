
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })

    // Refresh session
    const { data: { session } } = await supabase.auth.getSession()

    console.log('MIDDLEWARE TEST:', req.nextUrl.pathname, 'Session:', !!session)

    // 1. If accessing login while authenticated, redirect to admin
    if (session && req.nextUrl.pathname === '/login') {
        console.log('Redirecting to ADMIN')
        return NextResponse.redirect(new URL('/admin', req.url))
    }

    // 2. If accessing protected routes (admin or root) while NOT authenticated, redirect to login
    // We protect everything except public assets, api (some might be public), and login
    // We protect everything except public assets, api (some might be public), and login
    const isPublic = req.nextUrl.pathname === '/login' ||
        req.nextUrl.pathname === '/publico' || // Public Simulator
        req.nextUrl.pathname.startsWith('/_next') ||
        req.nextUrl.pathname.startsWith('/api') ||
        req.nextUrl.pathname.includes('.'); // files like favicon.ico, images

    // TEMPORARY: Disabled Middleware Protection to debug Client Auth
    if (!session && !isPublic) {
        console.log('Redirecting to LOGIN')
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return res
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
