const fs = require('fs');
const path = require('path');

// 1. Cargar variables de entorno manualmente (puden usar dotenv si lo instalan)
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                process.env[key] = value;
            }
        });
    }
} catch (e) {
    console.log("⚠️ No se pudo leer .env.local");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: No se encontraron las credenciales de Supabase en .env.local');
    process.exit(1);
}

console.log(`📡 Conectando a Supabase...`);

// 2. Hacer una simple petición "Health Check"
// Consultamos la raíz de la API REST para generar actividad
fetch(`${SUPABASE_URL}/rest/v1/`, {
    method: 'GET',
    headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
    }
})
    .then(async (res) => {
        if (res.ok) {
            console.log(`✅ ¡Éxito! Supabase respondió correctamente (Status: ${res.status}).`);
            console.log(`🗓️ Fecha: ${new Date().toLocaleString()}`);
            console.log("Tu proyecto ha registrado actividad y no se pausará hoy.");
        } else {
            console.error(`⚠️ Alerta: Supabase respondió con error (Status: ${res.status}).`);
            const text = await res.text();
            console.error(text);
        }
    })
    .catch(err => {
        console.error('❌ Error de conexión:', err);
    });
