import { FC, useContext, useEffect } from 'react'
import useFedemailAPI from '../api/FedemailAPI'
import { Draft } from '../components/mail/Draft'
import { Navigation } from '../components/page-layout'
import { DraftsContext } from '../context/DraftsContext'

export const Drafts: FC = () => {
  const { draftsList } = useFedemailAPI()
  const { draftsAll } = useContext(DraftsContext)

  useEffect(() => {
    draftsList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Navigation>
      {Object.values(draftsAll.drafts).map((draft) => (
        <Draft key={draft.id} draftId={draft.id} {...draft.message} />
      ))}
    </Navigation>
  )
}
