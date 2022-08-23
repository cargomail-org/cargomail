import { Grid, Link } from '@mui/material'
import { FC, ReactNode, useContext } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useConfig } from '../../packages/core/config'
import { AuthContext, IAuthContext } from '../../packages/react-oauth2-code-pkce/index'

export type LoginPageProps = {
  title: string
  children?: ReactNode
}

export const LoginPage: FC<LoginPageProps> = (props) => {
  const { signIn }: IAuthContext = useContext(AuthContext)
  const { productName } = useConfig()
  const titleParts: string[] = []
  if (props.title) {
    titleParts.push(props.title)
  }
  if (productName) {
    titleParts.push(productName)
  }

  function signInUser() {
    signIn()
  }

  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '100vh' }}>
      <Grid item xs={3}>
        <Link
          variant="subtitle1"
          component={RouterLink}
          onClick={() => {
            signInUser()
          }}
          to="/">
          Sign in into Fedemail
        </Link>
      </Grid>
    </Grid>
  )
}
