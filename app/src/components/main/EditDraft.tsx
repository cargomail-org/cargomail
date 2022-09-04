import { useContext } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  colors,
  Divider,
  IconButton,
  InputBase,
  MenuItem,
  useMediaQuery,
} from '@mui/material'
import DraftsIcon from '@mui/icons-material/Drafts'
import ClearIcon from '@mui/icons-material/Clear'
import { ContactsContext } from '../../context/ContactsContext'
import { DraftsContext } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'
import { RecipientsSelect } from './Recipients'

const EditDraft = ({ id, sender, recipients, subject, content }: any) => {
  const isMobileLandscape = useMediaQuery('(max-height: 520px)')

  const { closeDraftEdit } = useContext(DraftsContext)
  const { contacts } = useContext(ContactsContext)
  const { draftsUpdate, draftsSend, draftsDelete } = useFedemailAPI()
  const draftEdit = {
    id,
    sender,
    recipients,
    subject,
    content,
  }
  const update = (field: string) => (e: { target: { value: any } }) =>
    draftsUpdate({ ...draftEdit, [field]: e.target.value })
  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        zIndex: 9999,
        right: 0,
        marginRight: '8px',
        marginLeft: '8px',
        maxHeight: 'calc(100vh - 80px)',
      }}>
      {/* {(window as any).debug(id)}
      {(window as any).debug(sender)}
      {(window as any).debug(recipients)}
      {(window as any).debug(subject)}
      {(window as any).debug(content)} */}
      <Card
        sx={{
          width: 'calc(100vw - 15px)',
          maxWidth: '480px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: '0 8px 16px rgba(0,0,0,0.45)',
        }}>
        <CardHeader
          sx={{ background: colors.grey[800], height: 10 }}
          avatar={<DraftsIcon sx={{ height: 18, width: 18, color: colors.grey[50] }} />}
          action={
            <span>
              <IconButton
                sx={{
                  padding: 0,
                  margin: '0 4px',
                  color: colors.grey[400],
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: colors.grey[50],
                  },
                }}>
                {/* <MinimizeIcon sx={{ height: 18, width: 18 }} /> */}
              </IconButton>
              <IconButton
                sx={{
                  padding: 0,
                  margin: '0 4px',
                  color: colors.grey[400],
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: colors.grey[50],
                  },
                }}
                onClick={() => (content ? closeDraftEdit(id) : draftsDelete(id))}>
                <ClearIcon sx={{ height: 18, width: 18 }} />
              </IconButton>
            </span>
          }
        />
        <CardContent sx={{ padding: 0, '&:last-child': { pb: 1 } }}>
          {/* <Select
            multiple
            autoWidth
            value={recipients.slice().split(',')}
            onChange={(e) =>
              draftsUpdate({
                ...draftEdit,
                recipients: `${recipients},${e.target.value}`,
              })
            }
            input={
              <InputBase
                sx={{ padding: '4px 12px', display: 'block' }}
                placeholder="Receipient"
                inputProps={{
                  'aria-label': 'Receipient',
                }}
              />
            }>
            {Object.values(contacts).map((contact) => (
              <MenuItem key={contact.id} value={contact.emailAddress}>
                {contact.emailAddress}
              </MenuItem>
            ))}
          </Select> */}
          <RecipientsSelect sx={{ marginTop: 1 }}>
            Hello
            {Object.values(contacts).map((contact) => (
              <MenuItem key={contact.id} value={contact.emailAddress}>
                {contact.emailAddress}
              </MenuItem>
            ))}
          </RecipientsSelect>
          <Divider />
          <InputBase
            sx={{ width: '100%', padding: '4px 12px', fontWeight: 'bold' }}
            placeholder={'Subject'}
            inputProps={{
              'aria-label': 'Subject',
            }}
            value={subject}
            onChange={update('subject')}
          />
          <Divider />
          {!isMobileLandscape && (
            <InputBase
              sx={{ padding: '4px 12px', display: 'block' }}
              placeholder={'Content'}
              multiline
              rows={10}
              inputProps={{
                'aria-label': 'Content',
              }}
              value={content}
              onChange={update('content')}
            />
          )}
          {isMobileLandscape && (
            <InputBase
              sx={{ padding: '4px 12px', display: 'block' }}
              placeholder={'Content'}
              multiline
              rows={3}
              inputProps={{
                'aria-label': 'Content',
              }}
              value={content}
              onChange={update('content')}
            />
          )}
          <CardActions disableSpacing>
            <Button variant="contained" color="primary" onClick={() => draftsSend(id)}>
              {'Send'}
            </Button>
          </CardActions>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EditDraft
