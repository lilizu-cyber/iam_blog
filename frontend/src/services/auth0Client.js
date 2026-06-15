import { createAuth0Client } from '@auth0/auth0-spa-js'
import { auth0ClientId, auth0Domain, getAuth0Config } from '../config/auth0'

let auth0ClientPromise = null

export function validateAuth0Config() {
  if (!auth0Domain || !auth0ClientId) {
    throw new Error(
      'Auth0 is not configured. Add VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID to frontend/.env'
    )
  }
}

export function getAuth0Client() {
  validateAuth0Config()

  if (!auth0ClientPromise) {
    auth0ClientPromise = createAuth0Client(getAuth0Config())
  }

  return auth0ClientPromise
}

export function resetAuth0Client() {
  auth0ClientPromise = null
}
