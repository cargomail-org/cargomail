import { Box } from '@mui/material'
import { Draft } from '../../api/generated/proto/fedemail/v1/fedemail'
import EditDraft from './EditDraft'

interface Props {
  drafts: Draft[]
}

const DraftsContainer = ({ drafts }: Props) => (
  <Box sx={{ position: 'fixed', zIndex: { xs: 0, sm: 99999 }, right: { xs: 0, sm: 100 }, bottom: 0, display: 'flex' }}>
    {drafts && Object.entries(drafts).map(([id, draft]) => <EditDraft key={id} {...draft} />)}
  </Box>
)

export default DraftsContainer
