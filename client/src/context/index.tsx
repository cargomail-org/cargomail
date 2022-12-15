import { LabelsProvider } from './LabelsContext'
import { ContactsProvider } from './ContactsContext'
import { DraftsProvider } from './DraftsContext'
import { ThreadsProvider } from './ThreadsContext'
import { AttachmentsProvider } from './AttachmentsContext'

export { LabelsContext } from './LabelsContext'
export { ContactsContext } from './ContactsContext'
export { DraftsContext } from './DraftsContext'
export { ThreadsContext } from './ThreadsContext'
export { AttachmentsContext } from './AttachmentsContext'

const AllContextProviders = ({ children }: any) => {
  return (
    <AttachmentsProvider>
      <ThreadsProvider>
        <DraftsProvider>
          <ContactsProvider>
            <LabelsProvider>{children}</LabelsProvider>
          </ContactsProvider>
        </DraftsProvider>
      </ThreadsProvider>
    </AttachmentsProvider>
  )
}
export default AllContextProviders
