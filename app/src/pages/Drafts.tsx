import { Box } from '@mui/material'
import { FC, useContext, useEffect } from 'react'
import useEmailAPI from '../api/EmailAPI'
import { Draft } from '../components/mail/Draft'
import { Navigation } from '../components/page-layout'
import { DraftsContext } from '../context/DraftsContext'

export const Drafts: FC = () => {
  const { draftsList } = useEmailAPI()
  const { draftsAll } = useContext(DraftsContext)

  useEffect(() => {
    draftsList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Navigation>
      <Box
        sx={{
          width: 'auto',
          // maxWidth: 1200,
          marginTop: '28px',
          marginBottom: '0',
          marginLeft: '12px',
          marginRight: '12px',
        }}>
        {Object.values(draftsAll.drafts).map((draft) => (
          <Draft key={draft.id} draftId={draft.id} {...draft.message} />
        ))}
      </Box>
    </Navigation>
  )
}
