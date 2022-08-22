import { useContext, useEffect } from 'react'
import { useCurrentUser, useCurrentUserRepository } from './packages/core/auth'
import { Route, Routes } from 'react-router-dom'
import { Index } from './pages/Inbox'
import { Login } from './pages/Login'
import { Accounts } from './pages/user/Accounts'
import { NotFound } from './pages/NotFound'
import { AuthProvider, AuthContext } from './packages/react-oauth2-code-pkce/index'
import { authConfig } from './auth'

const hasUnsafeAuthConfig = process.env.REACT_APP_AUTH !== '1'

function AppRoutes() {
  const { idToken } = useContext(AuthContext)
  const currentUserRepo = useCurrentUserRepository()
  useEffect(() => {
    currentUserRepo.init(idToken)
  }, [currentUserRepo, idToken])

  const currentUser = useCurrentUser()
  const isUserLoggedIn = currentUser.type === 'authenticated'
  return (
    <Routes>
      {isUserLoggedIn && <Route path="/" element={<Index />} />}
      <Route path="/login" element={<Login />} />
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
