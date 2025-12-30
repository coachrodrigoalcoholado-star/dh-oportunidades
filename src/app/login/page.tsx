"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    // Manual client for hash processing
    const [supabase] = useState(() => createClientComponentClient());

    useEffect(() => {
        // Force-check for hash session (Magic Link fix)
        if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            console.log('Magic Link detected, verifying session...');
            supabase.auth.getSession().then(({ data: { session } }) => {
                if (session) {
                    console.log('Session recovered! Redirecting...');
                    router.push('/admin');
                    router.refresh();
                }
            });
        }
    }, [supabase, router]);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');
    const { signInWithPassword, user } = useAuth();

    // If already logged in, redirect
    if (user) {
        const dest = user.user_metadata?.role === 'admin' ? '/admin' : '/simulador';
        // Avoid infinite loop if we are already on the target page (unlikely in login page but good practice)
        // Router push is safe here
        router.push(dest);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            // @ts-ignore
            // eslint-disable-next-line
            const { error, data } = await signInWithPassword(email, password);
            if (error) {
                setStatus('error');
                setErrorMsg(error.message || "Credenciales inválidas. Intenta nuevamente.");
                console.error(error);
            } else {
                setStatus('success');
                // Check role to decide destination
                const role = data?.user?.user_metadata?.role;
                const destination = role === 'admin' ? '/admin' : '/simulador';

                // Force hard navigation to ensure cookies are fresh for middleware
                window.location.href = destination;
            }
        } catch (err: any) {
            setStatus('error');
            setErrorMsg(err.message || 'Error desconocido');
        }
    };

    return (
        <main className="min-h-screen bg-dh-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience similar to home */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-dh-gold/5 rounded-full blur-[100px]" />
            </div>

            <div className="z-10 w-full max-w-md">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-dh-gray/50 backdrop-blur-md p-8 rounded-2xl border border-white/5 shadow-2xl"
                >
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-white mb-2">Acceso Interno</h1>
                        <p className="text-gray-400 text-sm">DH OPORTUNIDADES</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        <div className="relative">
                            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 ml-3" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="correo@empresa.com"
                                className="w-full bg-black/20 border border-white/10 focus:border-dh-gold rounded-xl text-white pl-10 py-3 outline-none transition-colors placeholder:text-gray-600"
                            />
                        </div>

                        <div className="relative">
                            {/* Simple Password Input */}
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Contraseña"
                                className="w-full bg-black/20 border border-white/10 focus:border-dh-gold rounded-xl text-white pl-4 py-3 outline-none transition-colors placeholder:text-gray-600"
                            />
                        </div>

                        {status === 'error' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                                {errorMsg}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className="w-full bg-dh-gold hover:bg-yellow-600 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-wait"
                        >
                            {status === 'loading' ? 'Ingresando...' : status === 'success' ? '¡Éxito!' : 'Iniciar Sesión'}
                        </button>

                        <div className="text-center text-xs text-gray-500">
                            ¿Olvidaste tu contraseña? Contacta al administrador.
                        </div>
                    </form>
                </motion.div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-gray-500 text-xs hover:text-dh-gold transition-colors">
                        ← Volver al Simulador (Público)
                    </Link>
                </div>
            </div>
        </main>
    );
}
