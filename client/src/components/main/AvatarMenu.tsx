import React, { useState } from 'react'
import { Avatar, Menu, Box, IconButton } from '@mui/material'
import { AvatarMenuItems } from './AvatarMenuItems'
import { useOidcUser } from '@axa-fr/react-oidc'

function AvatarMenuContent() {
  const { oidcUser } = useOidcUser()
  const nameFirstLetter = oidcUser?.given_name?.charAt(0).toUpperCase()
  const surnameFirstLetter = oidcUser?.family_name?.charAt(0).toUpperCase()

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
                bgcolor: '#013d6e',
                fontSize: 14,
                fontWeight: 500,
                '&:hover': {
                  bgcolor: '#002b4f',
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
