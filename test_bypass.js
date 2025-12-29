const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://btasixrpjniqqwiyzllv.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0YXNpeHJwam5pcXF3aXl6bGx2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5MzYyOCwiZXhwIjoyMDgyMTY5NjI4fQ.ih5X_UWH_VnmIPIkpR88tD26zXwMNxovKDCsJUTdOd8';

// Client initialized with Service Role
const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testBypass() {
    console.log('--- TEST 1: Service Role as User ---');
    // Try to get user details using the Service Role Key passed as Authorization header implicitly?
    // Actually, createClient(url, key) sets the header.
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
        console.log('Service Role getUser failed:', userError.message);
    } else {
        console.log('Service Role getUser SUCCESS!');
        console.log('User ID:', userData.user.id);
        console.log('Role:', userData.user.role);
    }

    console.log('\n--- TEST 2: PKCE Code Exchange ---');
    const email = 'soporte_emergencia@dh.com';
    // Generate link again
    const { data: linkData } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: email
    });

    if (linkData && linkData.properties.action_link) {
        const token = linkData.properties.action_link.match(/token=([^&]+)/)[1];
        console.log('Extracted Token:', token.substring(0, 10) + '...');

        // Try exchangeCodeForSession
        const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(token);

        if (sessionError) {
            console.log('Exchange Code Failed:', sessionError.message);

            // Fallback: Try verifyOtp again but ensure it captures the hash/token logic? 
            // Actually previous error was 'otp_expired'. 
        } else {
            console.log('Exchange Code SUCCESS!');
            console.log('Access Token:', sessionData.session.access_token.substring(0, 20) + '...');
        }
    } else {
        console.log('Could not generate link for Test 2');
    }
}

testBypass();
