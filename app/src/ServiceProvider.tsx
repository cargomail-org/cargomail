import React, { FC, PropsWithChildren, useRef, useState } from 'react'
import {
  anonymousAuthUser,
  AuthUser,
  BrowserCurrentUserRepository,
  CurrentUserProvider,
  CurrentUserRepositoryProvider,
} from './packages/core/auth'
import { Config, ConfigProvider } from './packages/core/config'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as ScThemeProvider } from 'styled-components'
import { theme } from './components/theme'

export const ServiceProvider: FC<PropsWithChildren<{}>> = (props) => {
  const [currentUserState, setCurrentUserState] = useState<AuthUser>(anonymousAuthUser)
  const browserCurrentUserRepositoryRef = useRef(new BrowserCurrentUserRepository(setCurrentUserState))
  const configRef = useRef<Config>({
    companyName: 'Fedemail',
  })
  return (
    <MuiThemeProvider theme={theme}>
      <ScThemeProvider theme={theme}>
        <BrowserRouter>
          <ConfigProvider value={configRef.current}>
            <CurrentUserRepositoryProvider value={browserCurrentUserRepositoryRef.current}>
              <CurrentUserProvider value={currentUserState}>{props.children}</CurrentUserProvider>
            </CurrentUserRepositoryProvider>
          </ConfigProvider>
        </BrowserRouter>
      </ScThemeProvider>
    </MuiThemeProvider>
  )
}
