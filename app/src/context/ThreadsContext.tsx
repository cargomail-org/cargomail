import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/actionCreator'

const actions = {
  listThreads: 'LIST_THREADS',
  addMessageLabel: 'ADD_MESSAGE_LABEL',
  removeMessage: 'REMOVE_MESSAGE',
  removeThread: 'REMOVE_THREAD',
  removeMessageLabel: 'REMOVE_MESSAGE_LABEL',
  removeThreadLabel: 'REMOVE_THREAD_LABEL',
  addThreadLabel: 'ADD_THREAD_LABEL',
}

const reducer = (state: any, action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.listThreads:
      return payload
    case actions.addMessageLabel: {
      const { threadId, id, label } = payload
      const index = state.findIndex((thread: any) => thread.id === threadId)
      const thread = state[index]
      const updated = {
        ...thread,
        messages: thread.messages.map((message: any) =>
          message.id !== id
            ? message
            : {
                ...message,
                labelIds: [...message.labelIds, label],
              }
        ),
      }
      return [...state.slice(0, index), updated, ...state.slice(index + 1)]
    }
    case actions.removeMessageLabel: {
      const { threadId, id, label } = payload
      const index = state.findIndex((thread: any) => thread.id === threadId)
      const thread = state[index]
      const updated = {
        ...thread,
        messages: thread.messages.map((message: any) =>
          message.id !== id
            ? message
            : {
                ...message,
                labelIds: message.labelIds.filter((labelId: any) => labelId !== label),
              }
        ),
      }
      return [...state.slice(0, index), updated, ...state.slice(index + 1)]
    }

    case actions.removeThreadLabel: {
      const { id, label } = payload
      const index = state.findIndex((thread: any) => thread.id === id)
      const thread = state[index]
      const updated = {
        ...thread,
        messages: thread.messages.map((message: any) => ({
          ...message,
          labelIds: message.labelIds.filter((labelId: any) => labelId !== label),
        })),
      }
      return [...state.slice(0, index), updated, ...state.slice(index + 1)]
    }

    case actions.addThreadLabel: {
      const { id, label } = payload
      const index = state.findIndex((thread: any) => thread.id === id)
      const thread = state[index]
      const updated = {
        ...thread,
        messages: thread.messages.map((message: any) => ({
          ...message,
          labelIds: [...message.labelIds, label],
        })),
      }
      return [...state.slice(0, index), updated, ...state.slice(index + 1)]
    }

    case actions.removeMessage: {
      const { threadId, id } = payload
      const index = state.findIndex((thread: any) => thread.id === threadId)
      const thread = state[index]
      const updated = {
        ...thread,
        messages: thread.messages.filter((message: any) => message.id !== id),
      }
      return [...state.slice(0, index), updated, ...state.slice(index + 1)]
    }
    case actions.removeThread: {
      const id = payload
      const index = state.findIndex((thread: any) => thread.id === id)
      return [...state.slice(0, index), ...state.slice(index + 1)]
    }

    default:
      return state
  }
}

export interface IThreadsProvider {
  children: ReactNode
}

export const ThreadsContext = createContext<any>({
  draftsAll: { drafts: [] },
  listThreads: () => null,
  removeMessage: () => null,
  removeThread: () => null,
  removeMessageLabel: () => null,
  addMessageLabel: () => null,
  removeThreadLabel: () => null,
  addThreadLabel: () => null,
})

export const ThreadsProvider = (props: any) => {
  const [threads, dispatch] = useReducer(reducer, [])

  const listThreads = useActionCreator(actions.listThreads, dispatch)
  const removeMessage = useActionCreator(actions.removeMessage, dispatch)
  const removeThread = useActionCreator(actions.removeThread, dispatch)
  const removeMessageLabel = useActionCreator(actions.removeMessageLabel, dispatch)
  const addMessageLabel = useActionCreator(actions.addMessageLabel, dispatch)
  const removeThreadLabel = useActionCreator(actions.removeThreadLabel, dispatch)
  const addThreadLabel = useActionCreator(actions.addThreadLabel, dispatch)

  return (
    <ThreadsContext.Provider
      value={{
        threads,
        listThreads,
        addMessageLabel,
        removeMessageLabel,
        removeThreadLabel,
        removeMessage,
        removeThread,
        addThreadLabel,
      }}>
      {props.children}
    </ThreadsContext.Provider>
  )
}
