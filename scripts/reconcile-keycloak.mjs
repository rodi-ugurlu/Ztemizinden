import { readFile } from 'node:fs/promises';

const baseUrl = (process.env.KEYCLOAK_ADMIN_BASE_URL || 'http://localhost:8081').replace(/\/+$/, '');
const adminRealm = process.env.KEYCLOAK_ADMIN_REALM || 'master';
const adminUsername = process.env.KEYCLOAK_ADMIN_USERNAME || 'admin';
const adminPassword = process.env.KEYCLOAK_ADMIN_PASSWORD || (isLocal(baseUrl) ? 'admin' : '');
const importDemoUsers = process.env.KEYCLOAK_IMPORT_DEMO_USERS === 'true';
const localBackendClientSecret = 'ztemizinden-local-admin-secret-change-me';
const webBaseUrl = (
  process.env.KEYCLOAK_WEB_URL || (isLocal(baseUrl) ? 'http://localhost:5173' : '')
).trim().replace(/\/+$/, '');

if (!adminPassword) {
  throw new Error('KEYCLOAK_ADMIN_PASSWORD is required for a non-local Keycloak server.');
}

const realmPath = new URL('../Ztemizinden-Backend/docker/keycloak/realm-export.json', import.meta.url);
const realmDefinition = JSON.parse(await readFile(realmPath, 'utf8'));
const realm = process.env.KEYCLOAK_REALM || realmDefinition.realm;
const realmBackendClientSecret = realmDefinition.clients.find(
  (client) => client.clientId === 'ztemizinden-backend-admin'
)?.secret;
const backendClientSecret =
  process.env.KEYCLOAK_ADMIN_CLIENT_SECRET?.trim() ||
  (isLocal(baseUrl) ? localBackendClientSecret : realmBackendClientSecret);

if (!backendClientSecret || /^\$\{.+\}$/.test(backendClientSecret)) {
  throw new Error('KEYCLOAK_ADMIN_CLIENT_SECRET must be provided with a concrete value.');
}

const tokenResponse = await fetch(
  `${baseUrl}/realms/${encodeURIComponent(adminRealm)}/protocol/openid-connect/token`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: adminUsername,
      password: adminPassword,
    }),
  }
);
if (!tokenResponse.ok) {
  throw new Error(`Keycloak admin login failed with status ${tokenResponse.status}.`);
}
const { access_token: accessToken } = await tokenResponse.json();

const currentRealm = await keycloak(`/admin/realms/${encodeURIComponent(realm)}`);
const realmSettings = { ...realmDefinition };
delete realmSettings.clients;
delete realmSettings.users;
delete realmSettings.roles;
await keycloak(`/admin/realms/${encodeURIComponent(realm)}`, {
  method: 'PUT',
  body: { ...currentRealm, ...realmSettings, realm },
});

for (const role of realmDefinition.roles?.realm || []) {
  const rolePath = `/admin/realms/${encodeURIComponent(realm)}/roles/${encodeURIComponent(role.name)}`;
  const existingRole = await keycloak(rolePath, { allowNotFound: true });
  await keycloak(existingRole ? rolePath : `/admin/realms/${encodeURIComponent(realm)}/roles`, {
    method: existingRole ? 'PUT' : 'POST',
    body: existingRole ? { ...existingRole, ...role } : role,
  });
}

for (const client of realmDefinition.clients || []) {
  const desired = { ...client };
  if (desired.clientId === 'ztemizinden-web' && webBaseUrl) {
    desired.redirectUris = [`${webBaseUrl}/*`];
    desired.webOrigins = [webBaseUrl];
    desired.attributes = {
      ...desired.attributes,
      'post.logout.redirect.uris': `${webBaseUrl}/*`,
    };
  }
  if (desired.clientId === 'ztemizinden-backend-admin') {
    desired.secret = backendClientSecret;
  }
  const matches = await keycloak(
    `/admin/realms/${encodeURIComponent(realm)}/clients?clientId=${encodeURIComponent(desired.clientId)}`
  );
  const existing = matches[0];
  await keycloak(
    existing
      ? `/admin/realms/${encodeURIComponent(realm)}/clients/${encodeURIComponent(existing.id)}`
      : `/admin/realms/${encodeURIComponent(realm)}/clients`,
    {
      method: existing ? 'PUT' : 'POST',
      body: existing ? { ...existing, ...desired, id: existing.id } : desired,
    }
  );
}

