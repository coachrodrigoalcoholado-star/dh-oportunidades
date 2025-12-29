
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createNewAdmin() {
    const email = 'admin_emergencia@dh.com'; // New unique email to bypass rate limit
    const password = 'Dh123456';

    console.log(`Creating emergency admin: ${email}...`);

    // Clean up if exists
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log('User exists, deleting...');
        await supabase.auth.admin.deleteUser(existing.id);
    }

    // Create new
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

    const userId = data.user.id;
    console.log(`User created (ID: ${userId}). Syncing profile...`);

    // Sync profile
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: email,
            role: 'admin',
            full_name: 'Admin Emergencia'
        });

    if (profileError) console.error('Profile sync error:', profileError);
    else console.log('Profile synced successfully.');
}

createNewAdmin();
