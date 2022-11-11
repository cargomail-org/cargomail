import { useState, useCallback, useContext } from 'react'
import { Accordion, AccordionDetails, Typography, Avatar, Chip, colors, Box } from '@mui/material'
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import { AuthContext } from '../../packages/react-oauth2-code-pkce/index'
import { decodeCurrentUser } from '../../auth'

import Message from './Message'

import useEmailAPI from '../../api/EmailAPI'

import { ThreadsContext } from '../../context/ThreadsContext'

import ActionsBox from './ActionsBox'

const theme = createTheme()

const Thread = ({ id, messages, hasUnread, actions }: any) => {
  const { trashThread, deleteThread, batchModifyMessages } = useEmailAPI()
  const { idToken } = useContext(AuthContext)
  const { removeThreadLabel, addThreadLabel } = useContext(ThreadsContext)
  const [expanded, setExpanded] = useState(false)

  const ids = messages.map((message: any) => message.id)

  const mimeTypeIcon = (type: any) => {
    switch (type) {
      case 'image/jpg':
        return (
          <ThemeProvider theme={theme}>
            <InsertPhotoIcon
              color="secondary"
              sx={{
                color: theme.palette.secondary.light,
                marginLeft: '.5rem',
              }}
            />
          </ThemeProvider>
        )
      default:
        return (
          <ThemeProvider theme={theme}>
            <InsertDriveFileIcon
              color="secondary"
              sx={{
                color: theme.palette.secondary.light,
                marginLeft: '.5rem',
              }}
            />
          </ThemeProvider>
        )
    }
  }

  const backToInbox = useCallback(
    (e: any) => {
      addThreadLabel({ id, label: 'INBOX' })
      batchModifyMessages({ ids, add: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  )

  const markAsDone = useCallback(
    (e: any) => {
      removeThreadLabel({ id, label: 'INBOX' })
      batchModifyMessages({ ids, remove: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  )

  const trash = useCallback(
    (e: any) => {
      trashThread(id)
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  )
  const permanentDelete = useCallback(
    (e: any) => {
      deleteThread(id)
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [messages]
  )

  const senderUnreadMap = messages.reduce((accum: any, current: any) => {
    const username = decodeCurrentUser(idToken)?.username
    const n = current.from.mail === username ? 'me' : current.from.name
    accum[n] = accum[n] || current.unread //eslint-disable-line
    return accum
  }, {})
  const firstSenderName = messages[0].from.name
  const senderUnreadList = Object.entries(senderUnreadMap)
  const isLastSender = (index: any) => index === senderUnreadList.length - 1
  const threadTitle = senderUnreadList.map(([name, unread], index) => (
    <Box component="span" key={name} sx={{ fontWeight: unread ? 600 : null }}>
      {name}
      {isLastSender(index) ? '' : ', '}
    </Box>
  ))

  const attachments = messages.flatMap((message: any) => message.attachments)

  return (
    <Accordion square={true} expanded={expanded} onChange={() => setExpanded((exp) => !exp)}>
      <AccordionSummary
        sx={{
          display: 'flex',
          [`& .${accordionSummaryClasses.content}`]: {
            maxWidth: '100%',
            // minHeight: '28px',
          },
        }}>
        {expanded ? (
          <Box
            sx={{
              flex: 1,
              display: 'flex',
            }}>
            <Box
              component="span"
              sx={{
                flex: 1,
                color: colors.grey[800],
              }}>
              {messages[0].subject}
            </Box>
            <ActionsBox
              actions={actions}
              handlers={{
                backToInbox,
                markAsDone,
                trash,
                permanentDelete,
              }}
            />
          </Box>
        ) : (
          <>
            <Box sx={{ flex: 1, display: 'flex' }}>
              <Avatar
                alt=""
                sx={{
                  height: 30,
                  width: 30,
                  backgroundColor: 'info.dark',
                }}>
                {firstSenderName[0]}
              </Avatar>
              <Typography
                sx={{
                  flex: 3,
                  marginTop: '3px !important',
                  minWidth: 0,
                  width: 'calc(30vw - 40px)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingLeft: 2,
                  paddingRight: 2,
                  letterSpacing: 0.2,
                }}>
                {threadTitle}
              </Typography>
            </Box>
            <Typography
              sx={{
                flex: 3,
                marginTop: '3px !important',
                minWidth: 0,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                letterSpacing: 0.2,
              }}
              component="div">
              <Box component="span" sx={{ fontWeight: hasUnread ? 600 : null }}>
                {messages[0].subject}
              </Box>
              <Box
                component="span"
                sx={{
                  color: colors.grey[500],
                }}>{` - ${messages[0].snippet}`}</Box>
              {attachments.length > 0 && (
                <Box
                  sx={{
                    marginTop: '.5rem',
                  }}>
                  {attachments.map(({ id: attachmentId, name, mimeType }: any) => (
                    <Chip key={attachmentId} icon={mimeTypeIcon(mimeType)} variant="outlined" label={name} clickable />
                  ))}
                </Box>
              )}
            </Typography>
            <ActionsBox
              actions={actions}
              handlers={{
                backToInbox,
                markAsDone,
                trash,
                permanentDelete,
              }}
            />
          </>
        )}
      </AccordionSummary>
      <AccordionDetails
        sx={{
          padding: 0,
          display: 'block',
          '& .MuiCard-root': {
            borderRadius: 0,
          },
        }}>
        {expanded
          ? messages.map((message: any, index: any) => (
              <Message key={message.id} initialExpand={index === messages.length - 1} actions={actions} {...message} />
            ))
          : ''}
      </AccordionDetails>
    </Accordion>
  )
}

export default Thread
