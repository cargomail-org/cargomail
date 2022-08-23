import { TAuthConfig } from './packages/react-oauth2-code-pkce/index'
import { TTokenData } from './packages/react-oauth2-code-pkce/Types'
import { Buffer } from 'buffer'

export const authConfig: TAuthConfig = {
  clientId: process.env.REACT_APP_AUTH_CLIENT_ID || '',
  authorizationEndpoint: process.env.REACT_APP_AUTH_ENDPOINT || '',
  tokenEndpoint: process.env.REACT_APP_TOKEN_ENDPOINT || '',
  scope: process.env.REACT_APP_AUTH_SCOPE || '',
  redirectUri: process.env.REACT_APP_AUTH_REDIRECT_URI || '',
  logoutEndpoint: process.env.REACT_APP_LOGOUT_ENDPOINT || '',
  postLogin,
  decodeToken: !(process.env.REACT_APP_DECODE_TOKEN === 'false'),
}

function postLogin() {
  window.location.replace(localStorage.getItem('preLoginPath') ?? (process.env.REACT_APP_AUTH_REDIRECT_URI || ''))
}

export interface IUser {
  uid: string
  username: string
  name: string
  surname: string
  emailAddress: string
}

function decodeJWT(idToken: string): TTokenData {
  try {
    const base64Url = idToken.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const buf = Buffer.from(base64, 'base64')
    const jsonPayload = decodeURIComponent(
      buf
        .toString('ascii')
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (e) {
    console.error(e)
    throw Error('failed to decode the id token')
  }
}

function jwtToAuthenticatedAuthUser(jwt: TTokenData): IUser {
  const user: IUser = {
    uid: jwt.sub,
    username: jwt.email,
    name: jwt.given_name,
    surname: jwt.family_name,
    emailAddress: jwt.email,
  }
  return user
}

export function decodeCurrentUser(idToken?: string): IUser {
  if (idToken) {
    return jwtToAuthenticatedAuthUser(decodeJWT(idToken))
  } else {
    return {
      uid: '999999',
      username: 'jdoe@example.com',
      name: 'John',
      surname: 'Doe',
      emailAddress: 'jdoe@example.com',
    }
  }
}
