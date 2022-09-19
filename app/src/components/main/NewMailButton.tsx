import { useCallback } from 'react'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'

import useFedemailAPI from '../../api/FedemailAPI'

const fabStyle = {
  position: 'fixed',
  right: 24,
  bottom: 24,
}

const NewMailButton = () => {
  const { draftsCreate } = useFedemailAPI()

  const createNewDraftEdit = useCallback(
    () =>
      draftsCreate({
        id: '',
        mimeType: 'text/plain', // only text/plain draft is supported
        sender: '',
        recipients: [],
        snippet: '',
        subject: '',
        content: '',
      }),
    [] // eslint-disable-line
  )

  return (
    <div>
      <Fab color="primary" sx={fabStyle} onClick={createNewDraftEdit}>
        <AddIcon />
      </Fab>
    </div>
  )
}

export default NewMailButton
