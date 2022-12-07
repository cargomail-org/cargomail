import { Route, Routes, useLocation } from 'react-router-dom'
import { Login } from './pages/Login'
import { Index } from './pages/Inbox'
import { Done } from './pages/Done'
import { Drafts } from './pages/Drafts'
import { Trash } from './pages/Trash'
import { Account } from './pages/user/Account'
import { NotFound } from './pages/NotFound'
import { OidcProvider, useOidc } from '@axa-fr/react-oidc'
import { oidcConfig } from './oidcConfig'
import useEmailAPI from './api/EmailAPI'
import * as ROUTES from './routes'
import { useEffect } from 'react'
import AllContextProviders from './context'

import './components/editor/styles.css'
import './i18n'

import debug from './utils/debug'
;(window as any).debug = debug

function AppRoutes() {
  const location = useLocation()
  const { isAuthenticated } = useOidc()
  const { labelsList, threadsList } = useEmailAPI()

  useEffect(() => {
    if (isAuthenticated) {
      labelsList()
      threadsList()
    }
  }, []) // eslint-disable-line

  if (!(location.pathname === ROUTES.AUTH_CALLBACK || location.pathname === ROUTES.SIGNIN)) {
    sessionStorage.setItem('preLoginPath', location.pathname)
  }

  return (
    <Routes>
      <Route path={ROUTES.INBOX} element={isAuthenticated ? <Index /> : <Login />} />
      <Route path={ROUTES.DONE} element={isAuthenticated ? <Done /> : <Login />} />
      <Route path={ROUTES.DRAFTS} element={isAuthenticated ? <Drafts /> : <Login />} />
      <Route path={ROUTES.TRASH} element={isAuthenticated ? <Trash /> : <Login />} />
      <Route path={ROUTES.ACCOUNT} element={isAuthenticated ? <Account /> : <Login />} />
      <Route path={ROUTES.SIGNIN} element={<Login />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

const App = () => (
  <OidcProvider configuration={oidcConfig}>
    <AllContextProviders>
      <AppRoutes />
    </AllContextProviders>
  </OidcProvider>
)

export default App
