import React, { useContext } from 'react'
import { MenuItem } from '@mui/material'
import { AuthContext, IAuthContext } from '../../packages/react-oauth2-code-pkce/index'
import { useNavigate } from 'react-router-dom'
import * as ROUTES from '../../routes'
import { anonymousAuthUser, useCurrentUserRepository } from '../../packages/core/auth'

export const AvatarMenuItems = (props: any) => {
  const currentUserRepo = useCurrentUserRepository()
  const { logOut }: IAuthContext = useContext(AuthContext)
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
          currentUserRepo.setCurrentUser(anonymousAuthUser)
          navigate(ROUTES.LOGIN)
        }}>
        Log out
      </MenuItem>
    </React.Fragment>
  )
}
