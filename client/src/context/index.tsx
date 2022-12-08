import { LabelsProvider } from './LabelsContext'
import { ContactsProvider } from './ContactsContext'
import { DraftsProvider } from './DraftsContext'
import { ThreadsProvider } from './ThreadsContext'

export { LabelsContext } from './LabelsContext'
export { ContactsContext } from './ContactsContext'
export { DraftsContext } from './DraftsContext'
export { ThreadsContext } from './ThreadsContext'

const AllContextProviders = ({ children }: any) => {
  return (
    <ThreadsProvider>
      <DraftsProvider>
        <ContactsProvider>
          <LabelsProvider>{children}</LabelsProvider>
        </ContactsProvider>
      </DraftsProvider>
    </ThreadsProvider>
  )
}
export default AllContextProviders
