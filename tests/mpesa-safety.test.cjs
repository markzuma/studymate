const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const premium = read('src/components/PremiumPage.jsx');
const stk = read('supabase/functions/mpesa-stk-push/index.ts');
const callback = read('supabase/functions/mpesa-callback/index.ts');
const reconcile = read('supabase/functions/mpesa-reconcile/index.ts');
const replay = read('supabase/functions/mpesa-replay/index.ts');
const activation = read(
  'supabase/migrations/20261114113000_atomic_mpesa_activation.sql'
);
const recovery = read(
  'supabase/migrations/20261123180000_mpesa_recovery_objects.sql'
);

test('student-facing automatic STK remains disabled', () => {
  assert.match(
    premium,
    /const MPESA_STK_ENABLED = false/
  );
});

test('STK endpoint has an administrator gate', () => {
  assert.match(stk, /PERIAK ADMIN-ONLY SANDBOX GATE V1/);
  assert.match(stk, /callerProfile\.role !== "admin"/);
  assert.match(stk, /403/);
});

test('checkout reservation uses server-side pricing', () => {
  assert.match(stk, /reserve_mpesa_payment/);
  assert.match(stk, /subscription_plans/);
  assert.match(stk, /price_kes/);
});

test('callback inbox precedes payment lookup', () => {
  const save = callback.indexOf(
    '.from("mpesa_callback_inbox")'
  );
  const lookup = callback.indexOf('.from("payments")');

  assert.ok(save >= 0);
  assert.ok(lookup >= 0);
  assert.ok(save < lookup);
});

test('callback requires a configured secret token', () => {
  assert.match(callback, /MPESA_CALLBACK_TOKEN/);
  assert.match(callback, /suppliedToken !== configuredToken/);
});

test('payment completion uses a database transaction', () => {
  assert.match(activation, /FOR UPDATE/i);
  assert.match(activation, /already_completed/);
  assert.match(activation, /status = 'completed'/);
  assert.match(activation, /status = 'active'/);
});

test('reconciliation has persistent cooldown and auditing', () => {
  assert.match(reconcile, /claim_mpesa_reconciliation/);
  assert.match(reconcile, /mpesa_reconciliation_attempts/);
  assert.match(recovery, /interval '5 minutes'/);
});

test('success evidence does not activate directly in reconciliation', () => {
  assert.match(
    reconcile,
    /callback_fields_match_unverified/
  );
  assert.match(
    reconcile,
    /Independent transaction verification/
  );
  assert.doesNotMatch(
    reconcile,
    /rpc\(["']complete_mpesa_payment["']/
  );
});

test('admin callback recovery checks authentication', () => {
  assert.match(replay, /auth\.getUser/);
  assert.match(replay, /rpc\("is_admin"\)/);
  assert.match(replay, /claim_mpesa_reconciliation/);
});

test('failure resolution requires provider evidence', () => {
  assert.match(
    recovery,
    /provider_reports_unsuccessful/
  );
  assert.match(
    recovery,
    /v_http IS DISTINCT FROM 200/
  );
  assert.match(
    recovery,
    /Conflicting callback evidence requires review/
  );
});

test('recovery infrastructure denies direct student access', () => {
  assert.match(
    recovery,
    /REVOKE ALL ON public\.mpesa_callback_inbox/
  );
  assert.match(
    recovery,
    /REVOKE ALL ON public\.mpesa_reconciliation_attempts/
  );
  assert.match(
    recovery,
    /TO service_role/
  );
});
