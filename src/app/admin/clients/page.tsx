"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { UserPlus, Search, Save, Trash2, AlertCircle, FileSpreadsheet, Upload, X, CheckCircle2 } from "lucide-react";
import * as XLSX from 'xlsx';

interface Client {
    id: number;
    dni: string;
    full_name: string;
    min_amount: number;
    max_amount: number;
    created_at: string;
}

interface ExcelClientPreview {
    dni: string;
    fullName: string;
    minAmount: number;
    maxAmount: number;
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

    // Excel Bulk Import State
    const [showExcelModal, setShowExcelModal] = useState(false);
    const [excelPreview, setExcelPreview] = useState<ExcelClientPreview[]>([]);
    const [excelFileName, setExcelFileName] = useState("");
    const [importingExcel, setImportingExcel] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        const oldClients = [...clients];
        setClients(clients.map(c => c.id === id ? { ...c, [field]: value } : c));

        try {
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
            setClients(clients.filter(c => c.id !== id));
        } catch (e) {
            console.error(e);
        }
    };

    const handleBulkUpdate = async () => {
        if (!confirm(`¿Estás seguro de actualizar los montos de ${clients.length} clientes?\n\nMínimo: $${bulkMin}\nMáximo: $${bulkMax}`)) {
            return;
        }

        setBulkUpdating(true);
        const minVal = Number(parseCurrency(bulkMin));
        const maxVal = Number(parseCurrency(bulkMax));

        try {
            const promises = clients.map(client =>
                fetch('/api/admin/clients', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: client.id,
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

    // Excel Parsing Handler
    const processExcelFile = (file: File) => {
        if (!file) return;
        setExcelFileName(file.name);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    alert("El archivo cargado no contiene datos.");
                    return;
                }

                let headerRowIndex = -1;
                let dniCol = -1;
                let nameCol = -1;
                let minCol = -1;
                let maxCol = -1;

                // Search for headers in first 10 rows
                for (let r = 0; r < Math.min(10, jsonData.length); r++) {
                    const row = jsonData[r];
                    if (!Array.isArray(row)) continue;

                    row.forEach((cell: any, cIndex: number) => {
                        const cellStr = String(cell || '').toLowerCase().trim();
                        if (['dni', 'documento', 'cedula', 'id', 'nro_documento', 'cuil'].some(h => cellStr.includes(h))) {
                            if (dniCol === -1) dniCol = cIndex;
                        }
                        if (['nombre', 'name', 'full_name', 'cliente', 'nombre completo', 'apellido'].some(h => cellStr.includes(h))) {
                            if (nameCol === -1) nameCol = cIndex;
                        }
                        if (['minimo', 'mínimo', 'min', 'cupo minimo', 'cupo mínimo', 'monto minimo'].some(h => cellStr.includes(h))) {
                            if (minCol === -1) minCol = cIndex;
                        }
                        if (['maximo', 'máximo', 'max', 'cupo maximo', 'cupo máximo', 'monto maximo'].some(h => cellStr.includes(h))) {
                            if (maxCol === -1) maxCol = cIndex;
                        }
                    });

                    if (dniCol !== -1) {
                        headerRowIndex = r;
                        break;
                    }
                }

                // If headers not found by label, infer col 0=DNI, 1=Name, 2=Min, 3=Max
                if (dniCol === -1) {
                    dniCol = 0;
                    if (jsonData[0] && jsonData[0].length > 1) nameCol = 1;
                    if (jsonData[0] && jsonData[0].length > 2) minCol = 2;
                    if (jsonData[0] && jsonData[0].length > 3) maxCol = 3;
                    headerRowIndex = -1; // start from row 0
                }

                const parsedClients: ExcelClientPreview[] = [];
                const startRow = headerRowIndex + 1;

                for (let i = startRow; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!Array.isArray(row)) continue;

                    const rawDni = row[dniCol];
                    if (!rawDni) continue;

                    const dniClean = String(rawDni).replace(/\D/g, '').trim();
                    if (!dniClean || dniClean.length < 5) continue;

                    const rawName = nameCol !== -1 ? row[nameCol] : '';
                    const rawMin = minCol !== -1 ? row[minCol] : '';
                    const rawMax = maxCol !== -1 ? row[maxCol] : '';

                    const minNum = rawMin ? parseFloat(String(rawMin).replace(/\./g, '').replace(/,/g, '.')) : 50000;
                    const maxNum = rawMax ? parseFloat(String(rawMax).replace(/\./g, '').replace(/,/g, '.')) : 2000000;

                    parsedClients.push({
                        dni: dniClean,
                        fullName: rawName ? String(rawName).trim() : 'CLIENTE',
                        minAmount: !isNaN(minNum) && minNum >= 0 ? minNum : 50000,
                        maxAmount: !isNaN(maxNum) && maxNum >= 0 ? maxNum : 2000000
                    });
                }

                // Deduplicate parsed clients by DNI (keeps the last entry for each DNI)
                const clientsMap = new Map<string, ExcelClientPreview>();
                for (const client of parsedClients) {
                    clientsMap.set(client.dni, client);
                }
                const uniqueClientsList = Array.from(clientsMap.values());

                if (uniqueClientsList.length === 0) {
                    alert("No se encontraron registros de clientes válidos en el archivo (se requiere una columna DNI).");
                    return;
                }

                setExcelPreview(uniqueClientsList);
                setShowExcelModal(true);
            } catch (err: any) {
                console.error(err);
                alert("Error al procesar el archivo Excel: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    const handleConfirmExcelImport = async () => {
        if (excelPreview.length === 0) return;
        setImportingExcel(true);
        try {
            const res = await fetch('/api/admin/clients/bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clients: excelPreview })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert(`¡Éxito! Se importaron/actualizaron ${data.count} clientes correctamente.`);
                setShowExcelModal(false);
                setExcelPreview([]);
                setExcelFileName('');
                fetchClients();
            } else {
                alert("Error al importar clientes: " + (data.error || 'Ocurrió un error inesperado'));
            }
        } catch (err: any) {
            console.error(err);
            alert("Error de conexión al guardar clientes: " + err.message);
        } finally {
            setImportingExcel(false);
        }
    };

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
            {/* HEADER WITH ACTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-black text-white tracking-tighter">
                    Base de Datos <span className="text-dh-gold">Clientes</span>
                </h1>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-dh-gold text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-yellow-500 transition-all shadow-lg shadow-dh-gold/20 active:scale-95 cursor-pointer"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Cargar desde Excel (.xlsx / .csv)
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) processExcelFile(file);
                            e.target.value = '';
                        }}
                    />

                    <button
                        onClick={() => setShowBulkEdit(!showBulkEdit)}
                        className="text-xs text-dh-gold hover:underline flex items-center gap-1"
                    >
                        {showBulkEdit ? 'Cancelar Edición Masiva' : 'Habilitar Edición Masiva'}
                    </button>
                </div>
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

            {/* ADD INDIVIDUAL FORM */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-md">
                <h2 className="flex items-center gap-2 text-xl font-bold text-white mb-4">
                    <UserPlus className="text-dh-gold" />
                    Cargar Nuevo Cliente (Individual)
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

            {/* EXCEL IMPORT PREVIEW MODAL */}
            {showExcelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-dh-dark border border-dh-gold/30 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* MODAL HEADER */}
                        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-dh-gold/10 rounded-xl border border-dh-gold/30">
                                    <FileSpreadsheet className="w-6 h-6 text-dh-gold" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Vista Previa de Carga Masiva</h3>
                                    <p className="text-xs text-gray-400 font-mono mt-0.5">Archivo: {excelFileName}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowExcelModal(false)}
                                className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* MODAL SUMMARY STATS */}
                        <div className="p-6 bg-dh-gold/5 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-dh-gold font-bold text-sm">
                                <CheckCircle2 className="w-5 h-5 text-dh-gold" />
                                <span>{excelPreview.length} clientes listos para importar</span>
                            </div>
                            <p className="text-xs text-gray-400">Se crearán nuevos registros o actualizarán los existentes por DNI.</p>
                        </div>

                        {/* MODAL TABLE PREVIEW */}
                        <div className="flex-1 overflow-auto p-6">
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-3">Muestra de datos (primeras filas):</p>
                            <div className="rounded-xl border border-white/10 overflow-hidden bg-black/30">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-black/60 text-gray-400 uppercase tracking-wider border-b border-white/10">
                                            <th className="p-3">DNI</th>
                                            <th className="p-3">Nombre Completo</th>
                                            <th className="p-3">Mínimo ($)</th>
                                            <th className="p-3">Máximo ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-gray-300 font-mono">
                                        {excelPreview.slice(0, 8).map((c, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="p-3 font-bold text-white">{c.dni}</td>
                                                <td className="p-3 font-sans text-gray-200">{c.fullName}</td>
                                                <td className="p-3 text-red-400">${c.minAmount.toLocaleString("es-AR")}</td>
                                                <td className="p-3 text-dh-gold font-bold">${c.maxAmount.toLocaleString("es-AR")}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {excelPreview.length > 8 && (
                                <p className="text-center text-xs text-gray-500 mt-3 font-mono">... y {excelPreview.length - 8} clientes más</p>
                            )}
                        </div>

                        {/* MODAL FOOTER */}
                        <div className="p-6 border-t border-white/10 bg-black/40 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setShowExcelModal(false)}
                                className="px-5 py-2.5 rounded-xl border border-white/10 text-gray-300 font-bold text-sm hover:bg-white/5 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmExcelImport}
                                disabled={importingExcel}
                                className="bg-dh-gold text-black font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm hover:bg-yellow-500 transition-all shadow-lg shadow-dh-gold/20 disabled:opacity-50"
                            >
                                {importingExcel ? (
                                    <>Importando...</>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Confirmar e Importar {excelPreview.length} Clientes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
        setCurrentValue(formatted);
    };

    if (isEditing) {
        if (type === 'currency') {
            return (
                <input
                    ref={inputRef}
                    type="text"
                    value={String(currentValue).includes('.') ? currentValue : Number(currentValue).toLocaleString('es-AR')}
                    onChange={handleFormatChange}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    className="bg-black border border-dh-gold rounded p-1 w-full text-white outline-none min-w-[100px]"
                />
            );
        }
        return (
            <input
                ref={inputRef}
                type="text"
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
