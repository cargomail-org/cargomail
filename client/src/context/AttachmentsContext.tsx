import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/actionCreator'

const actions = {
  updateAttachment: 'UPDATE_ATTACHMENT',
  updateProgress: 'UPDATE_PROGRESS',
  addAttachment: 'ADD_ATTACHMENT',
}

const reducer = (state: IAttachment[], action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateAttachment: {
      const index = state.findIndex((attachment: IAttachment) => attachment.id === payload.id)
      return [...state.slice(0, index), payload, ...state.slice(index + 1)]
    }
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
  downloadUrl: string | null
  sha256sum: string | null
}

export interface IAttachmentContext {
  attachments: IAttachment[]
  updateAttachment: (attachment: IAttachment) => void
  updateProgress: (attachment: IAttachment) => void
  addAttachment: (attachment: IAttachment) => void
}

export const AttachmentsContext = createContext<IAttachmentContext>({
  attachments: [] as IAttachment[],
  updateAttachment: () => null,
  updateProgress: () => null,
  addAttachment: () => null,
})

export const AttachmentsProvider = (props: any) => {
  const [attachments, dispatch] = useReducer(reducer, [] as IAttachment[])

  const updateAttachment = useActionCreator(actions.updateAttachment, dispatch)
  const updateProgress = useActionCreator(actions.updateProgress, dispatch)
  const addAttachment = useActionCreator(actions.addAttachment, dispatch)

  return (
    <AttachmentsContext.Provider value={{ attachments, updateAttachment, updateProgress, addAttachment }}>
      {props.children}
    </AttachmentsContext.Provider>
  )
}
