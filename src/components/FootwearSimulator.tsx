"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, DollarSign, Wallet, ArrowRight, Loader2, MessageCircle, AlertCircle, Download, FileText, CheckCircle2 } from "lucide-react";
import { toBlob } from "html-to-image";
import { saveAs } from "file-saver";

interface FootwearConfig {
    markup: number;
    quotas: number[];
}

const DEFAULT_CONFIG: FootwearConfig = {
    markup: 100,
    quotas: [3, 6]
};

const generateOperationCode = (amount: number, installments: number) => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    const hash = (amount * installments).toString(16).toUpperCase().slice(-3);
    return `OP-${timestamp}-${random}-${hash}`;
};

export default function FootwearSimulator() {
    // State
    const [amount, setAmount] = useState<string>("");
    const [observation, setObservation] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);

    // Config
    const [config, setConfig] = useState<FootwearConfig>(DEFAULT_CONFIG);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const cardRef = useRef<HTMLDivElement>(null);
    const flyerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/admin/config');
            const data = await res.json();
            if (data?.footwear) {
                setConfig(data.footwear);
            }
        } catch (error) {
            console.error("Using default config due to error:", error);
        } finally {
            setLoadingConfig(false);
        }
    };

    // Calculation Logic
    const getNumericAmount = () => {
        return parseFloat(amount.replace(/\./g, '')) || 0;
    };

    const calculateInstallmentValue = (installments: number) => {
        const cost = getNumericAmount();
        const priceWithMarkup = cost * (1 + config.markup / 100);
        return priceWithMarkup / installments;
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/\D/g, '');
        const num = parseInt(val, 10);
        if (isNaN(num)) {
            setAmount("");
        } else {
            setAmount(num.toLocaleString('es-AR'));
        }
        setSelectedInstallment(null);
    };

    const logSimulation = async (action: 'view' | 'download' | 'whatsapp', operationCode?: string) => {
        try {
            const res = await fetch('/api/simulation/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: 'admin',
                    amount: getNumericAmount(),
                    installments: selectedInstallment || 0,
                    metadata: { type: 'footwear', action, markup: config.markup, operationCode, observation }
                })
            });
            const data = await res.json();
            return data.code;
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleSolicitar = async () => {
        if (!selectedInstallment) return;
        setIsGenerating(true);

        try {
            const numericAmount = getNumericAmount();
            const installmentValue = calculateInstallmentValue(selectedInstallment);
            const total = numericAmount * (1 + config.markup / 100);

            const operationCode = generateOperationCode(numericAmount, selectedInstallment);
            logSimulation('whatsapp', operationCode).catch(console.error);

            const message = `Hola, consulta por Zapatillas.\n\nModelo: *${observation}*\nCosto Producto: $${numericAmount.toLocaleString('es-AR')}\nPrecio Final: $${total.toLocaleString('es-AR')}\nPlan: ${selectedInstallment} cuotas de $${installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}\n\n🔐 Código: #${operationCode}`;

            const url = `https://wa.me/5492616097457?text=${encodeURIComponent(message)}`;
            window.open(url, '_blank');

        } catch (error) {
            console.error(error);
            alert("Error al abrir WhatsApp");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        if (!flyerRef.current) return;
        setIsGenerating(true);

        try {
            await logSimulation('download');

            // Wait for fonts/images
            await new Promise(resolve => setTimeout(resolve, 500));

            const blob = await toBlob(flyerRef.current, {
                quality: 0.95,
                backgroundColor: "#020617",
                cacheBust: true,
                style: {
                    backgroundColor: "#020617",
                    backgroundImage: "linear-gradient(to bottom right, #020617, #0f172a, #000000)",
                }
            });

            if (blob) {
                saveAs(blob, `DH_Calzado_${observation || 'Presupuesto'}.jpg`);
            }
        } catch (error) {
            console.error("Error generating flyer:", error);
            alert("Error al generar la imagen. Intenta nuevamente.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loadingConfig) {
        return <div className="p-8 text-center text-dh-gold"><Loader2 className="animate-spin inline-block mr-2" /> Cargando CONFIG...</div>;
    }

    return (
        <div className="w-full max-w-md mx-auto relative perspective-1000">
            {/* Main Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-dh-gray/50 backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative z-10"
                ref={cardRef}
            >
                {/* Header */}
                <div className="p-6 relative overflow-hidden flex items-center justify-between bg-black/40 border-b border-white/5">
                    <img src="/logo-new.png" alt="DH" className="h-8 object-contain" />
                    <span className="text-dh-gold text-xs font-bold tracking-widest uppercase border border-dh-gold/30 px-3 py-1 rounded-full bg-dh-gold/10">
                        Simulador Calzado
                    </span>
                </div>

                <div className="p-6 space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-dh-gold" />
                            Costo del Producto (Lista)
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-dh-gold font-bold text-xl">$</span>
                            </div>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full bg-transparent border-b-2 border-white/10 rounded-none py-2 pl-10 pr-4 text-white font-mono text-3xl font-bold placeholder:text-gray-700 focus:border-dh-gold transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Observation Input */}
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
                            <FileText className="w-3 h-3 text-dh-gold" />
                            Observación / Modelo
                        </label>
                        <input
                            type="text"
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            placeholder="Ej: Nike Air Force 1 Talle 40"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-dh-gold transition-colors"
                        />
                    </div>

                    {/* Installments Grid */}
                    {getNumericAmount() > 0 && (
                        <div className="space-y-4">
                            <div className="bg-dh-gold/10 border border-dh-gold/20 p-3 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-dh-gold flex-shrink-0" />
                                <div className="text-xs text-dh-gold">
                                    <p className="font-bold">Markup Aplicado: {config.markup}%</p>
                                    <p className="opacity-70">Precio Final: ${(getNumericAmount() * (1 + config.markup / 100)).toLocaleString('es-AR')}</p>
                                </div>
                            </div>

                            {/* DOWNLOAD BUTTON */}
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full bg-dh-gold hover:bg-yellow-500 text-black font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                            >
                                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                                DESCARGAR PRESUPUESTO
                            </button>

                            <div className="h-px bg-white/10 my-4" />

                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-dh-gold" />
                                Planes Disponibles
                            </label>

                            <div className="grid grid-cols-1 gap-3">
                                {config.quotas.map((q) => {
                                    const value = calculateInstallmentValue(q);
                                    const isSelected = selectedInstallment === q;

                                    return (
                                        <button
                                            key={q}
                                            onClick={() => setSelectedInstallment(q)}
                                            className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 border group flex items-center justify-between ${isSelected
                                                ? 'bg-dh-gold border-dh-gold shadow-[0_0_20px_rgba(212,175,55,0.4)]'
                                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`flex items-center justify-center rounded-full w-10 h-10 font-black text-lg shadow-lg ${isSelected ? 'bg-black text-dh-gold' : 'bg-dh-gold text-black'}`}>
                                                    {q}
                                                </div>
                                                <div className={`text-xs font-bold uppercase tracking-wider ${isSelected ? 'text-black' : 'text-gray-400'}`}>
                                                    Cuotas de
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className={`text-2xl font-black font-mono tracking-tighter ${isSelected ? 'text-black' : 'text-dh-gold'}`}>
                                                    ${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                </span>
                                                {isSelected && <CheckCircle2 className="w-6 h-6 text-black" />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                        </div>
                    )}

                    {/* Actions */}
                    <AnimatePresence>
                        {selectedInstallment && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="space-y-3 pt-2"
                            >
                                <button
                                    onClick={handleSolicitar}
                                    disabled={isGenerating}
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-[0.98]"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" /> : <MessageCircle className="w-6 h-6" />}
                                    SOLICITAR POR WHATSAPP
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* VISUAL PREVIEW OF FLYER (Rendered inline for reliable capture) */}
            <div className="mt-12 w-full flex flex-col items-center border-t border-white/10 pt-8">
                <p className="text-gray-500 text-xs uppercase tracking-widest mb-6">Vista Previa del Flyer (Cliente)</p>

                <div
                    ref={flyerRef}
                    className="w-full max-w-[800px] bg-[#020617] text-white p-12 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col items-center"
                    style={{
                        backgroundImage: "linear-gradient(to bottom, #020617, #050a1f, #000000)",
                        border: "1px solid rgba(212, 175, 55, 0.3)"
                    }}
                >
                    {/* Watermarks */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-dh-gold/5 blur-[120px] rounded-full pointer-events-none -mr-20 -mt-20" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none -ml-20 -mb-20" />

                    {/* 1. HEADER */}
                    <div className="w-full flex flex-col items-center justify-center mb-8 relative z-10">
                        <img
                            src="/logo-new.png"
                            alt="DH"
                            className="h-28 object-contain mb-6 drop-shadow-[0_0_25px_rgba(212,175,55,0.2)]"
                        />
                        <h2 className="text-4xl font-black tracking-tighter text-white mb-2 uppercase text-center leading-none">
                            PRESUPUESTO <br /><span className="text-dh-gold">CALZADO</span>
                        </h2>
                        <div className="h-1.5 w-20 bg-gradient-to-r from-transparent via-dh-gold to-transparent rounded-full mt-4" />
                    </div>

                    {/* 2. PRODUCT & INFO CARD */}
                    <div className="w-full relative z-10 mb-8">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 text-center relative overflow-hidden">
                            {/* Decorative Top Border */}
                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-dh-gold/50 to-transparent" />

                            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-3">Modelo Seleccionado</p>
                            <p className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
                                "{observation || 'Consultar Modelo'}"
                            </p>

                        </div>
                    </div>

                    {/* 3. INSTALLMENTS GRID (Full Width Stack) */}
                    <div className="w-full flex flex-col gap-4 relative z-10">
                        {config.quotas.map((q) => {
                            const value = calculateInstallmentValue(q);
                            return (
                                <div key={q} className="w-full bg-[#050a1f] p-5 rounded-2xl border border-white/10 flex flex-col items-center justify-center relative group overflow-hidden shadow-lg transition-all hover:bg-[#0a0f29]">
                                    {/* Gradient Border Effect */}
                                    <div className="absolute inset-0 rounded-2xl border border-dh-gold/30 opacity-50 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-dh-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity blur-sm" />

                                    <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-1 relative z-10">{q} Cuotas de</p>

                                    <div className="flex items-center justify-center relative z-10">
                                        <span className="text-lg font-bold text-dh-gold mr-1 self-start mt-2">$</span>
                                        <span className="text-4xl sm:text-[3.5rem] font-black text-white tracking-tighter leading-none drop-shadow-xl">
                                            {value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* 4. FOOTER */}
                    <div className="mt-12 text-center relative z-10 opacity-50 w-full border-t border-white/5 pt-4">
                        <p className="text-[10px] font-mono tracking-widest uppercase text-gray-400">
                            Documento válido por 24hs • Sujeto a disponibilidad
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
