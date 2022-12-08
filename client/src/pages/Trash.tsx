import { FC } from 'react'
import { Navigation } from '../components/page-layout'
import useProcessedThreads from '../utils/hooks/processedThreads'
import Thread from '../components/mail/Thread'
import { Box } from '@mui/material'
// import useEmailAPI from '../api/EmailAPI'

export const Trash: FC = () => {
  const processed = useProcessedThreads({ includes: ['TRASH'], aggregate: false })
  // const { threadsList } = useEmailAPI()

  return (
    <Navigation>
      <Box sx={{ marginTop: '28px', marginLeft: '12px', marginRight: '12px' }}>
        {processed.map((thread: any) => (
          <Thread
            key={thread.id}
            actions={{
              backToInbox: true,
              permanentDelete: true,
            }}
            {...thread}
          />
        ))}
      </Box>
    </Navigation>
  )
}
