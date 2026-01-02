"use client";

import { useState } from 'react';
import Simulator from '@/components/Simulator';
import FootwearSimulator from '@/components/FootwearSimulator';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ShoppingBag } from 'lucide-react';

export default function AdminSimulatorPage() {
    const [mode, setMode] = useState<'loans' | 'footwear'>('loans');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center md:text-left">
                <h2 className="text-3xl font-black text-white tracking-tight">Simulador DH</h2>
                <p className="text-gray-400 mt-1">Herramienta interna para cotizaciones rápidas.</p>
            </header>

            {/* Mode Toggle */}
            <div className="flex p-1 bg-black/40 backdrop-blur border border-white/10 rounded-2xl w-full max-w-md mx-auto relative">
                {/* Active Indicator */}
                <motion.div
                    layout
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    className={`absolute inset-1 w-[calc(50%-4px)] bg-gradient-to-br rounded-xl shadow-lg z-0 ${mode === 'loans' ? 'from-dh-gold/20 to-dh-gold/5 border border-dh-gold/20' : 'translate-x-[100%] from-indigo-500/20 to-indigo-500/5 border border-indigo-500/20'
                        }`}
                />

                <button
                    onClick={() => setMode('loans')}
                    className={`relative z-10 flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-colors ${mode === 'loans' ? 'text-dh-gold font-bold' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <Wallet className="w-5 h-5" />
                    Préstamos
                </button>

                <button
                    onClick={() => setMode('footwear')}
                    className={`relative z-10 flex-1 py-3 flex items-center justify-center gap-2 rounded-xl transition-colors ${mode === 'footwear' ? 'text-indigo-400 font-bold' : 'text-gray-500 hover:text-white'
                        }`}
                >
                    <ShoppingBag className="w-5 h-5" />
                    Calzado
                </button>
            </div>

            {/* Simulator Container */}
            <div className="pb-12">
                <AnimatePresence mode="wait">
                    {mode === 'loans' ? (
                        <motion.div
                            key="loans"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Simulator forcedMode="loans" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="footwear"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <FootwearSimulator />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
