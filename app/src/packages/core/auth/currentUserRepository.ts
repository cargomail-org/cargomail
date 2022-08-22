import { createContext, useContext } from 'react'
import { AuthenticatedAuthUser, AuthUser } from './authUser'
import { anonymousAuthUser } from './currentUser'
import { Buffer } from 'buffer'
import { TTokenData } from '../../../packages/react-oauth2-code-pkce/Types'

export type CurrentUserRepository = {
  setCurrentUser(currentUser: AuthUser): void
  init: (idToken?: string) => void
}

type CurrentUserStateSetter = (currentUser: AuthUser) => void

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

function jwtToAuthenticatedAuthUser(jwt: TTokenData): AuthenticatedAuthUser {
  const user: AuthenticatedAuthUser = {
    type: 'authenticated',
    data: {
      id: jwt.sub,
      username: jwt.email,
      userFirst: jwt.given_name,
      userLast: jwt.family_name,
      userEmailAddress: jwt.email,
    },
  }
  return user
}

export class BrowserCurrentUserRepository implements CurrentUserRepository {
  private readonly setCurrentUserState: CurrentUserStateSetter

  constructor(setCurrentUserState: CurrentUserStateSetter) {
    this.setCurrentUserState = setCurrentUserState
  }

  setCurrentUser(currentUser: AuthUser) {
    this.setCurrentUserState(currentUser)
    if (currentUser.type === 'anonymous') {
      localStorage.removeItem('currentUser')
      return
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser))
  }

  init(idToken?: string) {
    let currentUserStr: any
    let currentUser: AuthUser
    if (idToken) {
      currentUser = jwtToAuthenticatedAuthUser(decodeJWT(idToken))
    } else {
      currentUserStr = localStorage.getItem('currentUser')
      if (!currentUserStr) {
        this.setCurrentUser(anonymousAuthUser)
        return
      }
      currentUser = JSON.parse(currentUserStr) as AuthUser
    }
    this.setCurrentUser(currentUser)
  }
}

const currentUserRepositoryContext = createContext<CurrentUserRepository | null>(null)
export const CurrentUserRepositoryProvider = currentUserRepositoryContext.Provider

export function useCurrentUserRepository(): CurrentUserRepository {
  const repo = useContext(currentUserRepositoryContext)
  if (!repo) {
    throw new Error(`no CurrentUserRepository was provided`)
  }
  return repo
}
