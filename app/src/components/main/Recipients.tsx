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

const filter = createFilterOptions({
  matchFrom: 'start',
  stringify: (option: IContact) => option.emailAddress,
})

export type RecipientsSelectProps = {
  children?: ReactNode
  sx: Object
  initialValue?: any
}

export const RecipientsSelect: FC<RecipientsSelectProps> = (props) => {
  const [open, setOpen] = useState(false) // if dropdown open?

  const [value, setValue] = useState([])
  const [openDialog, openDialogOpen] = useState(false)

  const { contactsList } = usePeopleAPI()

  const { contacts } = useContext(ContactsContext)

  const loading = open && contacts.length === 0 // is it still loading

  useEffect(() => {
    let active = true

    if (!loading) {
      return undefined
    }

    if (active) {
      contactsList()
    }

    return () => {
      active = false
    }
  }, [contacts, contactsList, loading])

  const [dialogValue, setDialogValue] = useState<IContact>({
    givenName: '',
    familyName: '',
    emailAddress: '',
  })

  const handleClose = () => {
    setDialogValue({
      givenName: '',
      familyName: '',
      emailAddress: '',
    })

    openDialogOpen(false)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    setValue([
      ...value,
      {
        givenName: dialogValue?.givenName,
        familyName: dialogValue?.familyName,
        emailAddress: dialogValue?.emailAddress,
      } as never,
    ])

    // setContacts([
    //   ...contacts,
    //   {
    //     givenName: dialogValue?.givenName,
    //     familyName: dialogValue?.familyName,
    //     emailAddress: dialogValue?.emailAddress,
    //   },
    // ])

    handleClose()
  }

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault()
    console.log(value)
  }

  return (
    <Fragment>
      <form onSubmit={handleFormSubmit}>
        <Autocomplete
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
          value={value}
          isOptionEqualToValue={(option, value) => option.emailAddress === value.emailAddress}
          onChange={(event, newValue) => {
            if (typeof newValue === 'string') {
              // timeout to avoid instant validation of the dialog's form.
              setTimeout(() => {
                openDialogOpen(true)
                setDialogValue({
                  givenName: '',
                  familyName: '',
                  emailAddress: newValue,
                })
              })
            } else if (newValue.slice(-1)[0] && newValue.slice(-1)[0].inputValue) {
              openDialogOpen(true)
              setDialogValue({
                givenName: '',
                familyName: '',
                emailAddress: newValue.slice(-1)[0].inputValue || '',
              })
            } else {
              setValue(newValue as any)
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params)
            const isExisting = options.some((option) => params.inputValue === option.emailAddress)
            if (params.inputValue !== '' && !isExisting) {
              filtered.push({
                inputValue: params.inputValue,
                givenName: '',
                familyName: '',
                emailAddress: `Add "${params.inputValue}" to Contacts`,
              })
            }

            return filtered
          }}
          id="recipients-select"
          options={contacts}
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
            const matches = match(option.emailAddress, inputValue)
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
          sx={props.sx}
        />
      </form>
      <Dialog sx={{ zIndex: 99999 }} open={openDialog} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add a new contact</DialogTitle>
          <DialogContent>
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
              label="Email address"
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
