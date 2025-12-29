
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function DELETE(
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

        if (!id) {
            return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
        }

        // 1. Delete from Auth (Primary)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);

        if (authError) {
            console.error('Error deleting auth user:', authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. Delete from Profiles (Secondary - explicit cleanup if cascade doesn't exist)
        // We do this just in case, though usually foreign keys handle it.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', id);

        if (profileError) {
            console.warn('Error cleaning up profile (might be already deleted by cascade):', profileError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Delete user error:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
