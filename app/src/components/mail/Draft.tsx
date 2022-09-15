import { Box } from '@mui/material'
import { FC } from 'react'
import { MessagePart } from '../../api/generated/proto/fedemail/v1/fedemail'

export type DraftMessageProps = {
  draftId: string
  id?: string
  snippet?: string
  payload?: MessagePart
  threadId?: string
  historyId?: string
}

export const Draft: FC<DraftMessageProps> = ({ draftId, id, snippet, payload, threadId }) => {
  return (
    <Box>
      {draftId}/{id}
      <br />
      {snippet}
    </Box>
  )
}
