const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
const serviceRoleKey = "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8";

try {
    let content = '';

    // Try reading as if it's UTF-8 first
    try {
        content = fs.readFileSync(envPath, 'utf8');
    } catch (e) {
        console.log('Error reading utf8, checking file existence:', e.message);
    }

    // Heuristic check for UTF-16 LE (common with PowerShell > redirection)
    // If it contains null bytes, it's likely weird encoding
    if (content.includes('\u0000')) {
        console.log('Detected Null Bytes (UTF-16?), re-reading as utf16le');
        content = fs.readFileSync(envPath, 'utf16le');
    }

    console.log('Current Content Length:', content.length);

    // Clean up content: remove existing key if present to avoid dupes/conflicts
    const lines = content.split(/\r?\n/).filter(line =>
        line.trim() !== '' && !line.startsWith('SUPABASE_SERVICE_ROLE_KEY')
    );

    // Add key
    lines.push(serviceRoleKey);

    // Write back as standard UTF-8
    fs.writeFileSync(envPath, lines.join('\n'), 'utf8');
    console.log('Successfully rewrote .env.local with UTF-8 encoding.');

} catch (error) {
    console.error('Failed to fix env file:', error);
}
