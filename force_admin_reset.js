
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function checkAndResetAdmin() {
    const email = 'dhoportunidades@gmail.com';
    const password = 'Dh123456';

    console.log(`Checking user ${email}...`);

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User NOT FOUND. Creating it now...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });

        if (createError) {
            console.error('Error creating user:', createError);
        } else {
            console.log('User created successfully.');
            await syncProfile(data.user.id, email);
        }
        return;
    }

    console.log(`User found (ID: ${user.id}). Status: ${user.role}`);
    console.log(`Resetting password to: ${password}`);

    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: password, email_confirm: true, user_metadata: { role: 'admin' } }
    );

    if (updateError) {
        console.error('Error resetting password:', updateError);
    } else {
        console.log('Password reset successfully.');
        await syncProfile(user.id, email);
    }
}

async function syncProfile(id, email) {
    const { error } = await supabase
        .from('profiles')
        .upsert({
            id: id,
            email: email,
            role: 'admin',
            full_name: 'Super Admin'
        });

    if (error) console.log('Profile sync warning:', error.message);
    else console.log('Profile synced correctly.');
}

checkAndResetAdmin();
