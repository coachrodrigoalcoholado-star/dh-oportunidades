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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { clients } = body;

        if (!Array.isArray(clients) || clients.length === 0) {
            return NextResponse.json({ error: 'No se recibieron clientes para procesar' }, { status: 400 });
        }

        // Sanitize and format data
        const formattedClients = clients
            .filter((c: any) => c.dni && String(c.dni).trim().length > 0)
            .map((c: any) => {
                const dniClean = String(c.dni).replace(/\D/g, '').trim();
                const minVal = typeof c.minAmount === 'number' ? c.minAmount : parseFloat(String(c.minAmount || '').replace(/\./g, ''));
                const maxVal = typeof c.maxAmount === 'number' ? c.maxAmount : parseFloat(String(c.maxAmount || '').replace(/\./g, ''));

                return {
                    dni: dniClean,
                    full_name: c.fullName ? String(c.fullName).trim() : 'CLIENTE',
                    min_amount: !isNaN(minVal) && minVal >= 0 ? minVal : 50000,
                    max_amount: !isNaN(maxVal) && maxVal >= 0 ? maxVal : 2000000
                };
            })
            .filter((c: any) => c.dni.length >= 5); // Must have valid DNI length

        if (formattedClients.length === 0) {
            return NextResponse.json({ error: 'Ningún cliente de la lista contiene un DNI válido' }, { status: 400 });
        }

        // Process in batches of 500
        const BATCH_SIZE = 500;
        let insertedCount = 0;

        for (let i = 0; i < formattedClients.length; i += BATCH_SIZE) {
            const batch = formattedClients.slice(i, i + BATCH_SIZE);
            const { error } = await supabase
                .from('client_limits')
                .upsert(batch, { onConflict: 'dni' });

            if (error) {
                console.error('Batch Upsert Error:', error);
                throw error;
            }
            insertedCount += batch.length;
        }

        return NextResponse.json({ success: true, count: insertedCount });

    } catch (error: any) {
        console.error('Bulk Import Error:', error);
        return NextResponse.json({ error: error.message || 'Error al procesar carga masiva' }, { status: 500 });
    }
}
