import { useCallback } from 'react'
import RefreshIcon from '@mui/icons-material/Refresh'
import { Avatar, Box, IconButton } from '@mui/material'
import useEmailAPI from '../../api/EmailAPI'
import { useOidc } from '@axa-fr/react-oidc'
import usePeopleAPI from '../../api/PeopleAPI'

const ReloadButton = () => {
  const { isAuthenticated } = useOidc()
  const { labelsList, threadsList, draftsList } = useEmailAPI()
  const { contactsList } = usePeopleAPI()

  const reloadData = useCallback(
    () => {
      if (isAuthenticated) {
        labelsList()
        contactsList()
        threadsList()
        draftsList()
      }
    },
    [] // eslint-disable-line
  )

  return (
    <Box onClick={reloadData}>
      <IconButton disabled={!isAuthenticated}>
        <Avatar
          sx={{
            width: 30,
            height: 30,
            bgcolor: '#013d6e',
            '&:hover': {
              bgcolor: '#002b4f',
            },
          }}>
          <RefreshIcon />
        </Avatar>
      </IconButton>
    </Box>
  )
}

export default ReloadButton
