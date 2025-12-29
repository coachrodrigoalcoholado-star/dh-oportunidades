
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function resetSuperAdmin() {
    const email = 'dhoportunidades@gmail.com';
    const password = 'Dh123456';

    console.log(`Resetting password for ${email}...`);

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('User not found!');
        return;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: password, mobile_confirm: true, email_confirm: true }
    );

    if (updateError) {
        console.error('Error:', updateError);
    } else {
        console.log('SUCCESS: Password reset to Dh123456');
    }
}

resetSuperAdmin();
