"use client";

import { useState, useEffect } from 'react';
import { Smartphone, Copy, Check, MessageSquare, RotateCcw, ArrowRight, DollarSign, TrendingUp, Info, Apple, Layout } from 'lucide-react';

export default function WhatsAppConverter() {
    const [inputList, setInputList] = useState('');
    
    // Android Configuration
    const [markupAndroid, setMarkupAndroid] = useState<number | string>(110);
    const [installmentsAndroid, setInstallmentsAndroid] = useState<number | string>(18);
    
    // iPhone/Apple Configuration
    const [markupIphone, setMarkupIphone] = useState<number | string>(120);
    const [installmentsIphone, setInstallmentsIphone] = useState<number | string>(25);
    
    const [dolarBlue, setDolarBlue] = useState<number | string>(1200);
    const [isFetchingDolar, setIsFetchingDolar] = useState(false);
    const [result, setResult] = useState('');
    const [copied, setCopied] = useState(false);

    // Fetch Dolar Blue on mount
    useEffect(() => {
        fetchDolar();
    }, []);

    const fetchDolar = async () => {
        setIsFetchingDolar(true);
        try {
            const res = await fetch('https://dolarapi.com/v1/dolares/blue');
            const data = await res.json();
            if (data.venta) {
                setDolarBlue(data.venta);
            }
        } catch (err) {
            console.error('Error fetching dolar:', err);
        } finally {
            setIsFetchingDolar(false);
        }
    };

    const handleTransform = () => {
        if (!inputList.trim()) return;

        const iAndroid = parseInt(installmentsAndroid.toString()) || 1;
        const iIphone = parseInt(installmentsIphone.toString()) || 1;
        const mAndroid = parseFloat(markupAndroid.toString()) || 0;
        const mIphone = parseFloat(markupIphone.toString()) || 0;
        const db = parseFloat(dolarBlue.toString()) || 0;

        let currentIsIphoneBattery = false;
        
        // Pre-filter: Eliminar equipos Apple con batería <= 79%
        const filteredInput = inputList.split('\n').filter(line => {
            const upperLine = line.toUpperCase();
            const isIphoneMarker = upperLine.includes('IPHONE') || 
                             upperLine.includes('IPAD') || 
                             upperLine.includes('MAC') || 
                             upperLine.includes('APPLE') || 
                             upperLine.includes('🍎') ||
                             upperLine.includes('WATCH') ||
                             upperLine.includes('AIRPODS');
                             
            const isAndroidMarker = upperLine.includes('SAMSUNG') ||
                                    upperLine.includes('MOTOROLA') ||
                                    upperLine.includes('XIAOMI') ||
                                    upperLine.includes('ANDROID') ||
                                    upperLine.includes('GALAXY') ||
                                    upperLine.includes('POCO') ||
                                    upperLine.includes('REDMI') ||
                                    upperLine.includes('REALME');

            if (isIphoneMarker) {
                currentIsIphoneBattery = true;
            } else if (isAndroidMarker) {
                currentIsIphoneBattery = false;
            }
            
            if (currentIsIphoneBattery) {
                const batteryMatch = line.match(/\b(\d{2,3})\s*%/);
                if (batteryMatch) {
                    const battery = parseInt(batteryMatch[1], 10);
                    if (battery <= 79) {
                        return false; // Eliminar de la lista final
                    }
                }
            }
            return true;
        }).join('\n');

        // Regex to find prices: now captures potential trailing text (p3) on the same line to reorder it
        const priceRegex = /(?:\d+\s+pagos?\s+\w+\s+de\s+)?(U?\$S?|USD|ARS\$?)\s?([0-9.]+)([^\n]*)/gi;

        let currentIsIphone = false;

        let transformed = filteredInput.split('\n').map(line => {
            const lineText = line.toUpperCase();

            // Detección: iPhone, Apple, 🍎, iPad, Mac, AirPods, Watch
            const isIphoneMarker = lineText.includes('IPHONE') || 
                             lineText.includes('IPAD') || 
                             lineText.includes('MAC') || 
                             lineText.includes('APPLE') || 
                             lineText.includes('🍎') ||
                             lineText.includes('WATCH') ||
                             lineText.includes('AIRPODS');
            
            // Detección Android para resetear el estado si es necesario
            const isAndroidMarker = lineText.includes('SAMSUNG') ||
                                    lineText.includes('MOTOROLA') ||
                                    lineText.includes('XIAOMI') ||
                                    lineText.includes('ANDROID') ||
                                    lineText.includes('GALAXY') ||
                                    lineText.includes('POCO') ||
                                    lineText.includes('REDMI') ||
                                    lineText.includes('REALME');

            if (isIphoneMarker) {
                currentIsIphone = true;
            } else if (isAndroidMarker) {
                currentIsIphone = false;
            }

            return line.replace(priceRegex, (match, p1, p2, p3) => {
                const currentMarkup = currentIsIphone ? mIphone : mAndroid;
                const currentInstallments = currentIsIphone ? iIphone : iAndroid;

                const currencyPrefix = p1.toUpperCase();
                const rawAmount = p2;
                const trailingText = p3.trim(); // Capture stuff like "2024" or details after price
                
                // Remove dots (thousand separators)
                let cleanPrice = parseFloat(rawAmount.replace(/\./g, ''));
                
                if (isNaN(cleanPrice)) return match;

                // If it's USD, convert to ARS first
                if (currencyPrefix.includes('U') || currencyPrefix.includes('USD')) {
                    cleanPrice = cleanPrice * db;
                }

                // Calculate: Price + Markup% divided by installments
                const totalWithMarkup = cleanPrice * (1 + currentMarkup / 100);
                const rawInstallment = totalWithMarkup / currentInstallments;
                
                // Rounding up to the nearest multiple of 50
                const installmentPrice = Math.ceil(rawInstallment / 50) * 50;

                // Format back to $X.XXX (ARS style)
                const formattedPrice = new Intl.NumberFormat('es-AR', {
                    style: 'currency',
                    currency: 'ARS',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(installmentPrice);

                // Reorder: [TrailingInfo] - [X pagos...]
                const prefix = trailingText ? ` ${trailingText}` : '';
                return `${prefix} - ${currentInstallments} pagos semanales de ${formattedPrice}`;
            });
        }).join('\n');

        // 1. Enhanced Stock Removal Regex (covers X UNIDADES, [X unidades], X (Unidades), etc.)
        // Matches things like "25 UNIDADES", "3 [Unidades]", "[2 unidades]", etc.
        const stockRegex = /\d*\s*\[?\d*\s*unidades\]?/gi;
        transformed = transformed.replace(stockRegex, '');

        // 2. Clean up extra HORIZONTAL spaces only (preserve newlines)
        transformed = transformed.split('\n').map(line => 
            line.replace(/[ \t]{2,}/g, ' ').trim()
        ).join('\n');

        // 3. Add Disclaimer & Brand at the end
        const disclaimer = "\n\n⚠️ *Listado sujeto a disponibilidad. Consultar stock.*\n\n*DH OPORTUNIDADES* 🚀";
        transformed += disclaimer;

        setResult(transformed);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClear = () => {
        setInputList('');
        setResult('');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4 md:space-y-8 pb-32 md:pb-20">
            {/* Sticky Header for Mobile */}
            <header className="sticky top-0 z-30 bg-dh-dark/90 backdrop-blur-xl md:static md:bg-transparent -mx-4 px-4 py-4 md:mx-0 md:p-0 border-b border-white/5 md:border-none flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2 md:gap-3">
                        <Smartphone className="w-6 h-6 md:w-8 md:h-8 text-dh-gold" />
                        LISTAS CELULARES
                    </h2>
                    <p className="hidden md:block text-gray-400 mt-1">Transforma listas de proveedores (Dólar/Peso) con inteligencia Multi-Marca.</p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button
                        onClick={handleClear}
                        className="flex-1 md:flex-none p-2 md:p-3 bg-white/5 md:bg-transparent text-gray-500 hover:text-white rounded-xl border border-white/5 md:border-none transition-colors flex items-center justify-center italic text-xs"
                        title="Limpiar todo"
                    >
                        <RotateCcw className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-0" />
                        <span className="md:hidden">Reiniciar</span>
                    </button>
                    <button
                        onClick={handleTransform}
                        className="flex-[2] md:flex-none bg-dh-gold hover:bg-yellow-600 text-black font-bold px-4 md:px-8 py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-dh-gold/20 active:scale-95 text-sm md:text-base"
                    >
                        Transformar Lista
                        <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* SETTINGS AREA */}
                <div className="space-y-4 md:space-y-6">
                    <section className="bg-dh-gray/40 backdrop-blur-md border border-white/5 p-4 md:p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-4 md:mb-6">
                            <h3 className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout className="w-4 h-4" /> Configuración Global
                            </h3>
                            <div className="flex items-center gap-2">
                                <label className="text-[10px] text-gray-500 font-bold">DÓLAR BLUE</label>
                                <div className="relative w-24 md:w-32">
                                    <input
                                        type="number"
                                        value={dolarBlue}
                                        onChange={(e) => setDolarBlue(e.target.value)}
                                        className="w-full bg-black/40 border border-dh-gold/30 rounded-lg p-2 text-dh-gold font-mono text-sm focus:border-dh-gold outline-none transition-colors"
                                    />
                                    {isFetchingDolar && <TrendingUp className="absolute right-2 top-1/2 -translate-y-1/2 text-dh-gold/50 w-3 h-3 animate-pulse" />}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                            {/* ANDROID BLOCK */}
                            <div className="bg-blue-500/5 border border-blue-500/10 p-3 md:p-4 rounded-xl">
                                <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-2 md:mb-3 flex items-center gap-2">
                                    <Smartphone className="w-3 h-3" /> Android / General
                                </h4>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">RECARGO (%)</label>
                                        <input
                                            type="number"
                                            value={markupAndroid}
                                            onChange={(e) => setMarkupAndroid(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono text-sm focus:border-dh-gold outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">CUOTAS</label>
                                        <input
                                            type="number"
                                            value={installmentsAndroid}
                                            onChange={(e) => setInstallmentsAndroid(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono text-sm focus:border-dh-gold outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* IPHONE BLOCK */}
                            <div className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-xl">
                                <h4 className="text-[10px] font-bold text-gray-300 uppercase mb-2 md:mb-3 flex items-center gap-2">
                                    <Apple className="w-3 h-3" /> iPhone / Apple
                                </h4>
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">RECARGO (%)</label>
                                        <input
                                            type="number"
                                            value={markupIphone}
                                            onChange={(e) => setMarkupIphone(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono text-sm focus:border-dh-gold outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] text-gray-500 mb-1">CUOTAS</label>
                                        <input
                                            type="number"
                                            value={installmentsIphone}
                                            onChange={(e) => setInstallmentsIphone(e.target.value)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono text-sm focus:border-dh-gold outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-dh-gray/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col h-[350px] md:h-[400px]">
                        <div className="flex items-center justify-between mb-2 px-2">
                            <h3 className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                                Lista del Proveedor
                            </h3>
                            <button
                                onClick={() => setInputList('')}
                                className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20"
                                title="Limpiar entrada"
                            >
                                <RotateCcw className="w-3 h-3" />
                                BORRAR
                            </button>
                        </div>
                        <textarea
                            value={inputList}
                            onChange={(e) => setInputList(e.target.value)}
                            placeholder="Pega aquí la lista mixta (S24, iPhone 16, iPad...)"
                            className="flex-1 bg-black/20 border border-white/5 rounded-xl p-4 text-gray-300 font-mono text-sm focus:border-dh-gold/50 outline-none resize-none placeholder:text-gray-700"
                        />
                    </section>
                </div>

                {/* RESULT AREA */}
                <section className="bg-dh-gray/40 backdrop-blur-md border border-white/5 p-4 rounded-2xl flex flex-col h-[500px] md:h-full">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h3 className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-widest">
                            Resultado Final
                        </h3>
                        {result && (
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                                    copied 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                                }`}
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span className="text-xs font-bold">{copied ? 'Copiado' : 'Copiar'}</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 bg-black/40 border border-white/10 rounded-xl p-4 overflow-auto scrollbar-hide relative group">
                        {!result && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 opacity-50 p-8 text-center">
                                <Smartphone className="w-10 h-10 md:w-12 md:h-12 mb-4" />
                                <p className="text-xs md:text-sm">Toca "Transformar Lista" arriba para ver el resultado.</p>
                            </div>
                        )}
                        <pre className="text-gray-200 font-mono text-xs md:text-sm whitespace-pre-wrap select-all">
                            {result}
                        </pre>
                    </div>
                </section>
            </div>
            
            <div className="bg-dh-gold/5 md:bg-dh-gold/10 border border-dh-gold/10 md:border-dh-gold/20 p-3 md:p-4 rounded-xl flex gap-3 text-dh-gold text-[10px] leading-relaxed">
                <Info className="w-5 h-5 flex-shrink-0 hidden md:block" />
                <p>
                    <strong>Tip Móvil:</strong> Pega tu lista, toca el botón amarillo arriba y luego "Copiar". ¡Listo para enviar por WhatsApp!
                </p>
            </div>

            {/* Floating Action Button for Mobile only if there is input and no result yet (or just always) */}
            {inputList.length > 0 && !result && (
                <div className="fixed bottom-6 right-6 z-40 md:hidden">
                    <button
                        onClick={handleTransform}
                        className="bg-dh-gold text-black w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95 animate-bounce"
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
}
