import { useContext, useEffect } from 'react'
import { useCurrentUser, useCurrentUserRepository } from './packages/core/auth'
import { Route, Routes } from 'react-router-dom'
import { Login } from './pages/Login'
import { Index } from './pages/Inbox'
import { Done } from './pages/Done'
import { Drafts } from './pages/Drafts'
import { Trash } from './pages/Trash'
import { Account } from './pages/user/Account'
import { NotFound } from './pages/NotFound'
import { AuthProvider, AuthContext } from './packages/react-oauth2-code-pkce/index'
import { authConfig } from './auth'
import { LabelsList } from './api/grpc'
import * as ROUTES from './routes'

const hasUnsafeAuthConfig = process.env.REACT_APP_AUTH !== '1'

function AppRoutes() {
  const { idToken } = useContext(AuthContext)
  const currentUserRepo = useCurrentUserRepository()
  useEffect(() => {
    currentUserRepo.init(idToken)
  }, [currentUserRepo, idToken])

  const currentUser = useCurrentUser()
  const isUserLoggedIn = currentUser.type === 'authenticated'

  // const { getLabels } = useFedemailAPI()
  if (isUserLoggedIn) {
    LabelsList()
  }
  // useEffect(LabelsList, [])

  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.INBOX} element={isUserLoggedIn ? <Index /> : <Login />} />
      <Route path={ROUTES.DONE} element={isUserLoggedIn ? <Done /> : <Login />} />
      <Route path={ROUTES.DRAFTS} element={isUserLoggedIn ? <Drafts /> : <Login />} />
      <Route path={ROUTES.TRASH} element={isUserLoggedIn ? <Trash /> : <Login />} />
      <Route path={ROUTES.ACCOUNT} element={isUserLoggedIn ? <Account /> : <Login />} />
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
