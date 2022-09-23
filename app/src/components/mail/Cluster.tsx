import { useState, useContext, useCallback, FC } from 'react'
import { Accordion, AccordionDetails, Avatar, colors, Box } from '@mui/material'
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary'
import Typography, { typographyClasses } from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import DeleteIcon from '@mui/icons-material/Delete'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import InboxIcon from '@mui/icons-material/Inbox'
import PeopleIcon from '@mui/icons-material/People'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import FlagIcon from '@mui/icons-material/Flag'
import CheckIcon from '@mui/icons-material/Check'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import Thread from './Thread'
import useFedemailAPI from '../../api/FedemailAPI'
import { ThreadsContext } from '../../context/ThreadsContext'
import { Label_Type } from '../../api/generated/proto/fedemail/v1/fedemail'

const theme = createTheme()

const getLabelIcon = (label: any) => {
  switch (label.id) {
    case 'CATEGORY_FORUMS':
      return <QuestionAnswerIcon />
    case 'CATEGORY_UPDATES':
      return <FlagIcon />
    case 'CATEGORY_PROMOTIONS':
      return <LocalOfferIcon />
    case 'CATEGORY_SOCIAL':
      return <PeopleIcon />
    default:
      return null
  }
}

const getLabelColor = (label: any) => {
  switch (label.id) {
    case 'CATEGORY_FORUMS':
      return colors.indigo[600]
    case 'CATEGORY_UPDATES':
      return colors.deepOrange[500]
    case 'CATEGORY_PROMOTIONS':
      return colors.cyan[300]
    case 'CATEGORY_SOCIAL':
      return colors.red[700]
    default:
      return null
  }
}

export type ClusterProps = {
  primaryLabel: any
  threads: any
  actions: any
}

