import Keycloak from 'keycloak-js';

const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL?.trim() || 'http://localhost:8081';
const keycloakRealm = import.meta.env.VITE_KEYCLOAK_REALM?.trim() || 'ztemizinden';
const keycloakClientId =
  import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() || 'ztemizinden-web';

export const keycloak = new Keycloak({
  url: keycloakUrl.replace(/\/+$/, ''),
  realm: keycloakRealm,
  clientId: keycloakClientId,
});
