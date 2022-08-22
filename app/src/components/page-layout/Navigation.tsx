import React, { FC, useEffect, useState } from 'react'
//Mui
import { styled } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'

//Icons
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
//Custom
import { Labels } from '../main/Labels'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
// import AvatarMenu from './AvatarMenu'

import { FunctionalLink, RoutingLink } from '../../packages/core/routing'
import { anonymousAuthUser, useCurrentUser, useCurrentUserRepository } from '../../packages/core/auth'
import { useNavigate } from 'react-router-dom'
import { useConfig } from '../../packages/core/config'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { Button, Hidden, Menu, MenuItem } from '@mui/material'

const drawerWidth = 240

interface AppBarProps extends MuiAppBarProps {
  open?: boolean
}

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  [theme.breakpoints.up('sm')]: {
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: drawerWidth,
      width: `calc(100% - ${drawerWidth}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  },
}))

const DrawerDesktop = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({}))

const DrawerMobile = styled(MuiDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    paddingTop: 60,
  },
}))

export function Navigation() {
  const [open, setOpen] = useState(window.innerWidth < 769 ? false : true)
  const toggleDrawer = () => {
    setOpen(!open)
    if (open) {
      document.body.style.overflow = 'hidden'
    }
  }

  useEffect(() => {
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 600) {
        setOpen(false)
      }
    })
  })

  const { companyName } = useConfig()
  const navigate = useNavigate()
  const currentUserRepo = useCurrentUserRepository()
  const currentUser = useCurrentUser()
  const isLoggedIn = currentUser.type === 'authenticated'
  function loginUser() {
    currentUserRepo.setCurrentUser({
      type: 'authenticated',
      data: {
        id: 'foo',
        username: 'matthew.cuthbert@demo.localhost',
        userFirst: 'Matthew',
        userLast: 'Cuthbert',
        userEmailAddress: 'matthew.cuthbert@demo.localhost',
      },
    })
  }

  return (
    <React.Fragment>
      <AppBar position="absolute" open={false}>
        <Toolbar
          sx={{
            pr: '24px',
            pl: '28px!important',
            justifyContent: 'space-between',
          }}>
          <Hidden smUp>
            <IconButton edge="start" aria-label="open drawer" onClick={toggleDrawer}>
              <MenuIcon />
            </IconButton>
          </Hidden>
          {/* <AvatarMenu /> */}
          {/* {!isLoggedIn && (
            <>
              <FunctionalLink onClick={loginUser} noWrap variant="button" href="/" sx={{ p: 1, flexShrink: 0 }}>
                Login
              </FunctionalLink>{' '}
            </>
          )}
          {isLoggedIn && <LoggedInUserMenu />} */}
        </Toolbar>
      </AppBar>
      <Hidden smDown>
        <DrawerDesktop
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
          }}>
          <Toolbar
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              px: [1],
              bgcolor: 'background.default',
            }}>
            <IconButton onClick={toggleDrawer} sx={{ display: open === true ? 'block' : 'none' }}>
              <ChevronLeftIcon />
            </IconButton>
          </Toolbar>
          <Labels />
          <Toolbar />
        </DrawerDesktop>
      </Hidden>

      <Hidden smUp>
        <DrawerMobile
          open={open}
          onClose={toggleDrawer}
          ModalProps={{
            keepMounted: true,
          }}>
          <Box sx={{ width: drawerWidth }} role="presentation" onClick={toggleDrawer} onKeyDown={toggleDrawer}>
            <Labels />
          </Box>
        </DrawerMobile>
      </Hidden>
    </React.Fragment>
  )
}

const LoggedInUserMenu: FC = () => {
  const navigate = useNavigate()
  const currentUserRepo = useCurrentUserRepository()
  const currentUser = useCurrentUser()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  if (currentUser.type !== 'authenticated') {
    return null
  }
  function logoutUser() {
    currentUserRepo.setCurrentUser(anonymousAuthUser)
    navigate('/')
  }
  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget)
  }
  function closeMenu() {
    setAnchorEl(null)
  }
  const isMenuOpen = !!anchorEl
  return (
    <>
      <Button
        id="basic-button"
        aria-controls={isMenuOpen ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isMenuOpen ? 'true' : undefined}
        onClick={handleClick}>
        {currentUser.data?.username}
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={closeMenu}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}>
        <MenuItem
          onClick={() => {
            navigate('/user/accounts')
            closeMenu()
          }}>
          Accounts
        </MenuItem>
        <MenuItem
          onClick={() => {
            logoutUser()
            closeMenu()
          }}>
          Logout
        </MenuItem>
      </Menu>
    </>
  )
}
