import React, { useContext, useEffect, useState } from 'react'
import { styled } from '@mui/material/styles'
import MuiDrawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import MenuIcon from '@mui/icons-material/Menu'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import { Labels } from '../main/Labels'
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar'
import { useConfig } from '../../packages/core/config'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import { CssBaseline, Typography, useMediaQuery } from '@mui/material'
import AvatarMenu from '../main/AvatarMenu'
import NewMailButton from '../main/NewMailButton'
import DraftsContainer from '../main/DraftsContainer'
import { DraftsContext } from '../../context/DraftsContext'

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

const DrawerDesktop = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(({ theme, open }) => ({
  '& .MuiDrawer-paper': {
    paddingTop: 10,
  },
}))

const DrawerMobile = styled(MuiDrawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    paddingTop: 60,
  },
}))

export function Navigation({ children }: any) {
  const isMobilePortrait = useMediaQuery('(max-width: 828px)')
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

  const { productName } = useConfig()

  const { draftsAll } = useContext(DraftsContext)

  return (
    <React.Fragment>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBar position="absolute" open={false}>
          <Toolbar
            sx={{
              pr: '24px',
              pl: '28px!important',
              justifyContent: 'space-between',
            }}>
            {isMobilePortrait && (
              <IconButton edge="start" aria-label="open drawer" onClick={toggleDrawer}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {productName}
            </Typography>
            <AvatarMenu />
          </Toolbar>
        </AppBar>
        {!isMobilePortrait && (
          <Box>
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
          </Box>
        )}

        {isMobilePortrait && (
          <Box>
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
          </Box>
        )}
        <Box
          component="main"
          sx={{
            pt: '68px',
            flexGrow: 1,
            height: '100vh',
            overflow: 'auto',
          }}>
          <>{children}</>
          <NewMailButton />
          <DraftsContainer drafts={draftsAll.editing} />
        </Box>
      </Box>
    </React.Fragment>
  )
}
