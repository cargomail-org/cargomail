import InboxIcon from '@mui/icons-material/Inbox'
import DeleteIcon from '@mui/icons-material/Delete'
import CheckIcon from '@mui/icons-material/Check'
import ModeEditIcon from '@mui/icons-material/ModeEdit'

import { accordionSummaryClasses, Box, colors } from '@mui/material'

const isTouchDevice = () => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

const ActionsBox = ({ actions, handlers }: any) => (
  <Box
    className="actionsBox"
    sx={{
      padding: '0 !important',
      display: isTouchDevice() ? 'block' : 'none',
      // '.MuiAccordionSummary-root:hover &': {
      [`.${accordionSummaryClasses.root}:hover &`]: {
        display: 'block',
      },
    }}>
    {actions.backToInbox && (
      <InboxIcon
        sx={{
          color: colors.blue[500],
          margin: '0 4px -5px',
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
          margin: '0 4px -5px',
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
    {actions.editDraft && (
      <ModeEditIcon
        sx={{
          margin: '0 4px -5px',
          fontSize: '1.25rem',
          cursor: 'pointer',
          opacity: 0.78,
          '&:hover': {
            opacity: 1,
          },
        }}
        onClick={handlers.editDraft}
      />
    )}
    {actions.trash && (
      <DeleteIcon
        sx={{
          margin: '0 4px -5px',
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
          margin: '0 4px -5px',
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
  </Box>
)

export default ActionsBox
