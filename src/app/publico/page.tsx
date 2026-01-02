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
        const phone = "5492615163475"; // Replace with real company number provided later or env var
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
