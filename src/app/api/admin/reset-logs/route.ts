import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { error } = await supabase
            .from('simulations_log')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete ALL rows securely

        if (error) throw error;

        return NextResponse.json({ message: 'CONTADOR RESETEADO A CERO. Todos los logs borrados.' }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
