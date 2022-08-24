import React, { useContext, useState } from 'react'
import { Avatar, Menu, Box, IconButton } from '@mui/material'
import { AvatarMenuItems } from './AvatarMenuItems'
import { AuthContext } from '../../packages/react-oauth2-code-pkce/index'
import { decodeCurrentUser } from '../../auth'

function AvatarMenuContent() {
  const { idToken } = useContext(AuthContext)
  const currentUser = decodeCurrentUser(idToken)
  const nameFirstLetter = currentUser?.name?.charAt(0).toUpperCase()
  const surnameFirstLetter = currentUser?.surname?.charAt(0).toUpperCase()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const openAvatar = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      {
        <Box onClick={handleClick}>
          <IconButton>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: 'common.white',
                color: 'primary.main',
                fontSize: 14,
                '&:hover': {
                  bgcolor: '#eeeeee',
                },
              }}>
              {nameFirstLetter}
              {surnameFirstLetter}
            </Avatar>
          </IconButton>
        </Box>
      }

      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={openAvatar}
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundImage: 'none',
            overflow: 'visible',
            mt: 0.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <AvatarMenuItems setAnchorEl={setAnchorEl} />
      </Menu>
    </>
  )
}

export default function AvatarMenu() {
  return <AvatarMenuContent />
}
