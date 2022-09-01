import { Route, Routes, useLocation } from 'react-router-dom'
import { Login } from './pages/Login'
import { Index } from './pages/Inbox'
import { Done } from './pages/Done'
import { Drafts } from './pages/Drafts'
import { Trash } from './pages/Trash'
import { Account } from './pages/user/Account'
import { NotFound } from './pages/NotFound'
import { AuthProvider, AuthContext } from './packages/react-oauth2-code-pkce/index'
import { authConfig } from './auth'
import useFedemailAPI from './api/FedemailAPI'
import * as ROUTES from './routes'
import { useContext, useEffect } from 'react'
import AllContextProviders from './context'
import debug from './utils/debug'
;(window as any).debug = debug

const AUTH_DISABLED = process.env.REACT_APP_AUTH !== '1'
function AppRoutes() {
  const location = useLocation()
  const { token } = useContext(AuthContext)
  const { labelsList } = useFedemailAPI()

  useEffect(() => {
    if (token) {
      labelsList()
    }
  }, []) // eslint-disable-line

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
      <AllContextProviders>
        <AppRoutes />
      </AllContextProviders>
    </AuthProvider>
  )
}

export default App
