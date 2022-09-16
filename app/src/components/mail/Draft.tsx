import { Accordion, AccordionDetails, Avatar, Box, colors, Typography } from '@mui/material'
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary'
import { FC, useContext, useState } from 'react'
import DeleteIcon from '@mui/icons-material/Delete'
import { MessagePart } from '../../api/generated/proto/fedemail/v1/fedemail'
import parsePayload from '../../utils/mails/parsePayload'
import { AuthContext } from '../../packages/react-oauth2-code-pkce/index'
import { decodeCurrentUser } from '../../auth'

export type DraftMessageProps = {
  draftId: string
  id?: string
  snippet?: string
  payload?: MessagePart
  threadId?: string
  historyId?: string
}

export const Draft: FC<DraftMessageProps> = ({ draftId, id, snippet, payload, threadId }) => {
  const [expanded, setExpanded] = useState(false)
  const parsed = parsePayload({ id, payload })

  const { idToken } = useContext(AuthContext)
  const currentUser = decodeCurrentUser(idToken)
  const nameFirstLetter = currentUser?.name?.charAt(0).toUpperCase()
  const surnameFirstLetter = currentUser?.surname?.charAt(0).toUpperCase()

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded((exp) => !exp)}>
      <AccordionSummary
        sx={{
          display: 'flex',
          [`& .${accordionSummaryClasses.content}`]: {
            maxWidth: '100%',
          },
          '&:hover': {
            '& .deleteIconBox': {
              display: 'block',
            },
          },
        }}>
        <>
          <Box
            sx={{
              display: 'flex',
            }}>
            <Avatar
              alt=""
              sx={{
                height: 26,
                width: 26,
                backgroundColor: 'info.light',
              }}>
              {nameFirstLetter && nameFirstLetter.length > 0 ? nameFirstLetter : surnameFirstLetter}
            </Avatar>
            <Typography
              sx={{
                flex: 3,
                minWidth: 0,
                width: '120px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                paddingLeft: 2,
                paddingRight: 2,
                letterSpacing: 0.2,
                color: 'red',
              }}>
              Draft
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
            {parsed.subject}
            <>
              {expanded || (
                <Box
                  component="span"
                  sx={{
                    color: colors.grey[500],
                  }}>
                  {parsed.subject ? ` - ${snippet}` : snippet}
                </Box>
              )}
            </>
          </Typography>
          <Box
            className="deleteIconBox"
            sx={{
              padding: '0 !important',
              display: 'none',
            }}>
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
              onClick={(e) => {
                // trashDraft(threadId)
                e.stopPropagation()
              }}
            />
          </Box>
        </>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          padding: 2,
          display: 'block',
        }}>
        {/* eslint-disable-next-line */}
        <div dangerouslySetInnerHTML={{ __html: parsed.content }} />
      </AccordionDetails>
    </Accordion>
  )
}
