"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, DollarSign, Calculator, LogOut, LayoutDashboard } from "lucide-react";
import { toBlob } from "html-to-image";
import { saveAs } from "file-saver";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

interface LoanResult {
    installments: number;
    total: number;
    installmentValue: number;
}

interface RateConfig {
    [key: number]: number; // 6: 0.47
}

const DEFAULT_RATES: RateConfig = {
    4: 0.35,
    6: 0.47,
    8: 0.65,
    10: 0.85,
};

export default function Simulator() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const isAdmin = user?.user_metadata?.role === 'admin';

    const [amount, setAmount] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [rates, setRates] = useState<RateConfig>(DEFAULT_RATES);
    const [loadingConfig, setLoadingConfig] = useState(true);
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();

            if (data?.value) {
                setRates(data.value);
            }
        } catch (error) {
            console.error("Using default rates due to error:", error);
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
        const rate = rates[installments] || 0.50; // Fallback safety
        const total = capital + (capital * rate);
        const installmentValue = total / installments;
        return { installments, total, installmentValue };
    };

    const logSimulation = async (action: 'view' | 'download') => {
        if (!user) return; // Only log if authenticated (agent)

        try {
            const response = await fetch('/api/simulation/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    amount: getNumericAmount(),
                    installments: 0,
                    metadata: { action }
                })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error("Analytics API error:", err);
            } else {
                console.log("Analytics recorded successfully via API");
            }
        } catch (e) {
            console.error("Analytics network error:", e);
        }
    };



    const handleDownload = async () => {
        try {
            setIsGenerating(true);

            const node = document.getElementById("flyer-export");
            if (!node) throw new Error("flyer-export no encontrado");

            // Ensure fonts are ready
            if (document.fonts) {
                await document.fonts.ready;
            }

            // html-to-image is often more robust for modern CSS (gradients, blend modes)
            // It allows us to skip the complex cloning and sanitization needed for html2canvas
            const blob = await toBlob(node, {
                quality: 0.95,
                backgroundColor: "#020617",
                cacheBust: true,
                style: {
                    // Force the background to be fully opaque and correct
                    backgroundColor: "#020617",
                    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #000000)",
                }
            });

            if (!blob) throw new Error("No se pudo generar el archivo de imagen.");

            const cleanAmount = amount.replace(/\./g, "").replace(/,/g, "");
            const filename = `PRESTAMO_DH_${cleanAmount}.jpg`;

            saveAs(blob, filename);
            setIsGenerating(false);

            logSimulation('download');

        } catch (error) {
            console.error("Flyer Gen Error:", error);
            const msg = error instanceof Error ? error.message : String(error);
            alert(`Error (${msg}). Por favor intenta de nuevo.`);
            setIsGenerating(false);
        }
    };

    const hasAmount = getNumericAmount() > 0;
    const availableInstallments = Object.keys(rates).map(Number).sort((a, b) => a - b);

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 relative">

            {user && (
                <div className="flex justify-end w-full mb-2">
                    {isAdmin ? (
                        <button
                            onClick={() => router.push('/admin')}
                            className="flex items-center gap-2 text-xs text-dh-gold hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-dh-gold/20 transition-all font-bold"
                        >
                            <LayoutDashboard className="w-3 h-3" />
                            Salir del Simulador
                        </button>
                    ) : (
                        <button
                            onClick={() => signOut()}
                            className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-red-500/20 transition-all"
                        >
                            <LogOut className="w-3 h-3" />
                            Cerrar Sesión
                        </button>
                    )}
                </div>
            )}

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-dh-gray/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl"
            >
                <div className="flex justify-between items-center mb-2">
                    <label className="text-gray-400 text-sm font-uppercase tracking-wider">Monto a Solicitar</label>
                    {loadingConfig && <span className="text-xs text-dh-gold animate-pulse">Sincronizando tasas...</span>}
                </div>
                <div className="relative mt-2">
                    <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 text-dh-gold w-8 h-8" />
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full bg-transparent border-b-2 border-dh-gray focus:border-dh-gold text-3xl sm:text-4xl font-bold text-white pl-10 py-4 outline-none transition-colors placeholder:text-gray-700 active:bg-white/5"
                    />
                </div>
            </motion.div>

            <AnimatePresence>
                {hasAmount && (
                    <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="animate-float mb-6">
                            <div
                                ref={cardRef}
                                id="flyer-export"
                                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl"
                                style={{
                                    backgroundColor: "#020617",
                                    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #000000)",
                                    border: "1px solid rgba(212, 175, 55, 0.3)",
                                    color: "#ffffff"
                                }}
                            >
                                {/* Orbes decorativos */}
                                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"
                                    style={{ background: "rgba(212, 175, 55, 0.05)" }} />
                                <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[50px] -ml-10 -mb-10 pointer-events-none"
                                    style={{ background: "rgba(30, 58, 138, 0.1)" }} />

                                <div className="flex flex-col items-center mb-8 relative z-10">
                                    <div className="h-28 w-28 mb-3 relative flex items-center justify-center">
                                        <img
                                            src="/logo-new.png"
                                            alt="DH"
                                            crossOrigin="anonymous"
                                            className="h-full w-full object-contain drop-shadow-2xl"
                                        />
                                    </div>
                                    <div className="h-px w-24" style={{ background: "linear-gradient(to right, transparent, rgba(212, 175, 55, 0.5), transparent)" }} />
                                </div>

                                <div className="text-center mb-6 relative z-10">
                                    <p style={{ color: "#9ca3af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                                        Capital Solicitado
                                    </p>
                                    <p className="font-mono mt-1" style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffffff" }}>
                                        ${getNumericAmount().toLocaleString('es-AR')}
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 relative z-10 w-full mt-6">
                                    {availableInstallments.map((num) => {
                                        const data = calculateLoan(getNumericAmount(), num);
                                        return (
                                            <div key={num}
                                                className="installment-container flex items-center justify-between rounded-xl px-4 py-3 sm:px-6 sm:py-4 scale-100 sm:hover:scale-105 transition-transform"
                                                style={{
                                                    background: "rgba(255, 255, 255, 0.05)",
                                                    border: "1px solid rgba(255, 255, 255, 0.1)"
                                                }}
                                            >
                                                <div className="installment-left flex items-center gap-3">
                                                    <div className="installment-circle flex items-center justify-center rounded-full shadow-lg"
                                                        style={{
                                                            backgroundColor: "#D4AF37",
                                                            color: "#020617",
                                                            width: "2.5rem", height: "2.5rem",
                                                            fontWeight: "900", fontSize: "1.25rem"
                                                        }}>
                                                        {num}
                                                    </div>
                                                    <div className="installment-label" style={{ color: "#d1d5db", fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                                        Cuotas de
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="installment-value font-mono tracking-tighter gradient-text-gold"
                                                        style={{
                                                            fontSize: "1.5rem", fontWeight: "900",
                                                            color: "#D4AF37",
                                                            backgroundImage: "linear-gradient(to right, #D4AF37, #ffffff, #D4AF37)",
                                                            WebkitBackgroundClip: "text",
                                                            backgroundClip: "text",
                                                            WebkitTextFillColor: "transparent"
                                                        }}>
                                                        ${data.installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="mt-8 pt-4 border-t text-center relative z-10" style={{ borderColor: "rgba(255, 255, 255, 0.05)" }}>
                                    <p style={{ color: "#6b7280", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>
                                        Propuesta Válida por 24hs (Sujeto a disponibilidad)
                                    </p>
                                    <p className="gradient-text-footer" style={{
                                        fontWeight: "bold", fontSize: "0.875rem",
                                        backgroundImage: "linear-gradient(to right, #9ca3af, #ffffff, #9ca3af)",
                                        WebkitBackgroundClip: "text",
                                        backgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        color: "#ffffff"
                                    }}>
                                        DH OPORTUNIDADES
                                    </p>
                                </div>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className={`w-full bg-gradient-to-r from-dh-gold to-yellow-600 text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.2)] flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] transition-all ${isGenerating ? 'opacity-80 cursor-wait' : ''}`}
                        >
                            <Download className={`w-5 h-5 ${isGenerating ? 'animate-bounce' : ''}`} />
                            <span>{isGenerating ? 'Generando imagen...' : 'Descargar Flyer para WhatsApp'}</span>
                        </motion.button>

                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
