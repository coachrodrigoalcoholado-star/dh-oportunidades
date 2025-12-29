const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

const content = `NEXT_PUBLIC_SUPABASE_URL=https://btasixrpjniqqwiyzllv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xsMj-BxfpugKONNruVU1Pw_vd0nqYMr
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8
`;

try {
    fs.writeFileSync(envPath, content, { encoding: 'utf8' });
    console.log('Successfully wrote .env.local with UTF-8 encoding.');
    console.log('Content preview:');
    console.log(content);
} catch (error) {
    console.error('Failed to write .env.local:', error);
}
