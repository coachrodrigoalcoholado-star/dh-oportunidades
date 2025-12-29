const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
// Using the Service Role Key to have Admin privileges
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function generateLink() {
    const email = 'dhoportunidades@gmail.com'; // Trying the main one first

    console.log(`Generating Magic Link for ${email}...`);

    const { data, error } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: 'http://localhost:3001/admin/users' // Direct to users page
        }
    });

    if (error) {
        console.error('Error generating link:', error);
    } else {
        console.log('SUCCESS! Here is your Magic Link:');
        console.log('---------------------------------------------------');
        console.log(data.properties.action_link);
        console.log('---------------------------------------------------');
    }
}

generateLink();
