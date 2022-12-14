import { useState, useContext, useCallback, FC } from 'react'
import { Accordion, AccordionDetails, Avatar, colors, Box } from '@mui/material'
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import PeopleIcon from '@mui/icons-material/People'
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer'
import FlagIcon from '@mui/icons-material/Flag'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import Thread from './Thread'
import useEmailAPI from '../../api/EmailAPI'
import { ThreadsContext } from '../../context/ThreadsContext'
import { Label_Type } from '../../api/generated/proto/email/v1/email'

import { useOidcUser } from '@axa-fr/react-oidc'

import ActionsBox from './ActionsBox'

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
  const { oidcUser } = useOidcUser()
  const { batchModifyMessages, batchDeleteMessages } = useEmailAPI()
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
    .flatMap((thread: any) => thread.messages)
    .filter((message: any) => message.unread === true) // to display from unread messages only
    .map((message: any) => {
      return { from: message.from, unread: message.unread }
    })
    .reduce((accum: any, current: any) => {
      const username = oidcUser?.preferred_username
      const n = current.from.mail === username ? 'me' : current.from.name
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
      <Box sx={{ marginLeft: '12px', marginRight: '12px' }}>
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
                  // marginLeft: -24,
                }
              : null
          }>
          <AccordionSummary
            sx={{
              display: 'flex',
              maxHeight: '50px !important',
              minHeight: '40px !important',
              [`& .${accordionSummaryClasses.content}`]: {
                maxWidth: '100%',
              },
            }}>
            {expanded ? (
              <Box
                sx={{
                  flex: 1,
                  display: 'flex',
                }}>
                <Typography
                  variant="h5"
                  sx={{
                    flex: 1,
                    padding: '0 12px',
                    fontWeight: 500,
                    color: primaryLabel.type === Label_Type.SYSTEM ? getLabelColor(primaryLabel) : null,
                  }}>
                  {primaryLabel.type === Label_Type.SYSTEM ? t(primaryLabel.id) : primaryLabel.name}
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
              </Box>
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
                      height: 30,
                      width: 30,
                      background: primaryLabel.type === Label_Type.SYSTEM ? 'transparent' : null,
                      color: primaryLabel.type === Label_Type.SYSTEM ? getLabelColor(primaryLabel) : null,
                    }}>
                    {primaryLabel.type === Label_Type.SYSTEM ? getLabelIcon(primaryLabel) : primaryLabel.name[0]}
                  </Avatar>
                  <Typography
                    sx={{
                      fontWeight: hasUnread ? 600 : null,
                      flex: 1,
                      marginTop: '3px !important',
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
                    flex: 999,
                    marginTop: '3px !important',
                    minWidth: 0,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    letterSpacing: 0.2,
                  }}>
                  <span>{clusterTitle}</span>
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
              display: 'block',
              borderColor: `${theme.palette.grey[300]}`,
              borderStyle: 'solid',
              borderWidth: '0px 12px 24px 12px',
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
      </Box>
    </ThemeProvider>
  )
}

export default Cluster
