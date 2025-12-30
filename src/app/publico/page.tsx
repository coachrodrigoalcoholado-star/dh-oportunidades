import Simulator from "@/components/Simulator";

export default function PublicSimulatorPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-dh-dark text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-dh-gold/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md z-10 flex flex-col items-center">
                <div className="mb-6 text-center">
                    <img src="/logo-new.png" alt="DH Oportunidades" className="h-16 object-contain mb-4 mx-auto" />
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Simulador de Préstamos
                    </h1>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mt-2">
                        Herramienta de Autogestión
                    </p>
                </div>

                {/* Forced Mode = 'loans' (No Tabs, No Footwear) */}
                <Simulator forcedMode="loans" />

                <p className="text-[10px] text-gray-600 mt-8 max-w-xs text-center">
                    Los valores son estimativos y están sujetos a aprobación crediticia.
                </p>
            </div>
        </div>
    );
}