const Cluster: FC<ClusterProps> = ({ primaryLabel, threads, actions }) => {
  const { batchModifyMessages, batchDeleteMessages } = useFedemailAPI()
  const { removeThreadLabel, addThreadLabel } = useContext(ThreadsContext)
  const [expanded, setExpanded] = useState(false)
  const { t } = useTranslation(['labels', 'date'])

  const flattenThreads = Object.values(threads).flatMap((thread: any) => thread.threads)

  const ids = flattenThreads.flatMap((thread) => thread.messages).map(({ id }) => id)

  const backToInbox = useCallback(
    (e: any) => {
      flattenThreads.forEach(({ id }) => addThreadLabel({ id, label: 'INBOX' }))
      batchModifyMessages({ ids, add: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads]
  )
  const markAsDone = useCallback(
    (e: any) => {
      flattenThreads.forEach(({ id }) => removeThreadLabel({ id, label: 'INBOX' }))
      batchModifyMessages({ ids, remove: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads]
  )

  const trash = useCallback(
    (e: any) => {
      flattenThreads.forEach(({ id }) => removeThreadLabel({ id, label: 'INBOX' }))
      flattenThreads.forEach(({ id }) => addThreadLabel({ id, label: 'TRASH' }))
      batchModifyMessages({ ids, add: ['TRASH'], remove: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads]
  )

  const permanentDelete = useCallback(
    (e: any) => {
      flattenThreads.forEach(({ id }) => removeThreadLabel({ id, label: 'INBOX' }))
      batchDeleteMessages(ids)
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threads]
  )

  const threadCount = Object.values(threads)
    .map((thread: any) => thread.threads.length)
    .reduce((accum, current) => accum + current, 0)
  const senderUnreadMap = threads
    .flatMap((thread: any) => thread.threads)
    .map((thread: any) => ({ from: thread.messages[0].from, unread: thread.hasUnread }))
    .reduce((accum: any, current: any) => {
      const n = current.from.name
      accum[n] = accum[n] || current.unread // eslint-disable-line
      return accum
    }, {})

  const senderUnreadList = Object.entries(senderUnreadMap)

  const hasUnread = senderUnreadList.some((entries) => entries[1])

  const isLastSender = (index: any) => index === senderUnreadList.length - 1
  const clusterTitle = senderUnreadList.map(([name, unread], index) => (
    <Box component="span" key={name} sx={{ fontWeight: unread ? 600 : null }}>
      {name}
      {isLastSender(index) ? '' : ', '}
    </Box>
  ))

  return (
    <ThemeProvider theme={theme}>
      <Accordion
        square={true}
        expanded={expanded}
        onChange={() => setExpanded((exp) => !exp)}
        sx={
          expanded
            ? {
                transition: 'all .1s',
                background: theme.palette.grey[300],
                // width: 'calc(100% + 48px)',
                marginLeft: -24,
              }
            : null
        }>
        <AccordionSummary
          sx={{
            display: 'flex',
            [`& .${accordionSummaryClasses.content}`]: {
              maxWidth: '100%',
            },
          }}>
          {expanded ? (
            <Typography
              variant="h5"
              sx={{
                [`& .${typographyClasses.h5}`]: {
                  padding: '0 24px',
                },
              }}>
              {primaryLabel.type === Label_Type.SYSTEM ? t(primaryLabel.id) : primaryLabel.name}
            </Typography>
          ) : (
            <>
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                }}>
                <Avatar
                  alt=""
                  sx={{
                    height: 26,
                    width: 26,
                    background: primaryLabel.type === Label_Type.SYSTEM ? 'transparent' : null,
                    color: primaryLabel.type === Label_Type.SYSTEM ? getLabelColor(primaryLabel) : null,
                  }}>
                  {primaryLabel.type === Label_Type.SYSTEM ? getLabelIcon(primaryLabel) : primaryLabel.name[0]}
                </Avatar>
                <Typography
                  sx={{
                    fontWeight: hasUnread ? 600 : null,
                    flex: 3,
                    minWidth: 0,
                    // width: 'calc(30vw - 40px)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingLeft: 2,
                    paddingRight: 2,
                    letterSpacing: 0.2,
                  }}>
                  <Box
                    component="span"
                    sx={primaryLabel.type === Label_Type.SYSTEM ? { color: getLabelColor(primaryLabel) } : null}>
                    {primaryLabel.type === Label_Type.SYSTEM ? t(primaryLabel.id) : primaryLabel.name}
                  </Box>
                  {threadCount > 1 && (
                    <Box
                      component="span"
                      sx={{
                        paddingLeft: 0.5,
                        color: theme.palette.grey[700],
                      }}>{`(${threadCount})`}</Box>
                  )}
                </Typography>
              </Box>
              <Typography
                sx={{
                  flex: 3,
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  letterSpacing: 0.2,
                }}>
                <span>{clusterTitle}</span>
              </Typography>
              <Box
                sx={{
                  padding: '0 !important',
                  display: 'none',
                  '$summary:hover &': {
                    display: 'block',
                  },
                }}>
                {actions.backToInbox && (
                  <InboxIcon
                    sx={{
                      color: colors.blue[500],
                      margin: '0 4px',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      opacity: 0.78,
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                    onClick={backToInbox}
                  />
                )}
                {actions.markAsDone && (
                  <CheckIcon
                    sx={{
                      color: colors.green[600],
                      margin: '0 4px',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      opacity: 0.78,
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                    onClick={markAsDone}
                  />
                )}
                {actions.trash && (
                  <DeleteIcon
                    sx={{
                      margin: '0 4px',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      opacity: 0.78,
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                    onClick={trash}
                  />
                )}
                {actions.permanentDelete && (
                  <DeleteIcon
                    sx={{
                      margin: '0 4px',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      opacity: 0.78,
                      '&:hover': {
                        opacity: 1,
                      },
                    }}
                    onClick={permanentDelete}
                  />
                )}
              </Box>
            </>
          )}
        </AccordionSummary>
        <AccordionDetails
          sx={{
            display: 'block',
            // border: `24px solid ${theme.palette.grey[300]}`,
            padding: 0,
          }}>
          {Object.values(threads).map((nested: any) => (
            <Box key={nested.label}>
              <Typography
                variant="subtitle1"
                sx={{
                  paddingLeft: 2,
                }}>
                {t(`date:${nested.label}`, { date: nested.date })}
              </Typography>
              {nested.threads.map((thread: any) => (
                <Thread key={thread.id} {...thread} actions={actions} />
              ))}
            </Box>
          ))}
        </AccordionDetails>
      </Accordion>
    </ThemeProvider>
  )
}

export default Cluster
