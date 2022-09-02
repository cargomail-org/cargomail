import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Divider, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
// import MailIcon from '@mui/icons-material/Mail'
import InboxIcon from '@mui/icons-material/Inbox'
import DraftsIcon from '@mui/icons-material/Drafts'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import EmailIcon from '@mui/icons-material/Email'
import * as ROUTES from '../../routes'
import { LabelsContext } from '../../context/LabelsContext'

export const Labels = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { labels } = useContext(LabelsContext)

  // Inbox, Done, Drafts, Trash
  const STATIC_LABELS_COUNT = 4

  useEffect(() => {
    switch (location.pathname) {
      case ROUTES.INBOX:
        setSelectedIndex(0)
        break
      case ROUTES.DONE:
        setSelectedIndex(1)
        break
      case ROUTES.DRAFTS:
        setSelectedIndex(2)
        break
      case ROUTES.TRASH:
        setSelectedIndex(3)
        break
      default:
        setSelectedIndex(null)
        break
    }
  }, [location])

  const handleListItemClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedIndex(index)
    switch (index) {
      case 0:
        navigate(ROUTES.INBOX)
        break
      case 1:
        navigate(ROUTES.DONE)
        break
      case 2:
        navigate(ROUTES.DRAFTS)
        break
      case 3:
        navigate(ROUTES.TRASH)
        break
      default:
        navigate(ROUTES.NOT_FOUND)
        break
    }
  }

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton
          selected={selectedIndex === 0}
          onClick={(e) => {
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
          selected={selectedIndex === 1}
          onClick={(e) => {
            handleListItemClick(e, 1)
          }}>
          <ListItemIcon>
            <CheckIcon />
          </ListItemIcon>
          <ListItemText primary="Done" />
        </ListItemButton>
      </ListItem>
      <Divider />
      <ListItem disablePadding>
        <ListItemButton
          selected={selectedIndex === 2}
          onClick={(e) => {
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
          selected={selectedIndex === 3}
          onClick={(e) => {
            handleListItemClick(e, 3)
          }}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary="Trash" />
        </ListItemButton>
      </ListItem>
      {labels.user
        ?.filter((label) => label.type === 1)
        .map((label, index) => (
          <ListItem key={label.id} disablePadding>
            <ListItemButton
              selected={selectedIndex === STATIC_LABELS_COUNT + index}
              onClick={(e) => {
                handleListItemClick(e, STATIC_LABELS_COUNT + index)
              }}>
              <ListItemIcon>
                <EmailIcon />
              </ListItemIcon>
              <ListItemText primary={label.name} />
            </ListItemButton>
          </ListItem>
        ))}
    </List>
  )
}
