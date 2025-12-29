const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function bootstrap() {
    const email = 'admin_temp@gmail.com';
    const password = 'Dh123456';

    console.log(`Checking user ${email}...`);

    // List users to see if it exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
        console.error('Error listing users:', listError);
        return;
    }

    const existingUser = users.find(u => u.email === email);

    if (existingUser) {
        console.log('User exists. Updating password...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            { password: password, user_metadata: { role: 'admin' }, email_confirm: true }
        );
        if (updateError) console.error('Error updating:', updateError);
        else console.log('Password updated successfully.');

        // Upsert profile
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: existingUser.id,
                email: email,
                role: 'admin',
                full_name: 'Admin Principal'
            });
        if (profileError) console.log('Profile update warning:', profileError.message);
        else console.log('Profile synced.');

    } else {
        console.log('User does not exist. Creating...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { role: 'admin' }
        });
        if (createError) console.error('Error creating:', createError);
        else console.log('User created successfully.');

        // Also create profile if needed
        if (data.user) {
            const { error: profileError } = await supabase
                .from('profiles')
                .upsert({
                    id: data.user.id,
                    email: email,
                    role: 'admin',
                    full_name: 'Admin Principal'
                })
            if (profileError) console.log('Profile error (ignorable if table missing):', profileError.message);
            else console.log('Profile created.');
        }
    }
}

bootstrap();
