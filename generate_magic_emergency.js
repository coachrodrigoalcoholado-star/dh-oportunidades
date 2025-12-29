const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function generateLink() {
    const email = 'soporte_emergencia@dh.com';

    // console.log(`Generating Magic Link for ${email}...`);

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email,
        options: {
            redirectTo: 'http://localhost:3001/login' // Direct to login to catch hash
        }
    });

    if (error) {
        console.error('Error:', error);
    } else {
        const fs = require('fs');
        fs.writeFileSync('magic_link.txt', data.properties.action_link);
        console.log('Link written to magic_link.txt');
    }
}

generateLink();
