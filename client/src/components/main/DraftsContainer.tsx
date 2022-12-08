import { Box } from '@mui/material'
import { IDraftEdit } from '../../context/DraftsContext'
import EditDraft from './EditDraft'

interface Props {
  drafts: IDraftEdit[]
}

const DraftsContainer = ({ drafts }: Props) => (
  <Box
    sx={{
      position: 'fixed',
      right: { xs: 0, sm: 98 },
      bottom: 0,
      display: 'flex',
    }}>
    {drafts && Object.entries(drafts).map(([id, draft]) => <EditDraft key={id} draftEdit={draft} />)}
  </Box>
)

export default DraftsContainer
