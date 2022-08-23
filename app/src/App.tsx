import { Route, Routes, useLocation } from 'react-router-dom'
import { Login } from './pages/Login'
import { Index } from './pages/Inbox'
import { Done } from './pages/Done'
import { Drafts } from './pages/Drafts'
import { Trash } from './pages/Trash'
import { Account } from './pages/user/Account'
import { NotFound } from './pages/NotFound'
import { AuthProvider } from './packages/react-oauth2-code-pkce/index'
import { authConfig, getTokenFromStorage } from './auth'
import { LabelsList } from './api/grpc'
import * as ROUTES from './routes'
import { useEffect } from 'react'

const AUTH_DISABLED = process.env.REACT_APP_AUTH !== '1'

function AppRoutes() {
  const location = useLocation()
  const token = getTokenFromStorage()

  // const { getLabels } = useFedemailAPI()
  // useEffect(LabelsList, [])
  useEffect(() => {
    if (token) {
      LabelsList()
    }
  }, [token])

  if (!(location.pathname === ROUTES.AUTH_CALLBACK || location.pathname === ROUTES.SIGNIN)) {
    localStorage.setItem('preLoginPath', location.pathname)
  }

  return (
    <Routes>
      <Route path={ROUTES.INBOX} element={token ? <Index /> : <Login />} />
      <Route path={ROUTES.DONE} element={token ? <Done /> : <Login />} />
      <Route path={ROUTES.DRAFTS} element={token ? <Drafts /> : <Login />} />
      <Route path={ROUTES.TRASH} element={token ? <Trash /> : <Login />} />
      <Route path={ROUTES.ACCOUNT} element={token ? <Account /> : <Login />} />
      <Route path={ROUTES.SIGNIN} element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function App() {
  return AUTH_DISABLED ? (
    <AppRoutes />
  ) : (
    <AuthProvider authConfig={authConfig}>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
