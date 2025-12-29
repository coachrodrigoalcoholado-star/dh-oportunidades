"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { UserPlus, Search, Shield, User as UserIcon, Trash2, Key, X, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClientComponentClient();

    // Create User Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createFormData, setCreateFormData] = useState({ email: '', password: '', role: 'agent' });
    const [createStatus, setCreateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [createErrorMsg, setCreateErrorMsg] = useState('');

    // Change Password Modal
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [selectedUserForPassword, setSelectedUserForPassword] = useState<any>(null);
    const [newPassword, setNewPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    // UI Feedback
    const [globalMsg, setGlobalMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (data) setUsers(data);
        setLoading(false);
    };

    // --- CREATE USER ---
    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateStatus('loading');
        setCreateErrorMsg('');

        try {
            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createFormData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al crear usuario');

            setCreateStatus('success');
            setTimeout(() => {
                setIsCreateModalOpen(false);
                setCreateStatus('idle');
                setCreateFormData({ email: '', password: '', role: 'agent' });
                fetchUsers();
                setGlobalMsg({ type: 'success', text: 'Usuario creado correctamente' });
            }, 1000);
        } catch (error: any) {
            setCreateStatus('error');
            setCreateErrorMsg(error.message);
        }
    };

    // --- DELETE USER ---
    const handleDeleteUser = async (userToDelete: any) => {
        if (!confirm(`¿Estás seguro de que quieres eliminar al usuario ${userToDelete.email}? Esta acción no se puede deshacer.`)) {
            return;
        }

        try {
            const res = await fetch(`/api/admin/users/${userToDelete.id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al eliminar usuario');
            }

            setGlobalMsg({ type: 'success', text: `Usuario ${userToDelete.email} eliminado` });
            fetchUsers();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
    };

    // --- CHANGE PASSWORD ---
    const openPasswordModal = (user: any) => {
        setSelectedUserForPassword(user);
        setNewPassword('');
        setPasswordStatus('idle');
        setIsPasswordModalOpen(true);
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus('loading');

        try {
            const res = await fetch(`/api/admin/users/${selectedUserForPassword.id}/password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Error al cambiar contraseña');
            }

            setPasswordStatus('success');
            setTimeout(() => {
                setIsPasswordModalOpen(false);
                setPasswordStatus('idle');
                setSelectedUserForPassword(null);
                setGlobalMsg({ type: 'success', text: 'Contraseña actualizada correctamente' });
            }, 1000);

        } catch (error: any) {
            setPasswordStatus('error');
            // Assuming we added a state for password error message, or just reuse alert for simplicity in modal
            alert('Error: ' + error.message);
        }
    };

    // Clear global msg after 3s
    useEffect(() => {
        if (globalMsg) {
            const timer = setTimeout(() => setGlobalMsg(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [globalMsg]);


    return (
        <div className="max-w-6xl relative">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-gray-400 mt-1">Control de acceso y roles del sistema.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-dh-gold hover:bg-yellow-500 text-black font-bold px-4 py-3 rounded-xl flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(212,175,55,0.2)]"
                >
                    <UserPlus className="w-4 h-4" />
                    Crear Usuario
                </button>
            </header>

            {/* GLOBAL FEEDBACK */}
            {globalMsg && (
                <div className={`fixed top-4 right-4 z-[60] px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-5 ${globalMsg.type === 'success' ? 'bg-green-500 text-black font-bold' : 'bg-red-500 text-white font-bold'
                    }`}>
                    {globalMsg.type === 'success' ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                    {globalMsg.text}
                </div>
            )}

            {/* CREATE USER MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Nuevo Usuario</h3>
                        <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Correo Electrónico</label>
                                <input
                                    type="email"
                                    required
                                    value={createFormData.email}
                                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-dh-gold"
                                    placeholder="ejemplo@dhoportunidades.com"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={createFormData.password}
                                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-dh-gold"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Rol</label>
                                <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setCreateFormData({ ...createFormData, role: 'agent' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${createFormData.role === 'agent' ? 'bg-dh-gold text-black' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Asesor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setCreateFormData({ ...createFormData, role: 'admin' })}
                                        className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${createFormData.role === 'admin' ? 'bg-dh-gold text-black' : 'text-gray-500 hover:text-white'}`}
                                    >
                                        Admin
                                    </button>
                                </div>
                            </div>

                            {createStatus === 'error' && (
                                <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    {createErrorMsg}
                                </div>
                            )}

                            {createStatus === 'success' && (
                                <div className="text-green-400 text-xs bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center font-bold">
                                    ¡Usuario creado correctamente!
                                </div>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={createStatus === 'loading' || createStatus === 'success'}
                                    className="flex-1 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {createStatus === 'loading' ? 'Creando...' : 'Crear Usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PASSWORD CHANGE MODAL */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#1A1A1A] border border-white/10 p-6 rounded-2xl w-full max-w-md shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Cambiar Contraseña</h3>
                        <p className="text-gray-400 text-sm mb-4">
                            Para: <span className="text-dh-gold font-bold">{selectedUserForPassword?.email}</span>
                        </p>
                        <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">Nueva Contraseña</label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-white outline-none focus:border-dh-gold"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            {passwordStatus === 'error' && (
                                <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                                    Error al cambiar contraseña
                                </div>
                            )}

                            {passwordStatus === 'success' && (
                                <div className="text-green-400 text-xs bg-green-500/10 p-3 rounded-lg border border-green-500/20 text-center font-bold">
                                    ¡Contraseña actualizada!
                                </div>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsPasswordModalOpen(false)}
                                    className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordStatus === 'loading' || passwordStatus === 'success'}
                                    className="flex-1 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {passwordStatus === 'loading' ? 'Guardando...' : 'Guardar Cambios'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            <div className="bg-dh-gray/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar usuario por nombre o email..."
                            className="w-full bg-black/20 border border-white/10 rounded-lg pl-9 py-2 text-sm text-white outline-none focus:border-dh-gold transition-colors"
                        />
                    </div>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Rol</th>
                            {/* <th className="px-6 py-4 text-center">Simulaciones</th> */}
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">Cargando usuarios...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-500">No hay usuarios registrados.</td></tr>
                        ) : users.map((u) => (
                            <tr key={u.id} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dh-gold to-yellow-700 flex items-center justify-center text-black font-bold text-xs">
                                            {u.email?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{u.full_name || 'Sin Nombre'}</p>
                                            <p className="text-gray-500 text-xs">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold border ${u.role === 'admin'
                                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                        }`}>
                                        {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <UserIcon className="w-3 h-3" />}
                                        {u.role === 'admin' ? 'Administrador' : 'Asesor'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => openPasswordModal(u)}
                                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            title="Cambiar Contraseña"
                                        >
                                            <Key className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteUser(u)}
                                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                            title="Eliminar Usuario"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

