import React, { useContext } from 'react'
import { MenuItem } from '@mui/material'
import { AuthContext } from '../../packages/react-oauth2-code-pkce/index'
import { useNavigate } from 'react-router-dom'
import * as ROUTES from '../../routes'

export const AvatarMenuItems = (props: any) => {
  const { logOut } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleClose = () => {
    props.setAnchorEl(null)
  }

  return (
    <React.Fragment>
      <MenuItem
        onClick={() => {
          handleClose()
          navigate(ROUTES.ACCOUNT)
        }}>
        Account settings
      </MenuItem>
      <MenuItem
        onClick={() => {
          logOut()
          navigate(ROUTES.SIGNIN)
        }}>
        Sign out
      </MenuItem>
    </React.Fragment>
  )
}
