import TextField from '@mui/material/TextField'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import parse from 'autosuggest-highlight/parse'
import match from 'autosuggest-highlight/match'
import Button from '@mui/material/Button'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import { FC, FormEvent, Fragment, ReactNode, useContext, useEffect, useState } from 'react'
import { ContactsContext, IContact } from '../../context/ContactsContext'

const filter = createFilterOptions({
  matchFrom: 'start',
  stringify: (option: IContact) => option.emailAddress,
})

export type RecipientsSelectProps = {
  children?: ReactNode
  sx: Object
}

export const RecipientsSelect: FC<RecipientsSelectProps> = (props) => {
  const [open, setOpen] = useState(false) // if dropdown open?

  const [value, setValue] = useState<IContact[]>()
  const [openDialog, openDialogOpen] = useState(false)

  const [data, setData] = useState<IContact[] | null>()

  const loading = open && data?.length === 0 // is it still loading

  const { contacts } = useContext(ContactsContext)

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
    // setValue([
    //   ...value,
    //   {
    //     givenName: dialogValue?.givenName,
    //     familyName: dialogValue?.familyName,
    //     emailAddress: dialogValue?.emailAddress,
    //   },
    // ])

    // setData([
    //   ...data,
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
              setValue(newValue)
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
                emailAddress: `Add "${params.inputValue}" Category`,
              })
            }

            return filtered
          }}
          id="free-solo-dialog-demo"
          options={contacts}
          getOptionLabel={(option) => {
            // e.g value selected with enter, right from the input
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
                        color: part.highlight ? 'red' : 'inherit',
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
              {...params}
              variant="outlined"
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
        {/* <Button type="submit">Submit</Button> */}
      </form>
      {/* <Dialog open={openDialog} onClose={handleClose}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add a new contact</DialogTitle>
          <DialogContent>
            <DialogContentText>Please add a new contact!</DialogContentText>
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
              label="givenName"
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
              label="familyName"
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
              label="emailAddress"
              type="text"
              variant="standard"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Add</Button>
          </DialogActions>
        </form>
      </Dialog> */}
    </Fragment>
  )
}
