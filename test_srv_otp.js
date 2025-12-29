const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testServerSideOTP() {
    const email = 'soporte_emergencia@dh.com';
    console.log(`1. Generating link for ${email}...`);

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email
    });

    if (linkError) {
        console.error('Generate Link Failed:', linkError);
        return;
    }

    const { action_link } = linkData.properties;
    // Extract token from URL: ...verify?token=XYZ&...
    const tokenMatch = action_link.match(/token=([^&]+)/);
    if (!tokenMatch) {
        console.error('Could not parse token from link:', action_link);
        return;
    }

    const token = tokenMatch[1];
    console.log('2. Token extracted:', token.substring(0, 10) + '...');

    console.log('3. Verifying OTP server-side...');
    const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'magiclink'
    });

    if (verifyError) {
        console.error('Verify OTP Failed:', verifyError);
    } else {
        console.log('SUCCESS! Session obtained.');
        console.log('Access Token:', sessionData.session.access_token.substring(0, 20) + '...');
        console.log('RefreshToken:', sessionData.session.refresh_token.substring(0, 20) + '...');
    }
}

testServerSideOTP();