await assignServiceAccountRoles();

if (importDemoUsers) {
  for (const user of (realmDefinition.users || []).filter((entry) => !entry.serviceAccountClientId)) {
    await upsertDemoUser(user);
  }
}

console.log(
  JSON.stringify({
    realm,
    clients: realmDefinition.clients.length,
    roles: realmDefinition.roles.realm.length,
    demoUsersReconciled: importDemoUsers,
    webUrl: webBaseUrl || 'local realm defaults',
  })
);

async function assignServiceAccountRoles() {
  const backendClient = await clientByClientId('ztemizinden-backend-admin');
  const realmManagementClient = await clientByClientId('realm-management');
  const serviceAccount = await keycloak(
    `/admin/realms/${encodeURIComponent(realm)}/clients/${encodeURIComponent(backendClient.id)}/service-account-user`
  );
  const roles = [];
  for (const roleName of ['manage-users', 'query-users', 'view-users']) {
    roles.push(
      await keycloak(
        `/admin/realms/${encodeURIComponent(realm)}/clients/${encodeURIComponent(realmManagementClient.id)}/roles/${encodeURIComponent(roleName)}`
      )
    );
  }
  await keycloak(
    `/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(serviceAccount.id)}/role-mappings/clients/${encodeURIComponent(realmManagementClient.id)}`,
    { method: 'POST', body: roles }
  );
}

async function upsertDemoUser(userDefinition) {
  const username = userDefinition.username.toLowerCase();
  const matches = await keycloak(
    `/admin/realms/${encodeURIComponent(realm)}/users?username=${encodeURIComponent(username)}&exact=true`
  );
  let userId = matches[0]?.id;
  const desired = { ...userDefinition, username, attributes: userDefinition.attributes || {} };
  const credentials = desired.credentials || [];
  const realmRoles = desired.realmRoles || [];
  delete desired.id;
  delete desired.credentials;
  delete desired.realmRoles;

  if (userId) {
    await keycloak(`/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: { ...matches[0], ...desired, id: userId },
    });
  } else {
    const response = await keycloak(`/admin/realms/${encodeURIComponent(realm)}/users`, {
      method: 'POST',
      body: { ...desired, credentials },
      returnResponse: true,
    });
    userId = response.headers.get('location')?.split('/').pop();
  }
  if (!userId) throw new Error(`Keycloak did not return an id for ${username}.`);

  for (const credential of credentials) {
    await keycloak(
      `/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/reset-password`,
      { method: 'PUT', body: credential }
    );
  }
  const roleRepresentations = [];
  for (const roleName of realmRoles) {
    roleRepresentations.push(
      await keycloak(
        `/admin/realms/${encodeURIComponent(realm)}/roles/${encodeURIComponent(roleName)}`
      )
    );
  }
  const currentRealmRoles = await keycloak(
    `/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/role-mappings/realm`
  );
  const obsoleteRoles = currentRealmRoles.filter(
    (role) => ['CUSTOMER', 'SERVICE', 'ADMIN'].includes(role.name) && !realmRoles.includes(role.name)
  );
  if (obsoleteRoles.length) {
    await keycloak(
      `/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/role-mappings/realm`,
      { method: 'DELETE', body: obsoleteRoles }
    );
  }
  if (roleRepresentations.length) {
    await keycloak(
      `/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/role-mappings/realm`,
      { method: 'POST', body: roleRepresentations }
    );
  }
}

async function clientByClientId(clientId) {
  const matches = await keycloak(
    `/admin/realms/${encodeURIComponent(realm)}/clients?clientId=${encodeURIComponent(clientId)}`
  );
  if (!matches[0]) throw new Error(`Keycloak client ${clientId} was not found.`);
  return matches[0];
}

async function keycloak(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (options.allowNotFound && response.status === 404) return null;
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Keycloak ${options.method || 'GET'} ${path} failed (${response.status}): ${detail}`);
  }
  if (options.returnResponse) return response;
  if (response.status === 204 || response.headers.get('content-length') === '0') return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function isLocal(url) {
  const hostname = new URL(url).hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}
