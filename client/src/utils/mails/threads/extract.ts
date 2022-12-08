import parsePayload from '../parsePayload'

const extract = ({ id, messages }: any) => ({
  id,
  messages: messages.map((message: any) => ({
    id: message.id,
    threadId: message.threadId,
    internalDate: message.internalDate,
    snippet: message.snippet,
    labelIds: message.labelIds,
    unread: message.labelIds.includes('UNREAD'),
    ...parsePayload(message),
  })),
  hasUnread: messages.map(({ labelIds }: any) => labelIds).some((ids: any) => ids.includes('UNREAD')),
})

export default extract
