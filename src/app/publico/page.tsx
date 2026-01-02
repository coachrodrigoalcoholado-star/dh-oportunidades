"use client";

import { useState } from "react";
import Simulator from "@/components/Simulator";
import { Search, ShieldCheck, ArrowRight } from "lucide-react";

export default function PublicSimulatorPage() {
    const [step, setStep] = useState<'dni' | 'simulator'>('dni');
    const [dni, setDni] = useState("");
    const [client, setClient] = useState<{ fullName: string, minAmount: number, maxAmount: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const checkDni = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch('/api/clients/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni })
            });
            const data = await res.json();

            if (data.found && data.client) {
                setClient(data.client);
                setStep('simulator');
            } else {
                setError("DNI no encontrado o no habilitado para operar.");
                // Optional: Allow generic simulation? 
                // "Si crees que es un error, contacta a un asesor."
            }
        } catch (err) {
            setError("Error de conexión. Intenta nuevamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleSolicitar = (amount: number, installments: number, val: number) => {
        // WhatsApp Redirect
        // Format message
        const message = `Hola, soy ${client?.fullName || 'Cliente'} (DNI: ${dni}).\nQuiero solicitar un préstamo de *$${amount.toLocaleString('es-AR')}*.\nPlan seleccionado: *${installments} cuotas de $${Math.round(val).toLocaleString('es-AR')}*.`;

        // Encode URL
        const phone = "5492616097457"; // Updated to correct company number
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dh-dark text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-dh-gold/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md z-10 flex flex-col items-center">
                <div className="mb-6 text-center">
                    <img src="/logo-new.png" alt="DH Oportunidades" className="h-16 object-contain mb-4 mx-auto" />
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        DH OPORTUNIDADES
                    </h1>
                </div>

                {step === 'dni' ? (
                    <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-2xl">
                        <h2 className="text-xl font-bold text-center mb-6">Consulta tu Disponible</h2>
                        <form onSubmit={checkDni} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1 uppercase">Ingresa tu DNI</label>
                                <div className="relative">
                                    <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-dh-gold w-5 h-5" />
                                    <input
                                        type="text"
                                        required
                                        value={dni}
                                        onChange={(e) => setDni(e.target.value.replace(/\D/g, ''))}
                                        placeholder="Ej: 30123456"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-10 py-4 text-white text-lg font-bold outline-none focus:border-dh-gold transition-colors placeholder:text-gray-600 placeholder:font-normal"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading || !dni}
                                className="w-full bg-dh-gold hover:bg-yellow-500 text-black font-black py-4 rounded-xl shadow-lg shadow-dh-gold/20 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verificando...' : <>Consultar <ArrowRight className="w-5 h-5" /></>}
                            </button>
                        </form>
                        <p className="text-[10px] text-gray-500 mt-6 text-center">
                            Sistema seguro de verificación crediticia.
                        </p>

                        {error && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <p className="text-center text-gray-400 text-xs mb-3">
                                    Por favor, comunicate con DH OPORTUNIDADES.
                                </p>
                                <a
                                    href="https://wa.me/5492616097457?text=Hola,%20no%20pude%20validar%20mi%20DNI.%20Necesito%20ayuda."
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-green-900/20"
                                >
                                    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Contactar a DH OPORTUNIDADES
                                </a>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full animate-fadeIn">
                        <div className="bg-gradient-to-r from-dh-gold/20 to-transparent border border-dh-gold/30 p-4 rounded-xl mb-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-dh-gold font-bold uppercase">Hola, {client?.fullName}</p>
                                <p className="text-white text-sm">Tu disponible es de hasta <span className="font-bold text-xl block md:inline">${client?.maxAmount.toLocaleString('es-AR')}</span></p>
                            </div>
                            <button onClick={() => setStep('dni')} className="text-xs text-gray-400 underline hover:text-white">Cambiar</button>
                        </div>

                        <Simulator
                            forcedMode="loans"
                            minLimit={client?.minAmount}
                            maxLimit={client?.maxAmount}
                            onSolicitar={handleSolicitar}
                            hideHeader={true}
                        />

                        <div className="text-center mt-6">
                            <p className="text-[10px] text-gray-500">
                                Al hacer clic en "Solicitar", serás redirigido a WhatsApp para finalizar la gestión con un asesor.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
