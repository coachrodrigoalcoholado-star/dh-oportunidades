"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Download, DollarSign, Wallet, AlertCircle, ArrowRight, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
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

const DEFAULT_RATES: RateConfig = { 4: 0.35, 6: 0.47, 8: 0.65, 10: 0.85 };

interface SimulatorProps {
    minLimit?: number;
    maxLimit?: number;
}

export default function Simulator({ minLimit: propMin, maxLimit: propMax }: SimulatorProps) {
    const { user, signOut } = useAuth();
    const router = useRouter();

    // State
    const [step, setStep] = useState<'validation' | 'simulator'>('validation');

    // Auth / Client Data
    const [dni, setDni] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientLimits, setClientLimits] = useState<{ min: number; max: number } | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [clientNotFound, setClientNotFound] = useState(false);

    // Simulator Data
    const [amount, setAmount] = useState<string>("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);

    // Config
    const [rates, setRates] = useState<RateConfig>(DEFAULT_RATES);
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
        } catch (error) {
            console.error("Using default config due to error:", error);
        } finally {
            setLoadingConfig(false);
        }
    };

    const handleDniSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dni || dni.length < 6) {
            setValidationError("Ingrese un DNI válido");
            return;
        }

        setIsValidating(true);
        setValidationError("");
        setClientNotFound(false);

        try {
            const res = await fetch('/api/clients/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni })
            });

            const data = await res.json();

            if (data.found && data.client) {
                setClientName(data.client.fullName);
                setClientLimits({
                    min: data.client.minAmount,
                    max: data.client.maxAmount
                });
                setStep('simulator');
            } else {
                setClientNotFound(true);
                setValidationError("Cliente no encontrado.");
            }
        } catch (err) {
            setValidationError("Error de conexión. Intente nuevamente.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/\D/g, "");
        if (!rawValue) {
            setAmount("");
            setSelectedInstallment(null);
            return;
        }
        let numericValue = parseInt(rawValue, 10);

        const effectiveMax = clientLimits?.max || propMax || 2000000;

        if (numericValue > effectiveMax) {
            numericValue = effectiveMax;
        }

        setAmount(numericValue.toLocaleString("es-AR"));
        setSelectedInstallment(null); // Reset selection on amount change
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

    const logSimulation = async (action: 'view' | 'download' | 'whatsapp') => {
        try {
            const res = await fetch('/api/simulation/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user?.id || 'public',
                    amount: getNumericAmount(),
                    installments: selectedInstallment || 0,
                    metadata: { action, mode: 'loans', clientDni: dni, clientName }
                })
            });
            const data = await res.json();
            return data.code; // Return the security code (Record ID)
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleWhatsAppFallback = () => {
        const message = "Hola, mi DNI no figura en el sistema y quisiera consultar mi disponible en DH OPORTUNIDADES. ¿Me podrán ayudar?";
        const url = `https://wa.me/5492614194014?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    const generateOperationCode = (amount: number, installments: number) => {
        const timestamp = Date.now().toString(36).toUpperCase().slice(-4);
        const unique = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `OP-${amount}-${installments}-${timestamp}${unique}`;
    };

    const handleSolicitar = async () => {
        if (!selectedInstallment) return;

        setIsGenerating(true);

        try {
            // 1. Generate Local Operation Code
            const numericAmount = getNumericAmount();
            const operationCode = generateOperationCode(numericAmount, selectedInstallment);

            // 2. Log in Background (Fire and forget)
            logSimulation('whatsapp').catch(err => console.error("Log error:", err));

            // 3. Prepare WhatsApp Message
            const data = calculateLoan(numericAmount, selectedInstallment);
            const installmentValStr = data.installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 });
            const amountStr = numericAmount.toLocaleString('es-AR');

            let message = `Hola, soy ${clientName}, quiero solicitar un préstamo de $${amountStr} en ${selectedInstallment} cuotas de $${installmentValStr}.`;

            message += `\n\n🔐 Código de Operación: #${operationCode}`;

            const url = `https://wa.me/5492614194014?text=${encodeURIComponent(message)}`;

            // 4. Open WhatsApp Immediately
            window.open(url, '_blank');

        } catch (error) {
            console.error(error);
            alert("Hubo un error al procesar la solicitud. Intentando abrir WhatsApp...");
            handleWhatsAppFallback();
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        try {
            setIsGenerating(true);
            const node = document.getElementById("flyer-export");
            if (!node) return;
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

            if (!blob) throw new Error("Err gen file");
            const cleanAmount = amount.replace(/\./g, "").replace(/,/g, "");
            saveAs(blob, `PRESTAMO_DH_${cleanAmount}.jpg`);

            // Only log simple download if not part of request flow (which logs 'whatsapp')
            logSimulation('download');
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const hasAmount = getNumericAmount() > 0;
    const activeInstallments = Object.keys(rates).map(Number).sort((a, b) => a - b);

    // --- RENDER ---

    if (step === 'validation') {
        return (
            <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 relative min-h-[500px] justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-dh-gray/50 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-xl text-center"
                >
                    <div className="flex items-center justify-center mx-auto mb-6">
                        <img src="/logo-new.png" alt="DH Oportunidades" className="h-24 object-contain drop-shadow-lg" />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">Bienvenido</h2>
                    <p className="text-gray-400 mb-8">Ingresa tu DNI para consultar tu disponible.</p>

                    <form onSubmit={handleDniSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={dni}
                                onChange={(e) => {
                                    setDni(e.target.value.replace(/\D/g, ''));
                                    setClientNotFound(false);
                                    setValidationError("");
                                }}
                                placeholder="Ingresá tu DNI"
                                className={`w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-lg outline-none focus:border-dh-gold transition-colors ${validationError ? 'border-red-500/50' : ''}`}
                                autoFocus
                            />
                        </div>

                        {validationError && (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 py-2 rounded-lg">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>{validationError}</span>
                                </div>
                                {clientNotFound && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <p className="text-gray-300 text-sm mb-3">
                                            Por favor, comunicate con DH OPORTUNIDADES.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={handleWhatsAppFallback}
                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            Contactar a DH OPORTUNIDADES
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {!clientNotFound && (
                            <button
                                type="submit"
                                disabled={isValidating || !dni}
                                className="w-full bg-dh-gold hover:bg-yellow-500 text-black font-bold py-4 rounded-xl shadow-lg shadow-dh-gold/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isValidating ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        Consultar <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        )}
                    </form>
                </motion.div>

                <div className="text-center">
                    <button onClick={() => router.push('/login')} className="text-xs text-gray-700 hover:text-gray-500 transition-colors">
                        Acceso Administrativo
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-4 flex flex-col gap-6 relative">

            {/* Header with User Info */}
            <div className="flex justify-between items-center bg-black/40 px-4 py-3 rounded-full border border-white/5 mx-2">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-gray-200 font-bold uppercase tracking-wide">
                        Bienvenido, <span className="text-dh-gold">{clientName}</span>
                    </span>
                </div>
                <button
                    onClick={() => { setStep('validation'); setAmount(''); setClientName(''); }}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                >
                    Salir
                </button>
            </div>

            {/* AMOUNT INPUT */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-dh-gray/50 backdrop-blur-md p-6 rounded-2xl border border-white/5 shadow-xl space-y-4"
            >
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-gray-400 text-sm font-uppercase tracking-wider">
                            Monto a Solicitar
                        </label>
                        {clientLimits && (
                            <span className="text-[10px] text-dh-gold bg-dh-gold/10 px-2 py-1 rounded">
                                Max: ${clientLimits.max.toLocaleString('es-AR')}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <DollarSign className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-8 text-dh-gold" />
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amount}
                            onChange={handleAmountChange}
                            placeholder="0"
                            className="w-full bg-transparent border-b-2 focus:border-opacity-100 border-white/10 text-3xl sm:text-4xl font-bold text-white pl-10 py-4 outline-none transition-colors placeholder:text-gray-700 focus:border-dh-gold"
                        />
                    </div>
                </div>
            </motion.div>

            {/* SIMULATOR & SELECTION */}
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
                                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 shadow-2xl transition-all"
                                style={{
                                    backgroundColor: "#020617",
                                    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #000000)",
                                    border: "1px solid rgba(212, 175, 55, 0.3)",
                                    color: "#ffffff"
                                }}
                            >
                                {/* Watermarks */}
                                <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none"
                                    style={{ background: "rgba(212, 175, 55, 0.05)" }} />

                                <div className="flex flex-col items-center mb-8 relative z-10">
                                    <img src="/logo-new.png" alt="DH" className="h-28 object-contain drop-shadow-2xl mb-3" crossOrigin="anonymous" />
                                    <div className="h-px w-24" style={{ background: "linear-gradient(to right, transparent, #D4AF37, transparent)" }} />
                                </div>

                                {/* Header Info */}
                                <div className="text-center mb-6 relative z-10">
                                    <p style={{ color: "#9ca3af", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                                        Capital Solicitado
                                    </p>
                                    <p className="font-mono mt-1" style={{ fontSize: "2rem", fontWeight: "bold", color: "#ffffff" }}>
                                        ${getNumericAmount().toLocaleString('es-AR')}
                                    </p>

                                    {clientName && (
                                        <p className="mt-2 text-xs text-gray-500 uppercase tracking-widest border border-white/10 inline-block px-3 py-1 rounded-full">
                                            {clientName}
                                        </p>
                                    )}
                                </div>

                                {/* Installments List */}
                                <div className="flex flex-col gap-3 relative z-10 w-full mt-6">
                                    {activeInstallments.map((num) => {
                                        const data = calculateLoan(getNumericAmount(), num);
                                        const isSelected = selectedInstallment === num;

                                        return (
                                            <div key={num}
                                                onClick={() => setSelectedInstallment(num)}
                                                className={`flex items-center justify-between rounded-xl px-4 py-3 sm:px-6 sm:py-4 transition-all cursor-pointer ${isSelected
                                                    ? 'bg-dh-gold text-black scale-105 shadow-xl shadow-dh-gold/20 border-dh-gold'
                                                    : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                                style={{ border: isSelected ? 'none' : "1px solid rgba(255, 255, 255, 0.1)" }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex items-center justify-center rounded-full shadow-lg ${isSelected ? 'bg-black text-dh-gold' : 'bg-dh-gold text-white'}`}
                                                        style={{
                                                            width: "2.5rem", height: "2.5rem", fontWeight: "900", fontSize: "1.25rem"
                                                        }}>
                                                        {num}
                                                    </div>
                                                    <div style={{ fontSize: "0.75rem", fontWeight: "bold", textTransform: "uppercase", color: isSelected ? '#000' : '#d1d5db' }}>
                                                        Cuotas de
                                                    </div>
                                                </div>
                                                <div className="font-mono flex items-center gap-2" style={{
                                                    fontSize: "1.5rem", fontWeight: "900",
                                                    color: isSelected ? '#000' : "#D4AF37",
                                                }}>
                                                    ${data.installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                    {isSelected && <CheckCircle2 className="w-6 h-6 text-black" />}
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

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            {selectedInstallment ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 50, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                >
                                    <button
                                        onClick={handleSolicitar}
                                        disabled={isGenerating}
                                        className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 transition-all animate-heartbeat shadow-[0_0_20px_rgba(34,197,94,0.3)] border border-green-400/30 relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none blur-xl" />
                                        <svg viewBox="0 0 24 24" className="w-8 h-8 drop-shadow-md fill-white" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        <span className="text-xl tracking-wide drop-shadow-md uppercase">
                                            {isGenerating ? 'Procesando...' : 'Solicitar Préstamo'}
                                        </span>
                                    </button>
                                    <p className="text-center text-xs text-gray-500 mt-3 animate-pulse">
                                        Se abrirá WhatsApp con tu pedido listo para enviar.
                                    </p>
                                </motion.div>
                            ) : (
                                <div className="text-center py-4 px-4 rounded-xl bg-dh-gold/10 border border-dh-gold/20 animate-pulse">
                                    <p className="text-dh-gold font-bold text-lg flex items-center justify-center gap-2">
                                        👆 Seleccioná una cuota para continuar
                                    </p>
                                </div>
                            )}

                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full text-xs font-bold py-3 text-gray-500 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                <span>Descargar Presupuesto como Imagen</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                    .animate-float { animation: float 6s ease-in-out infinite; }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-5px); }
                        100% { transform: translateY(0px); }
                    }
                    .animate-heartbeat { animation: heartbeat 2s infinite ease-in-out; }
                    @keyframes heartbeat {
                        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0.4); }
                        50% { transform: scale(1.02); box-shadow: 0 0 25px 5px rgba(74, 222, 128, 0.2); }
                        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(74, 222, 128, 0); }
                    }
                `}</style>
        </div>
    );
}
