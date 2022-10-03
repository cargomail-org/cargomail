import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import { FC, FormEvent, Fragment, ReactNode, useEffect, useState } from 'react'
import { RecipientsAutocomplete } from './RecipientsAutocomplete'
import { IContact } from '../../context/ContactsContext'
import usePeopleAPI from '../../api/PeopleAPI'
import { IDraftEdit, RecipientType } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'
import { Box, colors, FormControl } from '@mui/material'

export type RecipientsSelectProps = {
  children?: ReactNode
  sx: Object
  initialValue?: any
  draftEdit: IDraftEdit
}
export interface IDialogState {
  opened: boolean
  recipientType?: RecipientType
}

export const RecipientsSelect: FC<RecipientsSelectProps> = (props) => {
  const [isVisibleCc, showCc] = useState(false)
  const [isVisibleBcc, showBcc] = useState(false)

  const { draftsUpdate } = useFedemailAPI()
  const { contactsCreate } = usePeopleAPI()

  const initialDialogState: IDialogState = { opened: false }
  const [openDialog, openDialogOpen] = useState(initialDialogState)

  const [dialogValue, setDialogValue] = useState<IContact>({
    id: '',
    givenName: '',
    familyName: '',
    emailAddress: '',
  })

  useEffect(() => {
    if (props.draftEdit.cc.length > 0) {
      showCc(true)
    }
    if (props.draftEdit.bcc.length > 0) {
      showBcc(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => {
    setDialogValue({
      id: '',
      givenName: '',
      familyName: '',
      emailAddress: '',
    })

    openDialogOpen({ opened: false })
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    await contactsCreate(dialogValue)

    draftsUpdate({
      id: props.draftEdit.id,
      mimeType: props.draftEdit.mimeType,
      sender: props.draftEdit.sender,
      to:
        openDialog.recipientType === RecipientType.To
          ? [
              ...props.draftEdit.to,
              {
                id: dialogValue.id,
                givenName: dialogValue.givenName,
                familyName: dialogValue.familyName,
                emailAddress: dialogValue.emailAddress,
              },
            ]
          : [...props.draftEdit.to],
      cc:
        openDialog.recipientType === RecipientType.Cc
          ? [
              ...props.draftEdit.cc,
              {
                id: dialogValue.id,
                givenName: dialogValue.givenName,
                familyName: dialogValue.familyName,
                emailAddress: dialogValue.emailAddress,
              },
            ]
          : [...props.draftEdit.cc],
      bcc:
        openDialog.recipientType === RecipientType.Bcc
          ? [
              ...props.draftEdit.bcc,
              {
                id: dialogValue.id,
                givenName: dialogValue.givenName,
                familyName: dialogValue.familyName,
                emailAddress: dialogValue.emailAddress,
              },
            ]
          : [...props.draftEdit.bcc],
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
            recipientType={RecipientType.To}
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
                  onClick={() => showCc(!isVisibleCc)}>
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
                  onClick={() => showBcc(!isVisibleBcc)}>
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
            recipientType={RecipientType.Cc}
            sx={props.sx}
            draftEdit={props.draftEdit}
          />
        ) : null}
        {isVisibleBcc ? (
          <RecipientsAutocomplete
            openDialogOpen={openDialogOpen}
            setDialogValue={setDialogValue}
            recipientType={RecipientType.Bcc}
            sx={props.sx}
            draftEdit={props.draftEdit}
          />
        ) : null}
      </FormControl>
      <Dialog sx={{ zIndex: 9999 }} open={openDialog.opened} onClose={handleClose}>
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
