import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    // Initialize Admin Client (Service Role)
    // Hardcoding verified env vars to ensure stability in this critical path
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const email = 'soporte_emergencia@dh.com';

    console.log('[Emergency Bypass] FAST MODE: Generating link for:', email);

    // Generate a fresh Magic Link
    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            // Redirect to /login so the client-side patch allows the hash to pass through
            redirectTo: 'http://localhost:3001/login'
        }
    });

    if (error || !data.properties?.action_link) {
        console.error('[Emergency Bypass] Error:', error);
        return NextResponse.json({ error: 'Failed to generate link', details: error }, { status: 500 });
    }

    const magicLink = data.properties.action_link;
    console.log('[Emergency Bypass] Redirecting browser to:', magicLink);

    // Redirect the user directly to Supabase, letting the browser handle the hop
    return NextResponse.redirect(magicLink);
}
