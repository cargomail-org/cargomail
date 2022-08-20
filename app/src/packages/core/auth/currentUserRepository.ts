import { createContext, useContext } from 'react'
import { AuthUser } from './authUser'
import { anonymousAuthUser } from './currentUser'

export type CurrentUserRepository = {
  setCurrentUser(currentUser: AuthUser): void
  init: () => void
}

type CurrentUserStateSetter = (currentUser: AuthUser) => void

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

  init() {
    const currentUserStr = localStorage.getItem('currentUser')
    if (!currentUserStr) {
      this.setCurrentUser(anonymousAuthUser)
      return
    }
    const currentUser = JSON.parse(currentUserStr) as AuthUser
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
