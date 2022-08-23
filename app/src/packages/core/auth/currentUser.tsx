import { AnonymousAuthUser, AuthUser } from './authUser'
import { createContext, useContext } from 'react'

const currentUserContext = createContext<null | AuthUser>(null)

export const CurrentUserProvider = currentUserContext.Provider

export const anonymousAuthUser: AnonymousAuthUser = { type: 'anonymous' }

export function useCurrentUser(): AuthUser {
  const currentUser = useContext(currentUserContext)
  if (!currentUser) {
    throw new Error(`no AuthUser was provided`)
  }
  return currentUser
}
