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

        // Fetch user count
        const { count: userCount, error: userError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Fetch total simulations
        const { count: simCount, error: simError } = await supabase
            .from('simulations_log')
            .select('*', { count: 'exact', head: true });

        if (userError) throw userError;
        if (simError) throw simError;

        // Fetch today's simulations
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount, error: todayError } = await supabase
            .from('simulations_log')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        if (todayError) throw todayError;

        // Fetch top users aggregation
        const { data: logs, error: logsError } = await supabase
            .from('simulations_log')
            .select('user_id')
            .not('user_id', 'is', null);

        if (logsError) throw logsError;

        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, email');

        const userStatsCheck: Record<string, number> = {};
        logs?.forEach((log: any) => {
            const uid = log.user_id;
            userStatsCheck[uid] = (userStatsCheck[uid] || 0) + 1;
        });

        const topUsersList = Object.entries(userStatsCheck)
            .map(([uid, count]) => {
                const profile = profiles?.find(p => p.id === uid);
                return {
                    id: uid,
                    email: profile?.email || 'Unknown',
                    count
                };
            })
            .sort((a, b) => b.count - a.count);

        return NextResponse.json({
            users: userCount || 0,
            simulations: simCount || 0,
            todaySimulations: todayCount || 0,
            topUsers: topUsersList
        });

    } catch (error: any) {
        console.error('Stats API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
