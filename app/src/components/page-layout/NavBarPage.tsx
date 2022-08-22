import React, { FC, useState } from 'react'
import { BlankPage, BlankPageProps } from './BlankPage'
import { anonymousAuthUser, useCurrentUser, useCurrentUserRepository } from '../../packages/core/auth'
import { useNavigate } from 'react-router-dom'
import { Button, Toolbar, Typography, Container, Menu, MenuItem } from '@mui/material'
import { useConfig } from '../../packages/core/config'
import { Home } from '@mui/icons-material'
import { FunctionalLink, RoutingLink } from '../../packages/core/routing'

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

const Nav: FC = () => {
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
    <Toolbar sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: '15px' }}>
      <RoutingLink to="/">
        <Home />
      </RoutingLink>
      <Typography component="h2" variant="h5" color="inherit" align="center" noWrap sx={{ flex: 1 }}>
        {companyName}
      </Typography>
      {!isLoggedIn && (
        <>
          <FunctionalLink onClick={loginUser} noWrap variant="button" href="/" sx={{ p: 1, flexShrink: 0 }}>
            Login
          </FunctionalLink>{' '}
        </>
      )}
      {isLoggedIn && <LoggedInUserMenu />}
    </Toolbar>
  )
}

export type NavBarPageProps = BlankPageProps

export const NavBarPage: FC<NavBarPageProps> = (props) => {
  return (
    <BlankPage title={props.title}>
      <Nav />
      <Container>{props.children}</Container>
    </BlankPage>
  )
}
