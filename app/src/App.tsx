import React, { useContext, useEffect } from 'react'
import { useCurrentUser, useCurrentUserRepository } from './packages/core/auth'
import { Route, Routes } from 'react-router-dom'
import { Index } from './pages/Inbox'
import { Accounts } from './pages/user/Accounts'
import { NotFound } from './pages/NotFound'
import { AuthProvider, AuthContext } from './packages/react-oauth2-code-pkce/index'
import { authConfig } from './auth'

const hasUnsafeAuthConfig = process.env.REACT_APP_AUTH !== '1'

function AppRoutes() {
  // const { tokenData, token, idToken, logOut, error } = useContext(AuthContext)
  // const currentUserRepo = useCurrentUserRepository()

  // if (token) {
  //   if (idToken) {
  //     console.log(tokenData)
  //     console.log(idToken)
  //     currentUserRepo.setCurrentUser({
  //       type: 'authenticated',
  //       data: {
  //         id: 'id1',
  //         username: 'matthew.cuthbert@demo.localhost',
  //         userFirst: 'Matthew',
  //         userLast: 'Cuthbert',
  //         userEmailAddress: 'matthew.cuthbert@demo.localhost',
  //       },
  //     })
  //   } else {
  //     currentUserRepo.setCurrentUser({
  //       type: 'authenticated',
  //     })
  //   }
  // }

  const { idToken } = useContext(AuthContext)
  const currentUserRepo = useCurrentUserRepository()
  useEffect(() => {
    currentUserRepo.init(idToken)
  }, [currentUserRepo, idToken])

  const currentUser = useCurrentUser()
  const isUserLoggedIn = currentUser.type === 'authenticated'
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      {isUserLoggedIn && <Route path="/user/accounts" element={<Accounts />} />}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return hasUnsafeAuthConfig ? (
    <AppRoutes />
  ) : (
    <AuthProvider authConfig={authConfig}>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
