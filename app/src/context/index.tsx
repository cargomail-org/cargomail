import { LabelsProvider } from './LabelsContext'
import { ContactsProvider } from './ContactsContext'
import { DraftsProvider } from './DraftsContext'

export { LabelsContext } from './LabelsContext'
export { ContactsContext } from './ContactsContext'
export { DraftsContext } from './DraftsContext'

const AllContextProviders = ({ children }: any) => {
  return (
    <DraftsProvider>
      <ContactsProvider>
        <LabelsProvider>{children}</LabelsProvider>
      </ContactsProvider>
    </DraftsProvider>
  )
}
export default AllContextProviders
