import React from 'react'
import { MenuItem } from '@mui/material'
import { useOidc } from '@axa-fr/react-oidc'
import { useNavigate } from 'react-router-dom'
import * as ROUTES from '../../routes'

export const AvatarMenuItems = (props: any) => {
  const { logout } = useOidc()
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
          logout()
          navigate(ROUTES.SIGNIN)
        }}>
        Sign out
      </MenuItem>
    </React.Fragment>
  )
}
