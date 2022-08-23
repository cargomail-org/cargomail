import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
// import MailIcon from '@mui/icons-material/Mail'
import InboxIcon from '@mui/icons-material/Inbox'
import DraftsIcon from '@mui/icons-material/Drafts'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import AccountBoxIcon from '@mui/icons-material/AccountBox'
import * as ROUTES from '../../routes'
import { LabelsList } from '../../api/grpc'

export const Labels = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        setSelectedIndex(0)
        break
      default:
        setSelectedIndex(null)
        break
    }
  }, [location])

  const handleListItemClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedIndex(index)
    console.log('clicked', index)
    // await callUnary(client, options)
    await LabelsList()
  }

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.INBOX)
            handleListItemClick(e, 0)
          }}>
          <ListItemIcon>
            <InboxIcon />
          </ListItemIcon>
          <ListItemText primary="Inbox" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.DONE)
            handleListItemClick(e, 1)
          }}>
          <ListItemIcon>
            <CheckIcon />
          </ListItemIcon>
          <ListItemText primary="Done" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.DRAFTS)
            handleListItemClick(e, 2)
          }}>
          <ListItemIcon>
            <DraftsIcon />
          </ListItemIcon>
          <ListItemText primary="Drafts" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.TRASH)
            handleListItemClick(e, 3)
          }}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary="Trash" />
        </ListItemButton>
      </ListItem>
    </List>
  )
}
