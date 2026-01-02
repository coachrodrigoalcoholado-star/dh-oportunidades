"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, DollarSign, Wallet, ArrowRight, Loader2, MessageCircle, AlertCircle } from "lucide-react";
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedInstallment, setSelectedInstallment] = useState<number | null>(null);

    // Config
    const [config, setConfig] = useState<FootwearConfig>(DEFAULT_CONFIG);
    const [loadingConfig, setLoadingConfig] = useState(true);

    const cardRef = useRef<HTMLDivElement>(null);

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
                    metadata: { type: 'footwear', action, markup: config.markup, operationCode }
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

            const message = `Hola, consulta por Zapatillas.\n\nCosto Producto: $${numericAmount.toLocaleString('es-AR')}\nPrecio Final: $${total.toLocaleString('es-AR')}\nPlan: ${selectedInstallment} cuotas de $${installmentValue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}\n\n🔐 Código: #${operationCode}`;

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
        if (!cardRef.current || !selectedInstallment) return;
        setIsGenerating(true);

        try {
            await logSimulation('download');

            // Wait for fonts/images
            await new Promise(resolve => setTimeout(resolve, 500));

            const blob = await toBlob(cardRef.current, {
                quality: 1,
                backgroundColor: '#000000',
                pixelRatio: 2,
            });

            if (blob) {
                saveAs(blob, `DH_Calzado_${amount}.png`);
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

                    {/* Installments Grid */}
                    {getNumericAmount() > 0 && (
                        <div className="space-y-3">
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

                            {/* Info Box */}
                            <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                <div className="text-xs text-indigo-200">
                                    <p className="font-bold">Markup Aplicado: {config.markup}%</p>
                                    <p className="opacity-70">Precio Final: ${(getNumericAmount() * (1 + config.markup / 100)).toLocaleString('es-AR')}</p>
                                </div>
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

                                <button
                                    onClick={handleDownload}
                                    disabled={isGenerating}
                                    className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium py-3 rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/5"
                                >
                                    <ArrowRight className="w-4 h-4" />
                                    Descargar Presupuesto
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Decoration */}
                <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
            </motion.div>
        </div>
    );
}
