import { Grid, Link } from '@mui/material'
import { FC, ReactNode, useEffect } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useConfig } from '../../packages/core/config'

export type LoginPageProps = {
  title: string
  children?: ReactNode
}

export const LoginPage: FC<LoginPageProps> = (props) => {
  const { productName } = useConfig()
  const titleParts: string[] = []
  if (props.title) {
    titleParts.push(props.title)
  }
  if (productName) {
    titleParts.push(productName)
  }
  useEffect(() => {
    if (document) {
      document.title = titleParts.join(' :: ')
    }
  })
  return (
    <Grid
      container
      spacing={0}
      direction="column"
      alignItems="center"
      justifyContent="center"
      style={{ minHeight: '100vh' }}>
      <Grid item xs={3}>
        <Link variant="subtitle1" component={RouterLink} to="/">
          Sign in
        </Link>
      </Grid>
    </Grid>
  )
}
