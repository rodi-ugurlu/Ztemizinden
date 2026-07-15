import { readFile } from 'node:fs/promises';

const keycloakBaseUrl = (process.env.KEYCLOAK_ADMIN_BASE_URL || 'http://localhost:8081').replace(/\/+$/, '');
const backendBaseUrl = (process.env.BACKEND_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '');
const realm = process.env.KEYCLOAK_REALM || 'ztemizinden';
const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || (isLocal(keycloakBaseUrl) ? 'admin' : '');
const demoPassword = process.env.KEYCLOAK_DEMO_PASSWORD || 'Demo123!';
const realmPath = new URL('../Ztemizinden-Backend/docker/keycloak/realm-export.json', import.meta.url);
const realmDefinition = JSON.parse(await readFile(realmPath, 'utf8'));
const expectedProvisioningRoles =
  realmDefinition.users?.find(
    (user) => user.serviceAccountClientId === 'ztemizinden-backend-admin'
  )?.clientRoles?.['realm-management'] || [];

if (!adminPassword) throw new Error('KEYCLOAK_ADMIN_PASSWORD is required.');
if (!expectedProvisioningRoles.length) {
  throw new Error('The realm definition must declare realm-management roles for the backend service account.');
}

const adminToken = await passwordToken('master', 'admin-cli', adminUsername, adminPassword);
const webClients = await adminRequest(
  `/admin/realms/${encodeURIComponent(realm)}/clients?clientId=ztemizinden-web`
);
const webClient = webClients[0];
if (!webClient) throw new Error('ztemizinden-web client was not found.');

const directAccessGrantsEnabled = Boolean(webClient.directAccessGrantsEnabled);
assert(webClient.publicClient === true, 'Web client must be public.');
assert(webClient.standardFlowEnabled === true, 'Authorization Code flow must be enabled.');
assert(webClient.implicitFlowEnabled === false, 'Implicit flow must be disabled.');
assert(
  directAccessGrantsEnabled === true,
  'Direct access grants must be enabled for the Maintly custom login forms.'
);
assert(webClient.attributes?.['pkce.code.challenge.method'] === 'S256', 'PKCE S256 must be required.');
const checks = [];
for (const identity of [
  { email: 'customer@demo.com', role: 'CUSTOMER', endpoint: '/api/customers/me' },
  { email: 'service@demo.com', role: 'SERVICE', endpoint: '/api/providers/me' },
  { email: 'admin@demo.com', role: 'ADMIN', endpoint: '/api/providers' },
]) {
  const token = await passwordToken(realm, 'ztemizinden-web', identity.email, demoPassword);
  const claims = decodeClaims(token);
  assert(claims.iss === `${keycloakBaseUrl}/realms/${realm}`, `${identity.email}: issuer mismatch`);
  assert(audiences(claims.aud).includes('ztemizinden-api'), `${identity.email}: API audience missing`);
  assert(claims.realm_access?.roles?.includes(identity.role), `${identity.email}: role missing`);
  const response = await fetch(`${backendBaseUrl}${identity.endpoint}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  assert(response.status === 200, `${identity.email}: backend returned ${response.status}`);
  checks.push({ identity: identity.email, role: identity.role, backendStatus: response.status });
}

const withoutToken = await fetch(`${backendBaseUrl}/api/providers`);
assert(withoutToken.status === 401, `Unauthenticated API request returned ${withoutToken.status}`);

const provisioningToken = await clientCredentialsToken(
  realm,
  'ztemizinden-backend-admin',
  process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || 'ztemizinden-local-admin-secret-change-me'
);
const provisioningAccess = await fetch(
  `${keycloakBaseUrl}/admin/realms/${encodeURIComponent(realm)}/users?max=1`,
  { headers: { authorization: `Bearer ${provisioningToken}` } }
);
assert(
  provisioningAccess.status === 200,
  `Provisioning service account returned ${provisioningAccess.status}`
);
const provisioningRoleAccess = await fetch(
  `${keycloakBaseUrl}/admin/realms/${encodeURIComponent(realm)}/roles/SERVICE`,
  { headers: { authorization: `Bearer ${provisioningToken}` } }
);
assert(
  provisioningRoleAccess.status === 200,
  `Provisioning service account could not read realm roles (${provisioningRoleAccess.status})`
);
const backendAdminClients = await adminRequest(
  `/admin/realms/${encodeURIComponent(realm)}/clients?clientId=ztemizinden-backend-admin`
);
const realmManagementClients = await adminRequest(
  `/admin/realms/${encodeURIComponent(realm)}/clients?clientId=realm-management`
);
assert(backendAdminClients[0], 'ztemizinden-backend-admin client was not found.');
assert(realmManagementClients[0], 'realm-management client was not found.');
const serviceAccount = await adminRequest(
  `/admin/realms/${encodeURIComponent(realm)}/clients/${encodeURIComponent(backendAdminClients[0].id)}/service-account-user`
);
const provisioningRoleMappings = await adminRequest(
  `/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(serviceAccount.id)}` +
    `/role-mappings/clients/${encodeURIComponent(realmManagementClients[0].id)}`
);
const provisioningRoleNames = provisioningRoleMappings.map((role) => role.name).sort();
assert(
  provisioningRoleNames.join(',') === [...expectedProvisioningRoles].sort().join(','),
  `Provisioning service account roles differ from the allowlist: ${provisioningRoleNames.join(', ')}`
);
const wrongAudience = await fetch(`${backendBaseUrl}/api/providers`, {
  headers: { authorization: `Bearer ${provisioningToken}` },
});
assert(wrongAudience.status === 401, `Wrong-audience token returned ${wrongAudience.status}`);

console.log(JSON.stringify({
  issuer: `${keycloakBaseUrl}/realms/${realm}`,
  audience: 'ztemizinden-api',
  checks,
  unauthenticatedStatus: withoutToken.status,
  provisioningAdminStatus: provisioningAccess.status,
  provisioningRoleStatus: provisioningRoleAccess.status,
  provisioningRoles: provisioningRoleNames,
  wrongAudienceStatus: wrongAudience.status,
  pkce: 'S256',
  directAccessGrantsEnabled,
}));

async function passwordToken(tokenRealm, clientId, username, password) {
  return token(tokenRealm, {
    grant_type: 'password',
    client_id: clientId,
    username,
    password,
    scope: 'openid',
  });
}

async function clientCredentialsToken(tokenRealm, clientId, clientSecret) {
  return token(tokenRealm, {
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });
}

async function token(tokenRealm, values) {
  const response = await fetch(
    `${keycloakBaseUrl}/realms/${encodeURIComponent(tokenRealm)}/protocol/openid-connect/token`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values),
    }
  );
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(`Token request for ${values.username || values.client_id} failed: ${payload.error}`);
  }
  return (await response.json()).access_token;
}

async function adminRequest(path, options = {}) {
  const response = await fetch(`${keycloakBaseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      authorization: `Bearer ${adminToken}`,
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (!response.ok) {
    throw new Error(`Keycloak admin request failed (${response.status}): ${await response.text()}`);
  }
  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function decodeClaims(tokenValue) {
  return JSON.parse(Buffer.from(tokenValue.split('.')[1], 'base64url').toString('utf8'));
}

function audiences(audience) {
  if (Array.isArray(audience)) return audience;
  return audience ? [audience] : [];
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function isLocal(url) {
  const hostname = new URL(url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
