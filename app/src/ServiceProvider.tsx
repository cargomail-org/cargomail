import { FC, PropsWithChildren, useRef } from 'react'
import { Config, ConfigProvider } from './packages/core/config'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider as MuiThemeProvider } from '@mui/material'
import { ThemeProvider as ScThemeProvider } from 'styled-components'
import { theme } from './components/theme'
import Logo from './logo'
// import { ReactComponent as Logo } from './cargomail.svg'

export const ServiceProvider: FC<PropsWithChildren<{}>> = (props) => {
  const configRef = useRef<Config>({
    productName: 'cargomail',
    ProductLogo: Logo,
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
