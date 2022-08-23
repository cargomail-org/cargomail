import { TAuthConfig } from './packages/react-oauth2-code-pkce/index'

export const authConfig: TAuthConfig = {
  clientId: process.env.REACT_APP_AUTH_CLIENT_ID || '',
  authorizationEndpoint: process.env.REACT_APP_AUTH_ENDPOINT || '',
  tokenEndpoint: process.env.REACT_APP_TOKEN_ENDPOINT || '',
  scope: process.env.REACT_APP_AUTH_SCOPE || '',
  redirectUri: process.env.REACT_APP_AUTH_REDIRECT_URI || '',
  logoutEndpoint: process.env.REACT_APP_LOGOUT_ENDPOINT || '',
  preLogin,
  postLogin,
  decodeToken: !(process.env.REACT_APP_DECODE_TOKEN === 'false'),
}

function preLogin() {
  localStorage.setItem('preLoginPath', `${window.location.pathname}${window.location.search}${window.location.hash}`)
}

function postLogin() {
  window.location.replace(localStorage.getItem('preLoginPath') ?? (process.env.REACT_APP_AUTH_REDIRECT_URI || ''))
}
