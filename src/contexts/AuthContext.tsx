'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
    user: User | null;
    isLoading: boolean;
    signInWithPassword: (email: string, password: string) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Create the client once per component tree
    const [supabase] = useState(() => createClientComponentClient());

    useEffect(() => {
        let mounted = true;

        const initSession = async () => {
            try {
                // Get session from cookie (handled by auth-helpers)
                const { data: { session } } = await supabase.auth.getSession();

                if (mounted) {
                    if (session?.user) {
                        setUser(session.user);
                    } else {
                        setUser(null);
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        initSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (mounted) {
                setUser(session?.user ?? null);
                setIsLoading(false);

                if (event === 'SIGNED_IN') {
                    router.refresh();
                }
                if (event === 'SIGNED_OUT') {
                    router.refresh();
                    router.push('/login');
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [supabase, router]);

    const signInWithPassword = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!error) {
            router.refresh();
        }

        return { error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, signInWithPassword, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
