"use client";

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Settings, LogOut, FileText, Calculator } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, signOut } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading) {
            if (!user) {
                router.push('/login');
            } else if (user.user_metadata?.role !== 'admin') {
                router.push('/');
            }
        }
    }, [user, isLoading, router]);

    // Force render regardless of loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-dh-gold gap-4">
                <p>Cargando sistema...</p>
            </div>
        );
    }

    if (!user) return null;

    // RBAC: Role Based Menus
    // FIX: user.role is likely 'authenticated'. We need user_metadata.role
    const userRole = user.user_metadata?.role || 'agent';
    const isAdmin = userRole === 'admin';

    const navItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, requiredRole: 'admin' },
        { name: 'Usuarios', href: '/admin/users', icon: Users, requiredRole: 'admin' },
        { name: 'Configuración', href: '/admin/config', icon: Settings, requiredRole: 'admin' },
    ];

    return (
        <div className="flex h-screen bg-dh-dark text-white overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/10 bg-black/20 backdrop-blur-xl flex flex-col">
                <div className="p-6 border-b border-white/10 flex items-center gap-3">
                    <img src="/logo-new.png" alt="DH" className="w-10 h-10 object-contain" />
                    <div>
                        <h1 className="font-bold text-sm tracking-widest text-white">ADMIN</h1>
                        <p className="text-[10px] text-dh-gold uppercase tracking-wider">Internal Tool</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 flex flex-col gap-2">
                    {/* Simulator Shortcut */}
                    <Link href="/">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-dh-gold bg-dh-gold/10 hover:bg-dh-gold/20 transition-all border border-dh-gold/20 mb-2">
                            <Calculator className="w-5 h-5" />
                            <span className="text-sm font-bold">Simular Préstamo</span>
                        </div>
                    </Link>

                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        // HIDE if not authorized
                        if (item.requiredRole === 'admin' && !isAdmin) return null;

                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                    ? 'bg-dh-gold text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}>
                                    <item.icon className="w-5 h-5" />
                                    <span className="text-sm">{item.name}</span>
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {user ? (
                            <>
                                <div className="w-8 h-8 rounded-full bg-dh-gold/20 flex items-center justify-center text-dh-gold font-bold text-xs">
                                    {user.email?.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium truncate">{user.email}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user.user_metadata?.role || 'user'}</p>
                                </div>
                            </>
                        ) : (
                            <div className="text-red-500 font-bold">NO USER DETECTED</div>
                        )}
                    </div>
                    {/* DEBUG INFO */}
                    {/* <div className="text-[10px] text-yellow-500 font-mono mb-2 bg-black/50 p-2 rounded">
                        isLoading: {isLoading ? 'TRUE' : 'FALSE'}<br />
                        User: {user ? 'YES' : 'NO'}
                    </div> */}

                    <button
                        onClick={async () => {
                            try {
                                await signOut();
                            } catch (e) {
                                console.error("Logout error:", e);
                            }

                            // Aggressively clear cookies to prevent "redirect back" loop
                            // This ensures Supabase auth cookies are removed even if signOut failed locally
                            document.cookie.split(";").forEach((c) => {
                                document.cookie = c
                                    .replace(/^ +/, "")
                                    .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                            });

                            window.location.href = '/login';
                        }}
                        className="w-full flex items-center justify-center gap-2 text-red-400 text-xs hover:bg-red-500/10 py-2 rounded-lg transition-colors"
                    >
                        <LogOut className="w-3 h-3" />
                        Cerrar Sesión
                    </button>
                    <div className="mt-4 text-[10px] text-center text-gray-700">
                        v1.1.0 Internal
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-gradient-to-br from-dh-dark via-gray-900 to-black relative">
                <div className="p-8 max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

