import { FC, PropsWithChildren, useRef } from 'react'
import { Config, ConfigProvider } from './packages/core/config'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as ScThemeProvider } from 'styled-components'
import { theme } from './components/theme'

export const ServiceProvider: FC<PropsWithChildren<{}>> = (props) => {
  const configRef = useRef<Config>({
    productName: 'Fedemail',
  })
  return (
    <MuiThemeProvider theme={theme}>
      <ScThemeProvider theme={theme}>
        <BrowserRouter>
          <ConfigProvider value={configRef.current}>{props.children}</ConfigProvider>
        </BrowserRouter>
      </ScThemeProvider>
    </MuiThemeProvider>
  )
}
