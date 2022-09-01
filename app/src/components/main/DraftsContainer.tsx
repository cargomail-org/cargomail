import { Draft } from '../../api/generated/proto/fedemail/v1/fedemail'
import EditDraft from './EditDraft'

const styles = () => ({
  root: {
    position: 'fixed',
    right: 100,
    bottom: 0,
    display: 'flex',
  },
})

interface Props {
  drafts: Draft[]
}

const DraftsContainer = ({ drafts }: Props) => (
  <div>{drafts && Object.entries(drafts).map(([id, draft]) => <EditDraft key={id} {...draft} />)}</div>
)

export default DraftsContainer
