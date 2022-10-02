import { CircularProgress, TextField } from '@mui/material'
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete'
import { FC, Fragment, useContext, useEffect, useState } from 'react'
import parse from 'autosuggest-highlight/parse'
import match from 'autosuggest-highlight/match'
import useFedemailAPI from '../../api/FedemailAPI'
import { ContactsContext, IContact } from '../../context/ContactsContext'
import { IDraftEdit } from '../../context/DraftsContext'
import usePeopleAPI from '../../api/PeopleAPI'

const filter = createFilterOptions({
  matchFrom: 'start',
  stringify: (option: IContact) => option.emailAddress,
})

export type RecipientsAutocompleteProps = {
  openDialogOpen: Function
  setDialogValue: Function
  sx: Object
  label: string
  initialValue?: any
  draftEdit: IDraftEdit
}

export const RecipientsAutocomplete: FC<RecipientsAutocompleteProps> = (props) => {
  const [open, setOpen] = useState(false) // if dropdown open?
  const { contacts } = useContext(ContactsContext)

  const { draftsUpdate } = useFedemailAPI()

  const { contactsList } = usePeopleAPI()

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

  return (
    <Autocomplete
      sx={{ ...props.sx, flex: 1 }}
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
            props.openDialogOpen(true)
            props.setDialogValue({
              id: crypto.randomUUID(),
              givenName: '',
              familyName: '',
              emailAddress: newValue,
            })
          })
        } else if (newValue.slice(-1)[0] && newValue.slice(-1)[0].inputValue) {
          props.openDialogOpen(true)
          const newContact = (newValue.slice(-1)[0].inputValue || '').split(/\s+/)
          props.setDialogValue({
            id: crypto.randomUUID(),
            givenName: newContact[1] || '', // newGivenName
            familyName: newContact[2] || '', // newFamilyName
            emailAddress: newContact[0] || '', // newEmailAddress
          })
        } else {
          draftsUpdate({
            id: props.draftEdit.id,
            mimeType: props.draftEdit.mimeType,
            sender: props.draftEdit.sender,
            recipients: newValue as any,
            snippet: props.draftEdit.snippet,
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
          label={props.label}
        />
      )}
    />
  )
}
