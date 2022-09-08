import { Box } from '@mui/material'
import { FC } from 'react'
import { MessagePart } from '../../api/generated/proto/fedemail/v1/fedemail'

export type DraftMessageProps = {
  id: string
  snippet?: string
  payload?: MessagePart
  threadId?: string
  timelineId?: string
}

export const Draft: FC<DraftMessageProps> = ({ id, snippet, payload, threadId }) => {
  return (
    <Box>
      {id}
      {snippet}
    </Box>
  )
}
