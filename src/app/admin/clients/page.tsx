"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { UserPlus, Search, Save, Trash2, AlertCircle } from "lucide-react";

interface Client {
    id: number;
    dni: string;
    full_name: string;
    min_amount: number;
    max_amount: number;
    created_at: string;
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Add Form State
    const [dni, setDni] = useState("");
    const [name, setName] = useState("");
    const [minAmount, setMinAmount] = useState("50000");
    const [maxAmount, setMaxAmount] = useState("2000000");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const res = await fetch('/api/admin/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/admin/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dni, fullName: name, minAmount, maxAmount })
            });

            if (res.ok) {
                alert("Cliente guardado correctamente");
                setDni("");
                setName("");
                fetchClients();
            } else {
                alert("Error al guardar");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    // Generic Update Function
    const updateClient = async (id: number, field: keyof Client, value: string | number) => {
        // Optimistic Update
        const oldClients = [...clients];
        setClients(clients.map(c => c.id === id ? { ...c, [field]: value } : c));

        try {
            const payload: any = { id };
            payload[field] = value;
            // Map frontend keys to API expectation if needed, but our API uses slightly different keys for PUT?
            // Let's check API: PUT expects { id, dni, fullName, maxAmount, minAmount }
            // We need to map field names.

            const apiPayload: any = { id };
            if (field === 'full_name') apiPayload.fullName = value;
            if (field === 'dni') apiPayload.dni = value;
            if (field === 'max_amount') apiPayload.maxAmount = value;
            if (field === 'min_amount') apiPayload.minAmount = value;

            const res = await fetch('/api/admin/clients', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload)
            });

            if (!res.ok) {
                // Revert on failure
                setClients(oldClients);
                alert("Error al actualizar");
            }
        } catch (e) {
            console.error(e);
            setClients(oldClients);
        }
    };

    const deleteClient = async (id: number) => {
        if (!confirm("¿Seguro que quieres eliminar este cliente?")) return;
        try {
            await fetch(`/api/admin/clients?id=${id}`, { method: 'DELETE' });
            // Filter out directly
            setClients(clients.filter(c => c.id !== id));
        } catch (e) {
            console.error(e);
        }
    }

    // Filter Logic
    const filteredClients = useMemo(() => {
        if (!searchTerm) return clients;
        const lower = searchTerm.toLowerCase();
        return clients.filter(c =>
            c.dni.includes(lower) ||
            c.full_name?.toLowerCase().includes(lower)
        );
    }, [clients, searchTerm]);

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <h1 className="text-3xl font-black text-white tracking-tighter">
                Base de Datos <span className="text-dh-gold">Clientes</span>
            </h1>

            {/* ADD FORM */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <UserPlus className="text-dh-gold" />
                    Cargar Nuevo Cliente
                </h2>
                <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">DNI</label>
                        <input type="text" required value={dni} onChange={e => setDni(e.target.value.replace(/\D/g, ''))} className="input-dh" placeholder="Sin puntos" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Nombre</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-dh" placeholder="Nombre completo" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Mínimo ($)</label>
                        <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="input-dh" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Máximo ($)</label>
                        <input type="number" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="input-dh" />
                    </div>
                    <button disabled={saving} className="btn-dh-gold h-[46px]">
                        {saving ? '...' : 'Guardar'}
                    </button>
                </form>
            </div>

            {/* SEARCH & TABLE */}
            <div className="space-y-4">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/5">
                    <Search className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por DNI, Nombre o Apellido..."
                        className="bg-transparent text-white w-full outline-none placeholder:text-gray-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="overflow-x-auto rounded-xl border border-white/10">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/40 text-gray-400 text-xs uppercase tracking-wider">
                                <th className="p-4">DNI</th>
                                <th className="p-4">Nombre Completo</th>
                                <th className="p-4">Cupo Mínimo</th>
                                <th className="p-4">Cupo Máximo</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                            {filteredClients.map(client => (
                                <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-mono">
                                        <EditableCell
                                            value={client.dni}
                                            onSave={(val) => updateClient(client.id, 'dni', val)}
                                        />
                                    </td>
                                    <td className="p-4">
                                        <EditableCell
                                            value={client.full_name}
                                            onSave={(val) => updateClient(client.id, 'full_name', val)}
                                        />
                                    </td>
                                    <td className="p-4 text-red-500 font-bold">
                                        <EditableCell
                                            value={client.min_amount}
                                            type="currency"
                                            onSave={(val) => updateClient(client.id, 'min_amount', Number(val))}
                                        />
                                    </td>
                                    <td className="p-4 text-dh-gold font-bold">
                                        <EditableCell
                                            value={client.max_amount}
                                            type="currency"
                                            onSave={(val) => updateClient(client.id, 'max_amount', Number(val))}
                                        />
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => deleteClient(client.id)}
                                            className="p-2 hover:bg-red-500/10 rounded-lg text-gray-600 hover:text-red-500 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredClients.length === 0 && (
                        <div className="p-8 text-center text-gray-500">No se encontraron clientes.</div>
                    )}
                </div>
            </div>

            <style jsx global>{`
                .input-dh {
                    width: 100%;
                    background: rgba(0,0,0,0.4);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.5rem;
                    padding: 0.75rem 1rem;
                    color: white;
                    outline: none;
                }
                .input-dh:focus {
                    border-color: #D4AF37;
                }
                .btn-dh-gold {
                    background: #D4AF37;
                    color: black;
                    font-weight: bold;
                    border-radius: 0.5rem;
                    padding: 0 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }
                .btn-dh-gold:hover {
                    background: #F4CF57;
                    box-shadow: 0 0 15px rgba(212,175,55,0.2);
                }
            `}</style>
        </div>
    );
}

// Sub-component for Click-to-Edit
function EditableCell({ value, onSave, type = 'text' }: { value: string | number, onSave: (val: string) => void, type?: 'text' | 'currency' }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (currentValue != value) { // Loose equality for number/string match
            onSave(String(currentValue));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                type={type === 'currency' ? 'number' : 'text'}
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="bg-black border border-dh-gold rounded p-1 w-full text-white outline-none min-w-[100px]"
            />
        );
    }

    return (
        <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-white/10 p-1 rounded -ml-1 border border-transparent hover:border-white/10 transition-all min-w-[20px] min-h-[20px]"
            title="Click para editar"
        >
            {type === 'currency' ? `$${Number(value).toLocaleString('es-AR')}` : value}
        </div>
    );
}
