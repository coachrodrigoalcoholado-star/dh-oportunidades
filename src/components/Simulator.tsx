"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, DollarSign, Calculator, LogOut, LayoutDashboard, ShoppingBag, Wallet } from "lucide-react";
import { toBlob } from "html-to-image";
import { saveAs } from "file-saver";
import { useAuth } from "@/contexts/AuthContext";

interface LoanResult {
    installments: number;
    total: number;
    installmentValue: number;
}

interface RateConfig {
    [key: number]: number; // 6: 0.47
}

interface FootwearConfig {
    markup: number;
    quotas: number[];
}

const DEFAULT_RATES: RateConfig = { 4: 0.35, 6: 0.47, 8: 0.65, 10: 0.85 };
const DEFAULT_FOOTWEAR: FootwearConfig = { markup: 100, quotas: [3, 6] };

export default function Simulator() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const isAdmin = user?.user_metadata?.role === 'admin';

    // State
    const [mode, setMode] = useState<'loans' | 'footwear'>('loans');
    const [amount, setAmount] = useState<string>("");
    const [footwearDetails, setFootwearDetails] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [rates, setRates] = useState<RateConfig>(DEFAULT_RATES);
    const [footwearConfig, setFootwearConfig] = useState<FootwearConfig>(DEFAULT_FOOTWEAR);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();

            if (data?.rates) setRates(data.rates);
            if (data?.footwear) setFootwearConfig(data.footwear);
        } catch (error) {
            console.error("Using default config due to error:", error);
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        if (!rawValue) {
            setAmount("");
            return;
        }
        const numericValue = parseInt(rawValue, 10);
        setAmount(numericValue.toLocaleString("es-AR"));
    };

    const getNumericAmount = () => {
        if (!amount) return 0;
        return parseInt(amount.replace(/\./g, "").replace(/,/g, ""), 10);
    };

    const calculateLoan = (capital: number, installments: number): LoanResult => {
        const rate = rates[installments] || 0.50;
        const total = capital + (capital * rate);
        const installmentValue = total / installments;
        return { installments, total, installmentValue };
    };

    const calculateFootwear = (capital: number, installments: number): LoanResult => {
        // Footwear Logic: (Base * Markup) / Installments. NO Interest on top of markup.
        const markupMultiplier = 1 + (footwearConfig.markup / 100);
        const total = capital * markupMultiplier;
        const installmentValue = total / installments;
        return { installments, total, installmentValue };
    };

    const logSimulation = async (action: 'view' | 'download') => {
        if (!user) return;
        try {
            await fetch('/api/simulation/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    amount: getNumericAmount(),
                    installments: 0,
                    metadata: { action, mode, details: footwearDetails }
                })
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            const node = document.getElementById("flyer-export");
            if (!node) throw new Error("flyer-export no encontrado");
            if (document.fonts) await document.fonts.ready;

            const blob = await toBlob(node, {
                quality: 0.95,
                backgroundColor: "#020617",
                cacheBust: true,
                style: {
                    backgroundColor: "#020617",
                    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #000000)",
                }
            });

            if (!blob) throw new Error("No se pudo generar el archivo.");
            const cleanAmount = amount.replace(/\./g, "").replace(/,/g, "");

            let filename;
            if (mode === 'loans') {
                filename = `PRESTAMO_DH_${cleanAmount}.jpg`;
            } else {
                filename = `CALZADOS - DH OPORTUNIDADES.jpg`;
            }

            saveAs(blob, filename);

            setIsGenerating(false);
            logSimulation('download');
        } catch (error: any) {
            alert(`Error: ${error.message}`);
            setIsGenerating(false);
        }
    };

    const hasAmount = getNumericAmount() > 0;

    // Determine active installments based on mode
    const activeInstallments = mode === 'loans'
        ? Object.keys(rates).map(Number).sort((a, b) => a - b)
        : (footwearConfig.quotas || []).sort((a, b) => a - b);

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 relative">

            {/* HEADER / USER ACTIONS */}
            {user && (
                <div className="flex justify-between items-center w-full mb-2">
                    <span className="text-xs font-mono text-gray-500">{user.email?.split('@')[0]}</span>
                    {isAdmin ? (
                        <button onClick={() => router.push('/admin')} className="action-btn">
                            <LayoutDashboard className="w-3 h-3" /> Panel
                        </button>
                    ) : (
                        <button onClick={() => signOut()} className="action-btn-red">
                            <LogOut className="w-3 h-3" /> Salir
                        </button>
                    )}
                </div>
            )}

            {/* TABS */}
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl backdrop-blur-md border border-white/10">
                <button
                    onClick={() => { setMode('loans'); setAmount(''); setFootwearDetails(''); }}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'loans' ? 'bg-dh-gold text-black shadow-lg shadow-dh-gold/20' : 'text-gray-400 hover:text-white'}`}
                >
                    <Wallet className="w-4 h-4" />
                    Préstamos
                </button>
                <button
                    onClick={() => { setMode('footwear'); setAmount(''); }}
                    className={`flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${mode === 'footwear' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-white'}`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Calzado
                </button>
            </div>

            {/* AMOUNT & DETAILS INPUT */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-dh-gray/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl space-y-4"
            >
                {/* Amount Field */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-gray-400 text-sm font-uppercase tracking-wider">
                            {mode === 'loans' ? 'Monto a Solicitar' : 'Precio del Calzado'}
                        </label>
                        {loadingConfig && <span className="text-xs text-dh-gold animate-pulse">Sync...</span>}
                    </div>
                    <div className="relative">
                        <DollarSign className={`absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 ${mode === 'loans' ? 'text-dh-gold' : 'text-indigo-500'}`} />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className={`w-full bg-transparent border-b-2 focus:border-opacity-100 border-white/10 text-3xl sm:text-4xl font-bold text-white pl-10 py-4 outline-none transition-colors placeholder:text-gray-700 ${mode === 'loans' ? 'focus:border-dh-gold' : 'focus:border-indigo-500'}`}
                        />
                    </div>
                </div>

                {/* Footwear Details Field */}
                {mode === 'footwear' && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="pt-2"
                    >
                        <label className="text-gray-400 text-sm font-uppercase tracking-wider mb-2 block">Detalle (Modelo/Talle)</label>
                        <input
                            type="text"
                            value={footwearDetails}
                            onChange={(e) => setFootwearDetails(e.target.value)}
                            placeholder="Ej: NIKE AIR - 42 - BLANCA"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 outline-none text-sm placeholder:text-gray-600"
                            maxLength={40}
                        />
                    </motion.div>
                )}
            </motion.div>

            {/* FLYER PREVIEW */}
            <AnimatePresence>
                {hasAmount && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div className="animate-float mb-6">
                            <div
                                ref={cardRef}
                                id="flyer-export"
                                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl"
                                style={{
                                    backgroundColor: "#020617",
                                    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #000000)",
                                    border: mode === 'loans' ? "1px solid rgba(212, 175, 55, 0.3)" : "1px solid rgba(99, 102, 241, 0.3)",
                                    color: "#ffffff"
                                }}
                            >
                                {/* Watermarks */}
                                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"
                                    style={{ background: mode === 'loans' ? "rgba(212, 175, 55, 0.05)" : "rgba(99, 102, 241, 0.1)" }} />

                                <div className="flex flex-col items-center mb-8 relative z-10">
                                    <img src="/logo-new.png" alt="DH" className="h-28 object-contain drop-shadow-2xl mb-3" crossOrigin="anonymous" />
                                    <div className="h-px w-24" style={{ background: `linear-gradient(to right, transparent, ${mode === 'loans' ? '#D4AF37' : '#6366f1'}, transparent)` }} />
                                </div>

                                {/* Header Info */}
                                <div className="text-center mb-6 relative z-10">
                                    <p style={{ color: "#9ca3af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                                        {mode === 'loans' ? 'Capital Solicitado' : 'CALZADO'}
                                    </p>

                                    {mode === 'loans' ? (
                                        <p className="font-mono mt-1" style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffffff" }}>
                                            ${getNumericAmount().toLocaleString('es-AR')}
                                        </p>
                                    ) : (
                                        <p className="font-bold mt-1 tracking-wide uppercase" style={{ fontSize: "1.5rem", color: "#ffffff", lineHeight: "1.2" }}>
                                            {footwearDetails || '---'}
                                        </p>
                                    )}
                                </div>

                                {/* Installments List */}
                                <div className="flex flex-col gap-3 relative z-10 w-full mt-6">
                                    {activeInstallments.map((num) => {
                                        const data = mode === 'loans'
                                            ? calculateLoan(getNumericAmount(), num)
                                            : calculateFootwear(getNumericAmount(), num);

                                        return (
                                            <div key={num}
                                                className="flex items-center justify-between rounded-xl px-4 py-3 sm:px-6 sm:py-4 scale-100 sm:hover:scale-105 transition-transform"
                                                style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.1)" }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center rounded-full shadow-lg"
                                                        style={{
                                                            backgroundColor: mode === 'loans' ? "#D4AF37" : "#6366f1",
                                                            color: "#ffffff",
                                                            width: "2.5rem", height: "2.5rem", fontWeight: "900", fontSize: "1.25rem"
                                                        }}>
                                                        {num}
                                                    </div>
                                                    <div style={{ color: "#d1d5db", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase" }}>
                                                        Cuotas de
                                                    </div>
                                                </div>
                                                <div className="font-mono" style={{
                                                    fontSize: "1.5rem", fontWeight: "900",
                                                    color: mode === 'loans' ? "#D4AF37" : "#6366f1",
                                                }}>
                                                    ${data.installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 pt-4 border-t text-center relative z-10 border-white/10">
                                    <p style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                                        Propuesta Válida por 24hs
                                    </p>
                                    <p className="font-bold text-sm text-white">DH OPORTUNIDADES</p>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className={`w-full font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all ${mode === 'loans'
                                ? 'bg-gradient-to-r from-dh-gold to-yellow-600 text-black shadow-dh-gold/20'
                                : 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-indigo-500/20'
                                } ${isGenerating ? 'opacity-80' : ''}`}
                        >
                            <Download className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
                            <span>{isGenerating ? 'Generando...' : 'Descargar Flyer'}</span>
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .action-btn { @apply flex items-center gap-2 text-xs text-dh-gold hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-dh-gold/20 transition-all font-bold; }
                .action-btn-red { @apply flex items-center gap-2 text-xs text-red-400 hover:text-red-300 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-red-500/20 transition-all; }
            `}</style>
        </div>
    );
}
