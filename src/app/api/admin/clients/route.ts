import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

// CREATE (POST)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { dni, fullName, maxAmount, minAmount } = body;

        if (!dni || !maxAmount) {
            return NextResponse.json({ error: 'DNI and Amount are required' }, { status: 400 });
        }

        // Upsert allows updating if DNI already exists (logic kept for simple "Add" form)
        const { data, error } = await supabase
            .from('client_limits')
            .upsert({
                dni: dni.trim(),
                full_name: fullName?.trim(),
                max_amount: parseFloat(maxAmount),
                min_amount: parseFloat(minAmount || 50000)
            }, { onConflict: 'dni' })
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Client Save Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// UPDATE (PUT) - Updates by ID (allowing DNI change)
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, dni, fullName, maxAmount, minAmount } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { data, error } = await supabase
            .from('client_limits')
            .update({
                dni: dni?.trim(),
                full_name: fullName?.trim(),
                max_amount: maxAmount ? parseFloat(maxAmount) : undefined,
                min_amount: minAmount ? parseFloat(minAmount) : undefined
            })
            .eq('id', id)
            .select();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Update Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const { error } = await supabase
            .from('client_limits')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        // Fetch ALL clients? (Or paginate. For now fetch max 1000 to allow search)
        const { data, error } = await supabase
            .from('client_limits')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) throw error;

        return NextResponse.json(data);

    } catch (error: any) {
        console.error('Client Fetch Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
