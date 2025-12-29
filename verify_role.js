
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkRole() {
    const email = 'dhoportunidades@gmail.com';
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

    const user = users.find(u => u.email === email);
    if (!user) {
        console.log('User not found');
        return;
    }

    console.log('User Found:', user.id);

    // Check profiles table (or wherever role is stored)
    // Assuming 'profiles' table with 'id' and 'role' or 'is_admin'

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
        console.error('Error fetching profile:', profileError);
    } else {
        console.log('Profile Data:', profile);
    }
}

checkRole();
