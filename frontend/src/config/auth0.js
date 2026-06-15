export const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN
export const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID

export function getAuth0CallbackUrl() {
  if (import.meta.env.VITE_AUTH0_CALLBACK_URL) {
    return import.meta.env.VITE_AUTH0_CALLBACK_URL
  }

  return `${window.location.origin}/admin/login`
}

export function getAuth0Config() {
  return {
    domain: auth0Domain,
    clientId: auth0ClientId,
    authorizationParams: {
      redirect_uri: getAuth0CallbackUrl(),
    },
    cacheLocation: 'localstorage',
    useRefreshTokens: true,
  }
}

export const auth0DashboardSettings = {
  callbackUrls: [
    'http://localhost:3000/admin/login',
    'http://localhost:3000',
  ],
  logoutUrls: ['http://localhost:3000/admin/login'],
  webOrigins: ['http://localhost:3000'],
  applicationType: 'Single Page Application',
  tokenEndpointAuthMethod: 'None',
}

// Auth0 connection names (Authentication > Social in Auth0 Dashboard)
export const auth0Connections = {
  github: import.meta.env.VITE_AUTH0_GITHUB_CONNECTION || 'github',
  google: import.meta.env.VITE_AUTH0_GOOGLE_CONNECTION || 'google-oauth2',
}
