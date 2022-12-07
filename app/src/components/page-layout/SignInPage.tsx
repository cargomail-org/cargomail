import { Button, Grid } from '@mui/material'
import { FC, ReactNode } from 'react'
import { useConfig } from '../../packages/core/config'
import { useOidc } from '@axa-fr/react-oidc'

export type LoginPageProps = {
  title: string
  children?: ReactNode
}

export const LoginPage: FC<LoginPageProps> = (props) => {
  const { login } = useOidc()
  const { productName } = useConfig()
  const titleParts: string[] = []
  if (props.title) {
    titleParts.push(props.title)
  }
  if (productName) {
    titleParts.push(productName)
  }

  function signInUser() {
    const callbackpath = sessionStorage.getItem('preLoginPath')
    if (callbackpath) {
      login(callbackpath)
    } else {
      login()
    }
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '100vh' }}>
      <Grid>
        <Button
          sx={{
            textTransform: 'none',
            fontSize: 22,
          }}
          onClick={() => {
            signInUser()
          }}>
          Sign in to cargomail
        </Button>
      </Grid>
    </Grid>
  )
}
