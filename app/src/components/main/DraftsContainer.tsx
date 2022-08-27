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

const DraftsContainer = ({ classes }: any, drafts: Draft[]) => (
  <div className={classes}>
    {Object.entries(drafts).map(([id, draft]) => (
      <EditDraft key={id} {...draft} />
    ))}
  </div>
)

export default DraftsContainer
