import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { dni } = body;

        if (!dni) {
            return NextResponse.json({ error: 'DNI requerido' }, { status: 400 });
        }

        // Use Service Role to bypass RLS (since public users aren't auth'd to read this table directly usually)
        // Or Anon key if we set up RLS for public read. Given the previous setup, we used 'create policy ... for select using (true)'
        // But let's use Service Role to be safe and consistent with Admin API pattern for now, 
        // ensuring we only return specific data.
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data, error } = await supabase
            .from('client_limits')
            .select('full_name, min_amount, max_amount')
            .eq('dni', dni.trim())
            .single();

        if (error || !data) {
            return NextResponse.json({ found: false });
        }

        return NextResponse.json({
            found: true,
            client: {
                fullName: data.full_name,
                minAmount: data.min_amount,
                maxAmount: data.max_amount
            }
        });

    } catch (error: any) {
        console.error('Check Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
