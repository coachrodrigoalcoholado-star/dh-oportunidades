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

        // Fetch both configs
        const { data, error } = await supabase
            .from('app_config')
            .select('key, value')
            .in('key', ['rates_config', 'footwear_config']);

        if (error) throw error;

        // Transform to easy object
        const config = {
            rates: data?.find(d => d.key === 'rates_config')?.value || null,
            footwear: data?.find(d => d.key === 'footwear_config')?.value || null
        };

        return NextResponse.json(config);

    } catch (error: any) {
        console.error('Config Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { rates, footwear } = body;

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

        const updates = [];

        if (rates) {
            updates.push(supabase.from('app_config').upsert({ key: 'rates_config', value: rates }, { onConflict: 'key' }));
        }

        if (footwear) {
            updates.push(supabase.from('app_config').upsert({ key: 'footwear_config', value: footwear }, { onConflict: 'key' }));
        }

        if (updates.length > 0) {
            await Promise.all(updates);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Config Save Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
