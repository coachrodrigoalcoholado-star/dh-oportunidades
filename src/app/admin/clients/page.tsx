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

// FORMAT HELPER
const formatCurrency = (value: string | number) => {
    if (!value) return "";
    return Number(value).toLocaleString("es-AR");
};

const parseCurrency = (value: string) => {
    return value.replace(/\./g, "");
};

function FormattedNumberInput({ value, onChange, className, placeholder }: { value: string, onChange: (val: string) => void, className?: string, placeholder?: string }) {

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\./g, '');
        if (!/^\d*$/.test(raw)) return;

        const formatted = raw ? Number(raw).toLocaleString("es-AR") : "";
        onChange(formatted);
    };

    return (
        <input
            type="text"
            value={value}
            onChange={handleChange}
            className={className}
            placeholder={placeholder}
        />
    );
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Add Form State
    const [dni, setDni] = useState("");
    const [name, setName] = useState("");
    const [minAmount, setMinAmount] = useState("50.000");
    const [maxAmount, setMaxAmount] = useState("2.000.000");
    const [saving, setSaving] = useState(false);

    // Bulk Edit State
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkMin, setBulkMin] = useState("50.000");
    const [bulkMax, setBulkMax] = useState("2.000.000");
    const [bulkUpdating, setBulkUpdating] = useState(false);



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

                body: JSON.stringify({
                    dni,
                    fullName: name,
                    minAmount: parseCurrency(minAmount),
                    maxAmount: parseCurrency(maxAmount)
                })
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


    const handleBulkUpdate = async () => {
        if (!confirm(`¿Estás seguro de actualizar los montos de ${clients.length} clientes?\n\nMínimo: $${bulkMin}\nMáximo: $${bulkMax}`)) {
            return;
        }

        setBulkUpdating(true);
        // Clean values before sending
        const minVal = Number(parseCurrency(bulkMin));
        const maxVal = Number(parseCurrency(bulkMax));

        try {
            // Frontend-side iteration to utilize existing PUT endpoint
            const promises = clients.map(client =>
                fetch('/api/admin/clients', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: client.id,
                        // Only update amounts
                        minAmount: minVal,
                        maxAmount: maxVal
                    })
                })
            );

            await Promise.all(promises);

            alert("Actualización masiva completada con éxito");
            setShowBulkEdit(false);
            fetchClients();
        } catch (error) {
            console.error(error);
            alert("Hubo un error en la actualización masiva");
        } finally {
            setBulkUpdating(false);
        }
    };

    // Modified updateClient to handle special 'all_amounts' case or just reuse loop
    // Actually, updateClient was designed for single field. Let's make a specific loop in handleBulkUpdate
    // calling the API directly or reusing updateClient if adapted.
    // Let's adapt existing updateClient to handle standard calls, but for bulk we need a slight tweak or just call fetch directly.
    // To keep it simple, I'll just refactor updateClient slightly or use a direct fetch in the loop above?
    // Let's refactor updateClient to allow generic updates or just use a helper.
    // Actually, looking at updateClient, it does a fetch PUT. I can just call that inside the loop.
    // BUT updateClient updates state locally too. 
    // Let's NOT use updateClient inside the loop to avoid 1000 rerenders. 
    // Instead, loop the FETCH and then fetchClients() at the end.

    // REDEFINING handleBulkUpdate properly:


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

            {/* BULK EDIT TOGGLE */}
            <div className="flex justify-end -mt-4">
                <button
                    onClick={() => setShowBulkEdit(!showBulkEdit)}
                    className="text-xs text-dh-gold hover:underline flex items-center gap-1"
                >
                    {showBulkEdit ? 'Cancelar Edición Masiva' : 'Habilitar Edición Masiva'}
                </button>
            </div>

            {/* BULK EDIT PANEL */}
            {showBulkEdit && (
                <div className="bg-dh-gold/10 border border-dh-gold/30 p-4 rounded-xl mb-6 animate-in fade-in slide-in-from-top-4">
                    <h3 className="text-dh-gold font-bold mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Edición Masiva (Afecta a {clients.length} clientes)
                    </h3>
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-dh-gold/70 mb-1">Nuevo Mínimo Global</label>
                            <FormattedNumberInput
                                value={bulkMin}
                                onChange={setBulkMin}
                                className="input-dh border-dh-gold/50"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-dh-gold/70 mb-1">Nuevo Máximo Global</label>
                            <FormattedNumberInput
                                value={bulkMax}
                                onChange={setBulkMax}
                                className="input-dh border-dh-gold/50"
                            />
                        </div>
                        <button
                            onClick={handleBulkUpdate}
                            disabled={bulkUpdating}
                            className="bg-dh-gold text-black font-bold h-[46px] px-6 rounded-lg hover:bg-white transition-colors"
                        >
                            {bulkUpdating ? 'Actualizando...' : 'Aplicar a Todos'}
                        </button>
                    </div>
                </div>
            )}

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
                        <FormattedNumberInput value={minAmount} onChange={setMinAmount} className="input-dh" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1">Máximo ($)</label>
                        <FormattedNumberInput value={maxAmount} onChange={setMaxAmount} className="input-dh" />
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
        // If type is currency, value comes as number from DB. 
        // We format it for display if not editing.
        // When editing, we want the number.
        // Wait, EditableCell needs to handle the input format too? 
        // The user request "agregar los puntos y comas... dado que al ingresar o editar no se visualiza"
        // YES, even in the inline edit.
        setCurrentValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        // Clean format before saving
        const cleanVal = String(currentValue).replace(/\./g, '');
        if (cleanVal != String(value)) {
            onSave(cleanVal);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    const handleFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\./g, '');
        if (!/^\d*$/.test(raw)) return;
        const formatted = raw ? Number(raw).toLocaleString("es-AR") : "";
        setCurrentValue(formatted); // Store FORMATTED value in local state during edit
    }

    if (isEditing) {
        if (type === 'currency') {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    value={String(currentValue).includes('.') ? currentValue : Number(currentValue).toLocaleString('es-AR')} // Ensure it shows formatted on entry
                    onChange={handleFormatChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="bg-black border border-dh-gold rounded p-1 w-full text-white outline-none min-w-[100px]"
                />
            )
        }
        return (
            <input
                ref={inputRef}
                type="text"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                // ... rest
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
