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
  const { createDraft } = useFedemailAPI()

  const createNewDraftEdit = useCallback(
    () =>
      createDraft({
        subject: '',
        content: '',
        receipients: '',
      }),
    []  // eslint-disable-line
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
