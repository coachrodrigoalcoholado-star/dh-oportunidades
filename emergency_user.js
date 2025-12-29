const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createEmergencyUser() {
    const email = 'soporte_emergencia@dh.com';
    const password = 'Dh123456';

    console.log(`Creating emergency user ${email}...`);

    // 1. Check if exists and delete to ensure clean slate
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData.users.find(u => u.email === email);
    if (existing) {
        console.log('User exists, deleting to reset...');
        await supabase.auth.admin.deleteUser(existing.id);
    }

    // 2. Create fresh
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: 'admin' }
    });

    if (error) {
        console.error('Error creating user:', error);
        return;
    }

    // 3. Ensure profile exists
    if (data.user) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: data.user.id,
                email: email,
                role: 'admin',
                full_name: 'Soporte Emergencia'
            });

        if (profileError) console.log('Profile warning:', profileError.message);
        else console.log('Profile created.');
    }

    console.log('SUCCESS! User created.');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
}

createEmergencyUser();
