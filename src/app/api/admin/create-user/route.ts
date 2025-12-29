
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Use SERVICE_ROLE key for admin actions (bypassing RLS/Auth restrictions)
export async function POST(req: Request) {
    try {
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!adminKey || !supabaseUrl) {
            console.error('CRITICAL: Missing Server Env Vars');
            console.error('URL:', supabaseUrl);
            console.error('KEY Length:', adminKey?.length); // Log length to see if it exists but is empty
            return NextResponse.json({ error: 'Configuración de servidor incompleta (Falta Service Role)' }, { status: 500 });
        }

        // Initialize here to catch errors
        const supabaseAdmin = createClient(supabaseUrl, adminKey);

        const body = await req.json()
        const { email, password, role = 'agent' } = body

        if (!email || !password) {
            return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
        }

        // 1. Create User in Supabase Auth
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true // Auto-confirm for admin-created users
        })

        if (userError) {
            return NextResponse.json({ error: userError.message }, { status: 400 })
        }

        if (!userData.user) {
            return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 500 })
        }

        // 2. Create Profile record (if you have a profiles table)
        // We attempt to insert, but ignore if it fails (maybe trigger handles it)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userData.user.id,
                email: email,
                role: role,
                full_name: email.split('@')[0] // Default name
            })

        if (profileError) {
            console.error("Error creating profile:", profileError)
            // We don't fail the request, but valid warning
        }

        return NextResponse.json({ user: userData.user }, { status: 200 })

    } catch (error: any) {
        console.error('Create user error:', error)
        return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 })
    }
}
