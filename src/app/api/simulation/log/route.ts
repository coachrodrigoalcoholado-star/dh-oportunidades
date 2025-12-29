import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { userId, amount, installments, metadata } = body;

        if (!userId || !amount) {
            return NextResponse.json({ error: 'Missing required data' }, { status: 400 });
        }

        // Initialize Supabase with Service Role Key to bypass RLS
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

        const { error } = await supabase
            .from('simulations_log')
            .insert({
                user_id: userId,
                amount: amount,
                installments_selected: installments || 0,
                metadata: metadata || {},
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('Supabase Insert Error:', error);
            throw error;
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Simulation Log Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
