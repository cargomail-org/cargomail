import { Box, Hidden } from '@mui/material'
import { Draft } from '../../api/generated/proto/fedemail/v1/fedemail'
import EditDraft from './EditDraft'

interface Props {
  drafts: Draft[]
}

const DraftsContainer = ({ drafts }: Props) => (
  <Box>
    <Hidden smDown>
      <Box sx={{ position: 'fixed', zIndex: 999999, right: 100, bottom: 0, display: 'flex' }}>
        {drafts && Object.entries(drafts).map(([id, draft]) => <EditDraft key={id} {...draft} />)}
      </Box>
    </Hidden>
    <Hidden smUp>
      <Box sx={{ position: 'fixed', right: 0, bottom: 0, display: 'flex' }}>
        {drafts && Object.entries(drafts).map(([id, draft]) => <EditDraft key={id} {...draft} />)}
      </Box>
    </Hidden>
  </Box>
)

export default DraftsContainer
