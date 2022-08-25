import { LabelsProvider } from './LabelsContext'

export { LabelsContext } from './LabelsContext'

const AllContextProviders = ({ children }: any) => {
  // Add additional context providers here
  return <LabelsProvider>{children}</LabelsProvider>
}
export default AllContextProviders
