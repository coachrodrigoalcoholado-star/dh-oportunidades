const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

// Create a client with the SERVICE ROLE key
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testServiceRoleLogin() {
    console.log('Attempting login with Service Role client...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'soporte_emergencia@dh.com',
        password: 'Dh123456'
    });

    if (error) {
        console.error('Login Failed:', error.message);
    } else {
        console.log('Login SUCCESS!');
        console.log('Access Token:', data.session.access_token.substring(0, 20) + '...');
    }
}

testServiceRoleLogin();
