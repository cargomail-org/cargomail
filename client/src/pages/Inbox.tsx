import { FC } from 'react'
import { Navigation } from '../components/page-layout'
import useProcessedThreads from '../utils/hooks/processedThreads'
import Preview from '../components/mail/Preview'
// import useEmailAPI from '../api/EmailAPI'

export const Index: FC = () => {
  const processed = useProcessedThreads({ includes: ['INBOX', 'SENT'] })
  // const { threadsList } = useEmailAPI()

  return (
    <Navigation>
      <div>
        {processed
          ? processed.map((clusters: any) => (
              <Preview
                key={clusters.label}
                clusters={clusters}
                actions={{
                  markAsDone: true,
                  trash: true,
                }}
              />
            ))
          : 'Loading...'}
      </div>
    </Navigation>
  )
}
