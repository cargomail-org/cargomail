import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import parse from 'autosuggest-highlight/parse'
import match from 'autosuggest-highlight/match'
import Button from '@mui/material/Button'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import { FC, FormEvent, Fragment, ReactNode, useContext, useEffect, useState } from 'react'
import { ContactsContext, IContact } from '../../context/ContactsContext'
import usePeopleAPI from '../../api/PeopleAPI'
import { IDraftEdit } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'

const filter = createFilterOptions({
  matchFrom: 'start',
  stringify: (option: IContact) => option.emailAddress,
})

export type RecipientsSelectProps = {
  children?: ReactNode
  sx: Object
  initialValue?: any
  draftEdit: IDraftEdit
}

export const RecipientsSelect: FC<RecipientsSelectProps> = (props) => {
  const [open, setOpen] = useState(false) // if dropdown open?

  const { draftsUpdate } = useFedemailAPI()
  const [openDialog, openDialogOpen] = useState(false)

  const { contactsList } = usePeopleAPI()
  const { contacts } = useContext(ContactsContext)
  const { contactsCreate } = usePeopleAPI()

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setLoading(true)
    }
  }, [open])

  useEffect(() => {
    let active = true

    if (!loading) {
      return undefined
    }

    const fetchContactsList = async () => {
      try {
        await contactsList()
        if (active) {
          setLoading(false)
        }
      } catch (e) {
        setLoading(false)
      }
    }

    fetchContactsList()

    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

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
      <form onSubmit={handleFormSubmit}>
        <Autocomplete
          sx={props.sx}
          disablePortal
          open={open}
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          loading={loading}
          multiple
          value={props.draftEdit.recipients}
          isOptionEqualToValue={(option, value) => option.emailAddress === value.emailAddress}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              // timeout to avoid instant validation of the dialog's form.
              setTimeout(() => {
                openDialogOpen(true)
                setDialogValue({
                  id: crypto.randomUUID(),
                  givenName: '',
                  familyName: '',
                  emailAddress: newValue,
                })
              })
            } else if (newValue.slice(-1)[0] && newValue.slice(-1)[0].inputValue) {
              openDialogOpen(true)
              const newContact = (newValue.slice(-1)[0].inputValue || '').split(/\s+/)
              setDialogValue({
                id: crypto.randomUUID(),
                givenName: newContact[1] || '', // newGivenName
                familyName: newContact[2] || '', // newFamilyName
                emailAddress: newContact[0] || '', // newEmailAddress
              })
            } else {
              draftsUpdate({
                id: props.draftEdit.id,
                sender: props.draftEdit.sender,
                recipients: newValue as any,
                subject: props.draftEdit.subject,
                content: props.draftEdit.content,
              })
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params)
            const isExisting = options.some((option) => params.inputValue.split(' ')[0] === option.emailAddress)
            if (params.inputValue.split(' ')[0] !== '' && !isExisting) {
              filtered.push({
                inputValue: params.inputValue,
                id: '',
                givenName: '',
                familyName: '',
                emailAddress: `Add "${params.inputValue}" to Contacts`,
              })
            }

            return filtered
          }}
          id="recipients-select"
          // options={[...contacts, ...props.draftEdit.recipients]}
          options={contacts.concat(
            props.draftEdit.recipients.filter(
              ({ emailAddress }: IContact) => !contacts.find((f) => f.emailAddress === emailAddress)
            )
          )}
          getOptionLabel={(option) => {
            if (typeof option === 'string') {
              return option
            }
            if (option.inputValue) {
              return option.inputValue
            }
            return option.emailAddress
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          renderOption={(props, option, { inputValue }) => {
            const matches = match(option.emailAddress, inputValue.split(' ')[0])
            const parts = parse(option.emailAddress, matches)

            return (
              <li {...props}>
                <div>
                  {parts.map((part, index) => (
                    <span
                      key={index}
                      style={{
                        color: part.highlight ? 'green' : 'inherit',
                        fontWeight: part.highlight ? 700 : 400,
                      }}>
                      {part.text}
                    </span>
                  ))}
                </div>
              </li>
            )
          }}
          renderInput={(params) => (
            <TextField
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&.Mui-focused': {
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                },
              }}
              {...params}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <Fragment>
                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </Fragment>
                ),
              }}
              label="Recipients"
            />
          )}
        />
      </form>
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
