import InboxIcon from '@mui/icons-material/Inbox'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'

import { colors } from '@mui/material'

const Actions = ({ actions, handlers }: any) => (
  <div>
    {actions.backToInbox && (
      <InboxIcon
        sx={{
          color: colors.blue[500],
          margin: '0 4px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          opacity: 0.78,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={handlers.backToInbox}
      />
    )}
    {actions.markAsDone && (
      <CheckIcon
        sx={{
          color: colors.green[600],
          margin: '0 4px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          opacity: 0.78,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={handlers.markAsDone}
      />
    )}
    {actions.trash && (
      <DeleteIcon
        sx={{
          margin: '0 4px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          opacity: 0.78,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={handlers.trash}
      />
    )}
    {actions.permanentDelete && (
      <DeleteIcon
        sx={{
          margin: '0 4px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          opacity: 0.78,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={handlers.permanentDelete}
      />
    )}
  </div>
)

export default Actions
