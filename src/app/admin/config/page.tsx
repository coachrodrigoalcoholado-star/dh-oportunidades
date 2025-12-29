"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface RateConfig {
    [installments: number]: number; // 6: 0.47
}

export default function ConfigPage() {
    const [rates, setRates] = useState<RateConfig>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newInstallment, setNewInstallment] = useState('');
    const [newRate, setNewRate] = useState('');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();

            if (data.value) {
                setRates(data.value);
            } else {
                // Fallback default
                setRates({
                    4: 0.35,
                    6: 0.47,
                    8: 0.65,
                    10: 0.85
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rates }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al guardar');

            alert('Configuración guardada correctamente');
        } catch (err: any) {
            alert('Error al guardar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const addInstallment = () => {
        const inst = parseInt(newInstallment);
        const rate = parseFloat(newRate);
        if (inst && !isNaN(rate)) {
            setRates(prev => ({ ...prev, [inst]: rate }));
            setNewInstallment('');
            setNewRate('');
        }
    };

    const removeInstallment = (key: string) => {
        setRates(prev => {
            const next = { ...prev };
            delete next[parseInt(key)];
            return next;
        });
    };

    if (loading) return <div className="text-white">Cargando configuración...</div>;

    return (
        <div className="max-w-4xl">
            <header className="mb-8">
                <h2 className="text-3xl font-black text-white tracking-tight">Configuración del Simulador</h2>
                <p className="text-gray-400 mt-1">Administra las cuotas disponibles y sus tasas de interés.</p>
            </header>

            <div className="grid gap-8">
                {/* RATES CONFIG */}
                <section className="bg-dh-gray/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="w-1 h-6 bg-dh-gold rounded-full" />
                            Tasas de Interés
                        </h3>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-dh-gold hover:bg-yellow-600 text-black font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 mb-2 text-xs text-gray-500 uppercase tracking-wider font-bold px-4">
                            <div>Cuotas</div>
                            <div>Tasa (Coeficiente)</div>
                            <div className="text-right">Acciones</div>
                        </div>

                        {Object.entries(rates).sort((a, b) => Number(a[0]) - Number(b[0])).map(([key, value]) => (
                            <motion.div
                                layout
                                key={key}
                                className="grid grid-cols-3 gap-4 items-center bg-black/20 p-4 rounded-xl border border-white/5"
                            >
                                <div className="font-mono text-xl text-white font-bold">{key} cuotas</div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={value}
                                        onChange={(e) => setRates({ ...rates, [parseInt(key)]: parseFloat(e.target.value) })}
                                        className="bg-transparent border-b border-gray-600 focus:border-dh-gold text-dh-gold font-mono text-lg w-20 outline-none text-center"
                                    />
                                    <span className="text-gray-600 text-xs">({(value * 100).toFixed(0)}%)</span>
                                </div>
                                <div className="text-right">
                                    <button
                                        onClick={() => removeInstallment(key)}
                                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {/* ADD NEW */}
                        <div className="grid grid-cols-3 gap-4 items-center bg-dh-gold/5 p-4 rounded-xl border border-dh-gold/20 border-dashed mt-4">
                            <div>
                                <input
                                    type="number"
                                    placeholder="N° Cuotas"
                                    value={newInstallment}
                                    onChange={(e) => setNewInstallment(e.target.value)}
                                    className="bg-transparent border-b border-gray-600 focus:border-dh-gold text-white w-full outline-none placeholder:text-gray-600"
                                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    step="0.01"
                                    placeholder="Tasa (ej: 0.45)"
                                    value={newRate}
                                    onChange={(e) => setNewRate(e.target.value)}
                                    className="bg-transparent border-b border-gray-600 focus:border-dh-gold text-white w-full outline-none placeholder:text-gray-600"
                                />
                            </div>
                            <div className="text-right">
                                <button
                                    onClick={addInstallment}
                                    disabled={!newInstallment || !newRate}
                                    className="text-dh-gold hover:text-white disabled:opacity-30 disabled:hover:text-dh-gold transition-colors"
                                >
                                    <Plus className="w-6 h-6 ml-auto" />
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex gap-3 text-blue-300 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>
                        Los cambios impactan inmediatamente en el simulador público. Asegúrate de verificar las tasas antes de guardar.
                    </p>
                </div>
            </div>
        </div>
    );
}
