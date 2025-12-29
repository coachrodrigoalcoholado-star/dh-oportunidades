const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const supabaseAnonKey = 'sb_publishable_xsMj-BxfpugKONNruVU1Pw_vd0nqYMr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLogin() {
    const email = 'dhoportunidades@gmail.com';
    const password = 'Dh123456';

    console.log(`Attempting login for ${email} with password ${password}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        console.error('Login FAILED:', error.message);
        if (error.message.includes('rate limit')) {
            console.log('NOTE: Still rate limited.');
        }
    } else {
        console.log('Login SUCCESS!');
        console.log('User ID:', data.user.id);
        console.log('Access Token:', data.session.access_token.substring(0, 20) + '...');
    }
}

checkLogin();
