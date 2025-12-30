"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Users, FileText, TrendingUp, Activity } from 'lucide-react';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        users: 0,
        simulations: 0,
        todaySimulations: 0,
        topUsers: [] as any[]
    });

    const { user } = useAuth();
    const router = useRouter();



    useEffect(() => {
        if (user?.user_metadata?.role !== 'admin') return;

        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                } else {
                    console.error("Failed to fetch stats");
                }
            } catch (e) {
                console.error("Error fetching stats:", e);
            }
        }

        fetchStats();
    }, [user]);

    const cards = [
        { label: 'Usuarios Activos', value: stats.users, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { label: 'Simulaciones Totales', value: stats.simulations, icon: FileText, color: 'text-dh-gold', bg: 'bg-dh-gold/10' },
        { label: 'Simulaciones Hoy', value: stats.todaySimulations, icon: Activity, color: 'text-green-400', bg: 'bg-green-400/10' },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-black text-white tracking-tight">Dashboard</h2>
                <p className="text-gray-400 mt-1">Resumen de actividad en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cards.map((card) => (
                    <div key={card.label} className="bg-dh-gray/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${card.bg}`}>
                            <card.icon className={`w-7 h-7 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 uppercase tracking-wider font-medium">{card.label}</p>
                            <p className="text-3xl font-bold text-white">{card.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ranking Chart */}
                <div className="bg-dh-gray/30 rounded-2xl border border-white/5 p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-dh-gold" />
                        Top Asesores
                    </h3>

                    <div className="space-y-4">
                        {stats.topUsers?.length > 0 ? (
                            stats.topUsers.map((u: any, i: number) => (
                                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-dh-gold/20 flex items-center justify-center text-dh-gold font-bold text-xs">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{u.email}</p>
                                            <p className="text-xs text-gray-500">{u.count} simulaciones</p>
                                        </div>
                                    </div>
                                    <div className="text-dh-gold font-bold">
                                        {u.count}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-sm text-center py-4">Aún no hay actividad registrada.</p>
                        )}
                    </div>
                </div>

                {/* Info Card */}
                <div className="bg-gradient-to-br from-dh-gold/10 to-transparent rounded-2xl border border-dh-gold/20 p-8 flex flex-col justify-center text-center">
                    <Activity className="w-12 h-12 text-dh-gold mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">Monitor de Actividad</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        Cada vez que un asesor (conectado) descarga un flyer, se registra automáticamente aquí. Las simulaciones públicas no anónimas no se contabilizan.
                    </p>

                    <button
                        onClick={async () => {
                            if (!window.confirm("¿Estás seguro de BORRAR el historial de simulaciones para empezar de cero?")) return;

                            try {
                                const res = await fetch('/api/admin/reset-logs');
                                if (res.ok) {
                                    alert("✅ Historial reseteado correctamente.");
                                    window.location.reload();
                                } else {
                                    alert("❌ Error al resetear.");
                                }
                            } catch (e) {
                                console.error(e);
                                alert("❌ Error de conexión.");
                            }
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold transition-all border border-red-500/20 mx-auto"
                    >
                        🗑️ Resetear Contador a Cero
                    </button>
                </div>
            </div>
        </div>
    );
}
