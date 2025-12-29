import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
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
            .from('app_config')
            .select('value')
            .eq('key', 'rates_config')
            .single();

        if (error) {
            // If not found, return null (client handles defaults)
            if (error.code === 'PGRST116') {
                return NextResponse.json({ value: null });
            }
            throw error;
        }

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Config Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rates } = body;

        if (!rates) {
            return NextResponse.json({ error: 'Missing rates data' }, { status: 400 });
        }

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
            .from('app_config')
            .upsert({
                key: 'rates_config',
                value: rates
            }, {
                onConflict: 'key'
            });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Config Save Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
