import { useState, useEffect, useContext, useCallback, useRef } from 'react'
import { Box, Card, CardContent, colors } from '@mui/material'

import { v1 as uuid } from 'uuid'

import { ThreadsContext } from '../../../context/ThreadsContext'
import useEmailAPI from '../../../api/EmailAPI'
import Header from './Header'
import Viewer from '../../editor/Viewer'

const Message = ({ threadId, id, from, snippet, content, mimeType, initialExpand, unread, actions }: any) => {
  const { addMessageLabel, removeMessageLabel } = useContext(ThreadsContext)
  const { modifyMessage, trashMessage, deleteMessage } = useEmailAPI()
  const [expanded, setExpanded] = useState(initialExpand)
  const scope = useRef(uuid())
  const backToInbox = useCallback(
    (e: any) => {
      addMessageLabel({ id, label: 'INBOX' })
      modifyMessage({ id, add: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )

  const markAsDone = useCallback(
    (e: any) => {
      removeMessageLabel({ threadId, id, label: 'INBOX' })
      modifyMessage({ id, remove: ['INBOX'] })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )

  const trash = useCallback(
    (e: any) => {
      trashMessage({ id, threadId })
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )
  const permanentDelete = useCallback(
    (e: any) => {
      deleteMessage(id)
      e.stopPropagation()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id]
  )

  useEffect(() => {
    if (expanded && unread) {
      modifyMessage({ id, remove: ['UNREAD'] })
      removeMessageLabel({ threadId, id, label: 'UNREAD' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread, expanded])

  return (
    <Card
      sx={{
        width: '100%',
        borderTop: `1px solid ${colors.grey[300]}`,
      }}>
      <div style={{ display: 'none' }}>{id}</div>
      <CardContent
        sx={{
          padding: '8px !important',
        }}>
        <Header
          expanded={expanded}
          onClick={() => setExpanded((exp: any) => !exp)}
          snippet={snippet}
          name={from.name}
          actions={actions}
          handlers={{
            backToInbox,
            markAsDone,
            trash,
            permanentDelete,
          }}
        />
        {expanded && (
          <Box
            id={scope.current}
            sx={{
              marginLeft: '12px',
              marginRight: '12px',
              paddingBottom: '8px',
            }}>
            <Viewer initialValue={content} mimeType={mimeType} />
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default Message
