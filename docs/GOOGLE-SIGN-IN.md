# PERIAK Google Sign-In

Google OAuth uses Supabase Authentication.

Google Sign-In is enabled by default.
Set VITE_GOOGLE_SIGN_IN_ENABLED=false to hide the interface.

The frontend flag is not a security boundary.
The Supabase provider must be disabled separately if required.

Production:
https://periakedu.vercel.app/

The Google button is available on the public website and
authentication screens, except referral registration and password recovery.

Existing email and username authentication remain available.

Authorization redirects were previously verified.
Complete Google registration and login still require live testing.

Legacy email ownership and account-linking hardening are
deferred at the owner's direction.

Google credentials remain in Supabase.
