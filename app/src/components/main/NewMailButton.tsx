import { useCallback } from 'react'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'

import useEmailAPI from '../../api/EmailAPI'

const fabStyle = {
  position: 'fixed',
  right: 24,
  bottom: 24,
}

const NewMailButton = () => {
  const { draftsCreate } = useEmailAPI()

  const createNewDraftEdit = useCallback(
    () =>
      draftsCreate({
        id: '',
        mimeType: 'application/json', // only application/json draft is supported
        sender: '',
        to: [],
        cc: [],
        bcc: [],
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
