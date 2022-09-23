import { FC } from 'react'
import { Navigation } from '../components/page-layout'
import useProcessedThreads from '../utils/hooks/processedThreads'
import Preview from '../components/mail/Preview'
// import useFedemailAPI from '../api/FedemailAPI'

export const Done: FC = () => {
  const processed = useProcessedThreads({ excludes: ['INBOX', 'TRASH', 'SPAM'] })
  // const { threadsList } = useFedemailAPI()

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
