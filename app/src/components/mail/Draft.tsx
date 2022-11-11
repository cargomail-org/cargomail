import { Accordion, AccordionDetails, Avatar, Box, colors, Typography } from '@mui/material'
import AccordionSummary, { accordionSummaryClasses } from '@mui/material/AccordionSummary'
import { FC, useContext, useState } from 'react'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import { MessagePart } from '../../api/generated/proto/fedemail/v1/fedemail'
import parsePayload, { IRecipient } from '../../utils/mails/parsePayload'
import { AuthContext } from '../../packages/react-oauth2-code-pkce/index'
import { decodeCurrentUser } from '../../auth'
import useFedemailAPI from '../../api/FedemailAPI'
import { DraftsContext } from '../../context/DraftsContext'
import { IContact } from '../../context/ContactsContext'

import ActionsBox from './ActionsBox'
import Viewer from '../editor/Viewer'

const theme = createTheme()

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

  const { newDraftEdit } = useContext(DraftsContext)
  const { draftsDelete } = useFedemailAPI()

  const actions = {
    editDraft: true,
    permanentDelete: true,
  }

  const editDraft = (e: any) => {
    newDraftEdit({
      id: draftId,
      mimeType: payload?.mimeType || '',
      sender: currentUser?.username || '',
      to: recipientsToContacts(parsed.to) || [],
      cc: recipientsToContacts(parsed.cc) || [],
      bcc: recipientsToContacts(parsed.bcc) || [],
      snippet: snippet || '',
      subject: parsed.subject,
      content: parsed.content,
    })
    e.stopPropagation()
  }

  const permanentDelete = (e: any) => {
    draftsDelete(draftId)
    e.stopPropagation()
  }

  function recipientsToContacts(recipients: IRecipient[]): IContact[] {
    const contacts = recipients
      ?.filter((recipient: IRecipient) => recipient.mail.length > 0)
      .map((recipient: IRecipient) => {
        const fullName = recipient.name.split(' ')
        return {
          id: crypto.randomUUID(),
          emailAddress: recipient.mail,
          givenName: fullName.length > 0 ? fullName[0] : '',
          familyName: fullName.length > 1 ? fullName[1] : '',
        } as IContact
      })
    return contacts
  }

  return (
    <ThemeProvider theme={theme}>
      <Accordion square={true} expanded={expanded} onChange={() => setExpanded((exp) => !exp)}>
        <AccordionSummary
          sx={{
            display: 'flex',
            [`& .${accordionSummaryClasses.content}`]: {
              maxWidth: '100%',
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
                  height: 30,
                  width: 30,
                  backgroundColor: 'info.dark',
                }}>
                {nameFirstLetter && nameFirstLetter.length > 0 ? nameFirstLetter : surnameFirstLetter}
              </Avatar>
              <Typography
                sx={{
                  flex: 1,
                  marginTop: '3px !important',
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
                flex: 1,
                marginTop: '3px !important',
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
                    {parsed.subject ? (snippet ? ` - ${snippet}` : '') : snippet}
                  </Box>
                )}
              </>
            </Typography>
            <ActionsBox
              actions={actions}
              handlers={{
                editDraft,
                permanentDelete,
              }}
            />
          </>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            padding: 0,
            display: 'block',
          }}>
          <Box
            sx={{
              marginLeft: '12px',
              marginRight: '12px',
              paddingBottom: '16px',
            }}>
            <Viewer initialValue={parsed.content} mimeType={payload?.mimeType} />
          </Box>
        </AccordionDetails>
      </Accordion>
    </ThemeProvider>
  )
}
