import { createClient } from '@supabase/supabase-js';

const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3015';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const email = `offroady.reset.test+${Date.now()}@outlook.com`;
const password = 'TrailPass123!';
const newPassword = 'TrailPass456!';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers, redirect: 'manual' });
  const bodyText = await response.text();
  let body;
  try { body = JSON.parse(bodyText); } catch { body = bodyText; }
  return { response, body };
}

async function main() {
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const anon = createClient(supabaseUrl, anonKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const createUser = await request('/api/auth/signup', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Reset Test', email, password }),
  });
  console.log('signup', createUser.response.status, createUser.body);
  assert(createUser.response.ok, `signup failed: ${JSON.stringify(createUser.body)}`);

  const forgotPassword = await request('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  console.log('forgotPassword', forgotPassword.response.status, forgotPassword.body);
  assert(forgotPassword.response.ok, `forgot password failed: ${JSON.stringify(forgotPassword.body)}`);

  const recovery = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: `${baseUrl}/reset-password/confirm` },
  });
  assert(!recovery.error, `generateLink failed: ${recovery.error?.message}`);
  const actionLink = recovery.data.properties?.action_link;
  assert(actionLink, 'missing recovery action link');
  console.log('recoveryLink', actionLink);

  const confirmPage = await fetch(actionLink, { redirect: 'manual' });
  const redirectLocation = confirmPage.headers.get('location');
  console.log('confirmPage', confirmPage.status, redirectLocation);
  assert(confirmPage.status === 303 || confirmPage.status === 302 || confirmPage.status === 307, 'recovery link did not redirect');
  assert(redirectLocation, 'recovery redirect missing location');

  const redirectUrl = new URL(redirectLocation);
  const code = redirectUrl.searchParams.get('code');
  if (code) {
    const exchange = await anon.auth.exchangeCodeForSession(code);
    assert(!exchange.error, `exchangeCodeForSession failed: ${exchange.error?.message}`);
  } else {
    const hashParams = new URLSearchParams(redirectUrl.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const recoveryType = hashParams.get('type');
    assert(recoveryType === 'recovery', 'recovery redirect missing recovery type');
    assert(accessToken && refreshToken, 'recovery redirect missing tokens');
    const sessionResult = await anon.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    assert(!sessionResult.error, `setSession failed: ${sessionResult.error?.message}`);
  }

  const updatePassword = await anon.auth.updateUser({ password: newPassword });
  console.log('passwordUpdated', updatePassword.error?.message || true);
  assert(!updatePassword.error, `updateUser failed: ${updatePassword.error?.message}`);

  const relogin = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword }),
  });
  console.log('relogin', relogin.response.status, relogin.body);
  assert(relogin.response.ok, `relogin failed: ${JSON.stringify(relogin.body)}`);

  console.log(JSON.stringify({ ok: true, email }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
