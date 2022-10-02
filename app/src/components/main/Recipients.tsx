import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { FC, FormEvent, Fragment, ReactNode, useState } from 'react'
import { RecipientsAutocomplete } from './RecipientsAutocomplete'
import { IContact } from '../../context/ContactsContext'
import usePeopleAPI from '../../api/PeopleAPI'
import { IDraftEdit } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'
import { Box, colors, FormControl } from '@mui/material'

export type RecipientsSelectProps = {
  children?: ReactNode
  sx: Object
  initialValue?: any
  draftEdit: IDraftEdit
}

export const RecipientsSelect: FC<RecipientsSelectProps> = (props) => {
  const [isVisibleCc, onShowCC] = useState(false)
  const [isVisibleBcc, onShowBcc] = useState(false)

  const { draftsUpdate } = useFedemailAPI()
  const [openDialog, openDialogOpen] = useState(false)

  const { contactsCreate } = usePeopleAPI()

  const [dialogValue, setDialogValue] = useState<IContact>({
    id: '',
    givenName: '',
    familyName: '',
    emailAddress: '',
  })

  const handleClose = () => {
    setDialogValue({
      id: '',
      givenName: '',
      familyName: '',
      emailAddress: '',
    })

    openDialogOpen(false)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    await contactsCreate(dialogValue)

    draftsUpdate({
      id: props.draftEdit.id,
      mimeType: props.draftEdit.mimeType,
      sender: props.draftEdit.sender,
      recipients: [
        ...props.draftEdit.recipients,
        {
          id: dialogValue.id,
          givenName: dialogValue.givenName,
          familyName: dialogValue.familyName,
          emailAddress: dialogValue.emailAddress,
        },
      ],
      snippet: props.draftEdit.snippet,
      subject: props.draftEdit.subject,
      content: props.draftEdit.content,
    })

    handleClose()
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()
  }

  const validateEmailAddress = (value: string) => {
    const regex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]+$/i
    return !regex.test(value.replace(/\s/g, ''))
  }

  return (
    <Fragment>
      <FormControl
        sx={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onSubmit={handleFormSubmit}>
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
          }}>
          <RecipientsAutocomplete
            openDialogOpen={openDialogOpen}
            setDialogValue={setDialogValue}
            label={'To'}
            sx={props.sx}
            draftEdit={props.draftEdit}
          />
          {!isVisibleCc || !isVisibleBcc ? (
            <Box
              sx={{
                ...props.sx,
                paddingLeft: '8px',
                display: 'flex',
                flexDirection: 'column',
              }}>
              {!isVisibleCc ? (
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    width: '2.5em',
                    color: colors.grey[500],
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() => onShowCC(!isVisibleCc)}>
                  Cc
                </Box>
              ) : (
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    width: '2.5em',
                  }}></Box>
              )}
              {!isVisibleBcc ? (
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    width: '2.5em',
                    color: colors.grey[500],
                    cursor: 'pointer',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                  onClick={() => onShowBcc(!isVisibleBcc)}>
                  Bcc
                </Box>
              ) : (
                <Box
                  component="span"
                  sx={{
                    flex: 1,
                    width: '2.5em',
                  }}></Box>
              )}
            </Box>
          ) : null}
        </Box>
        {isVisibleCc ? (
          <RecipientsAutocomplete
            openDialogOpen={openDialogOpen}
            setDialogValue={setDialogValue}
            label={'Cc'}
            sx={props.sx}
            draftEdit={props.draftEdit}
          />
        ) : null}
        {isVisibleBcc ? (
          <RecipientsAutocomplete
            openDialogOpen={openDialogOpen}
            setDialogValue={setDialogValue}
            label={'Bcc'}
            sx={props.sx}
            draftEdit={props.draftEdit}
          />
        ) : null}
      </FormControl>
      <Dialog sx={{ zIndex: 9999 }} open={openDialog} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add a new contact</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              id="emailAddress"
              value={dialogValue?.emailAddress}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  emailAddress: event.target.value,
                })
              }
              required
              label="Email address"
              type="email"
              autoComplete="email"
              variant="standard"
              error={validateEmailAddress(dialogValue?.emailAddress)}
            />
            <br />
            <TextField
              autoFocus
              margin="dense"
              id="givenName"
              value={dialogValue?.givenName}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  givenName: event.target.value,
                })
              }
              label="Given name"
              type="text"
              variant="standard"
            />
            <TextField
              margin="dense"
              id="familyName"
              value={dialogValue?.familyName}
              onChange={(event) =>
                setDialogValue({
                  ...dialogValue,
                  familyName: event.target.value,
                })
              }
              label="Family name"
              type="text"
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Add</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Fragment>
  )
}
