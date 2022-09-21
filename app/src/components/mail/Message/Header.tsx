import { Avatar, Box } from '@mui/material'

import Actions from './Actions'

const Header = ({ snippet, expanded, actions, name, onClick, handlers }: any) => (
  <Box
    sx={{
      display: 'flex',
      cursor: 'pointer',
      alignItems: 'flex-center',
    }}
    onClick={onClick}
    onKeyUp={onClick}
    role="button"
    tabIndex={0}>
    <Avatar
      alt=""
      sx={{
        height: 32,
        width: 32,
        margin: '4px 12px',
      }}>
      {name[0]}
    </Avatar>
    <Box
      sx={{
        padding: 4,
        width: 'calc(100% - 32px - 12px * 2)',
      }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
        }}>
        <strong>{name}</strong>
        <Actions actions={actions} handlers={handlers} />
      </Box>
      {expanded ? null : (
        <Box
          sx={{
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            fontSize: 14,
            // width: 'calc(70vw - 32px - 12px * 2 - 20px)',
          }}>
          {snippet}
        </Box>
      )}
    </Box>
  </Box>
)

export default Header
