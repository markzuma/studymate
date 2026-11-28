# PERIAK Google Sign-In

Google OAuth is configured through Supabase.
Production and localhost authorization redirects passed.

The Google interface is disabled by default.

Frontend activation flag:
VITE_GOOGLE_SIGN_IN_ENABLED=true

The frontend flag is not a security boundary.
The backend Google provider remains disabled.

Existing email and username authentication,
session persistence and profile management are retained.

Pending approved activation:
- Resolve legacy account-linking security.
- Test complete Google registration and login.
- Verify profile creation and administrator MFA.
- Enable the backend provider and frontend flag.
- Perform production regression testing.

SMTP configuration and Google referral integration
are deferred.

Google credentials must remain in Supabase,
never in frontend source code.
