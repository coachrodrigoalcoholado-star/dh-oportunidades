"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, DollarSign, Wallet, ArrowRight, Loader2, MessageCircle, AlertCircle, Download, FileText } from "lucide-react";
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

            const message = `Hola, consulta por Zapatillas.\n\nMdelo: *${observation}*\nCosto Producto: $${numericAmount.toLocaleString('es-AR')}\nPrecio Final: $${total.toLocaleString('es-AR')}\nPlan: ${selectedInstallment} cuotas de $${installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}\n\n🔐 Código: #${operationCode}`;

            const url = `https://wa.me/5492614194014?text=${encodeURIComponent(message)}`;
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
                quality: 1,
                backgroundColor: '#020617',
                pixelRatio: 2,
                style: {
                    opacity: '1',
                    visibility: 'visible',
                    display: 'block',
                    transform: 'none', // Prevent inheritance of transforms that might hide it
                }
            });

            if (blob) {
                saveAs(blob, `DH_Calzado_${observation || 'Presupuesto'}.png`);
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
                className="bg-dh-gray/80 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10"
                ref={cardRef}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-black p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <ShoppingBag className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 flex items-center justify-between">
                        <img src="/logo-new.png" alt="DH" className="h-8 object-contain" />
                        <span className="text-indigo-300 text-xs font-bold tracking-widest uppercase border border-indigo-500/30 px-2 py-1 rounded">
                            Calzado
                        </span>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Amount Input */}
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
                            <DollarSign className="w-3 h-3 text-indigo-400" />
                            Costo del Producto (Lista)
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <span className="text-indigo-400 font-bold text-xl">$</span>
                            </div>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-4 pl-10 pr-4 text-white font-mono text-3xl font-bold placeholder:text-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Observation Input */}
                    <div className="space-y-2">
                        <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
                            <FileText className="w-3 h-3 text-indigo-400" />
                            Observación / Modelo
                        </label>
                        <input
                            type="text"
                            value={observation}
                            onChange={(e) => setObservation(e.target.value)}
                            placeholder="Ej: Nike Air Force 1 Talle 40"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors"
                        />
                    </div>

                    {/* Installments Grid */}
                    {getNumericAmount() > 0 && (
                        <div className="space-y-4">
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                <div className="text-xs text-indigo-200">
                                    <p className="font-bold">Markup Aplicado: {config.markup}%</p>
                                    <p className="opacity-70">Precio Final: ${(getNumericAmount() * (1 + config.markup / 100)).toLocaleString('es-AR')}</p>
                                </div>
                            </div>

                            {/* DOWNLOAD BUTTON */}
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                            >
                                {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
                                DESCARGAR PRESUPUESTO
                            </button>

                            <hr className="border-white/10" />

                            <label className="text-gray-400 text-xs font-bold uppercase tracking-wider ml-1 flex items-center gap-2">
                                <Wallet className="w-3 h-3 text-indigo-400" />
                                Planes Disponibles
                            </label>

                            <div className="grid grid-cols-2 gap-3">
                                {config.quotas.map((q) => {
                                    const value = calculateInstallmentValue(q);
                                    const isSelected = selectedInstallment === q;

                                    return (
                                        <button
                                            key={q}
                                            onClick={() => setSelectedInstallment(q)}
                                            className={`relative overflow-hidden rounded-xl p-4 transition-all duration-300 border group ${isSelected
                                                ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)]'
                                                : 'bg-indigo-900/10 border-indigo-500/20 hover:bg-indigo-500/10 hover:border-indigo-500/40'
                                                }`}
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`text-2xl font-black font-mono tracking-tighter ${isSelected ? 'text-white' : 'text-indigo-200'}`}>
                                                    {q} <span className="text-xs font-sans font-medium opacity-70">cuotas de</span>
                                                </span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className={`text-sm font-bold ${isSelected ? 'text-indigo-200' : 'text-indigo-500'}`}>$</span>
                                                    <span className={`text-3xl font-bold ${isSelected ? 'text-white' : 'text-white/90'}`}>
                                                        {value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                                    </span>
                                                </div>
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

                {/* Footer Decoration */}
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            </motion.div>

            {/* OFF-SCREEN FLYER GENERATION (Hidden) */}
            {/* OFF-SCREEN FLYER GENERATION (Hidden) */}
            <div
                className="fixed bottom-0 right-0 z-[-50] opacity-0 pointer-events-none"
                ref={flyerRef}
            >
                <div
                    className="w-[800px] bg-[#020617] text-white p-12 rounded-3xl relative overflow-hidden border border-indigo-500/30"
                    style={{
                        backgroundImage: "radial-gradient(circle at top right, rgba(79, 70, 229, 0.15), #020617 60%)"
                    }}
                >
                    {/* Watermark */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

                    {/* Header */}
                    <div className="flex flex-col items-center justify-center mb-10 relative z-10">
                        {/* Ensure crossOrigin is anonymous for images to allow capture */}
                        <img
                            src="/logo-new.png"
                            alt="DH"
                            className="h-32 object-contain mb-6 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                        />
                        <h2 className="text-3xl font-black tracking-tight text-white mb-2">PRESUPUESTO CALZADO</h2>
                        <div className="h-1 w-24 bg-indigo-500 rounded-full" />
                    </div>

                    {/* Observation */}
                    {observation && (
                        <div className="mb-10 text-center relative z-10 bg-white/5 p-6 rounded-2xl border border-white/10 mx-10">
                            <p className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Modelo / Descripción</p>
                            <p className="text-3xl font-bold text-white leading-tight">"{observation}"</p>
                        </div>
                    )}

                    {/* Grid of Installments */}
                    <div className="grid grid-cols-2 gap-4 relative z-10 px-8">
                        {config.quotas.map((q) => {
                            const value = calculateInstallmentValue(q);
                            return (
                                <div key={q} className="bg-gradient-to-br from-white/10 to-transparent p-6 rounded-2xl border border-white/10 flex flex-col items-center justify-center">
                                    <span className="text-indigo-300 text-lg font-bold mb-1">{q} Cuotas de</span>
                                    <span className="text-5xl font-black text-white tracking-tighter">
                                        ${value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                    </span>
                                </div>
                            )
                        })}
                    </div>

                    <div className="mt-10 text-center relative z-10 opacity-50">
                        <p className="text-sm">Presupuesto válido por 24hs. Sujeto a disponibilidad.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
