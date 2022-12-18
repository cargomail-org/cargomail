import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/actionCreator'

const actions = {
  updateAttachments: 'UPDATE_ATTACHMENTS',
  updateProgress: 'UPDATE_PROGRESS',
  addAttachment: 'ADD_ATTACHMENT',
}

const reducer = (state: IAttachment[], action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateAttachments:
      return payload
    case actions.updateProgress: {
      const index = state.findIndex((attachment: IAttachment) => attachment.id === payload.id)
      return [...state.slice(0, index), payload, ...state.slice(index + 1)]
    }
    case actions.addAttachment:
      return [...state, payload]
    default:
      return state
  }
}

export interface IAttachmentProvider {
  children: ReactNode
}

export interface IAttachment {
  id: string
  upload: any
  progress: number
}

export interface IAttachmentContext {
  attachments: IAttachment[]
  updateAttachments: (attachments: IAttachment[]) => void
  updateProgress: (attachment: IAttachment) => void
  addAttachment: (attachment: IAttachment) => void
}

export const AttachmentsContext = createContext<IAttachmentContext>({
  attachments: [] as IAttachment[],
  updateAttachments: () => null,
  updateProgress: () => null,
  addAttachment: () => null,
})

export const AttachmentsProvider = (props: any) => {
  const [attachments, dispatch] = useReducer(reducer, [] as IAttachment[])

  const updateAttachments = useActionCreator(actions.updateAttachments, dispatch)
  const updateProgress = useActionCreator(actions.updateProgress, dispatch)
  const addAttachment = useActionCreator(actions.addAttachment, dispatch)

  return (
    <AttachmentsContext.Provider value={{ attachments, updateAttachments, updateProgress, addAttachment }}>
      {props.children}
    </AttachmentsContext.Provider>
  )
}
