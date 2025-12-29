
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!adminKey || !supabaseUrl) {
            return NextResponse.json({ error: 'Configuración de servidor incompleta (Service Role)' }, { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, adminKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const id = params.id;
        const body = await req.json();
        const { password } = body;

        if (!id || !password) {
            return NextResponse.json({ error: 'ID y nueva contraseña requeridos' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
        }

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: password
        });

        if (updateError) {
            console.error('Error updating password:', updateError);
            return NextResponse.json({ error: updateError.message }, { status: 400 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
