import { useCallback } from 'react'
import Fab from '@mui/material/Fab'
import AddIcon from '@mui/icons-material/Add'

import useFedemailAPI from '../../api/FedemailAPI'

const fabStyle = {
  position: 'fixed',
  right: 24,
  bottom: 24,
}

const NewMailButton = ({ classes }: any) => {
  const { createDraft } = useFedemailAPI()

  const createNewDraftEdit = useCallback(
    () =>
      createDraft({
        subject: '',
        content: '',
        receipients: '',
      }),
    []
  )

  return (
    <div className={classes}>
      <Fab color="primary" sx={fabStyle} onClick={createNewDraftEdit}>
        <AddIcon />
      </Fab>
    </div>
  )
}

export default NewMailButton
