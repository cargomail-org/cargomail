import React, { useEffect } from 'react'
import { useCurrentUser, useCurrentUserRepository } from './packages/core/auth'
import { Route, Routes } from 'react-router-dom'
import { Index } from './pages/Inbox'
import { Accounts } from './pages/user/Accounts'
import { NotFound } from './pages/NotFound'
import { AuthProvider } from './react-oauth2-code-pkce/index'
import { authConfig } from './auth'

const hasUnsafeAuthConfig = process.env.REACT_APP_AUTH !== '1'

function AppRoutes() {
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
  const currentUserRepo = useCurrentUserRepository()
  useEffect(() => {
    currentUserRepo.init()
  }, [currentUserRepo])
  return hasUnsafeAuthConfig ? (
    <AppRoutes />
  ) : (
    <AuthProvider authConfig={authConfig}>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
