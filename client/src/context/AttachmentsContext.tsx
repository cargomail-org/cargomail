import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/actionCreator'

const actions = {
  updateAttachments: 'UPDATE_ATTACHMENTS',
  addAttachment: 'ADD_ATTACHMENT',
}

const reducer = (state: IAttachment[], action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateAttachments:
      return payload
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
  uploadURL: string
  fileName: string
  fileType: string
}

export interface IAttachmentContext {
  attachments: IAttachment[]
  updateAttachments: (attachments: IAttachment[]) => void
  addAttachment: (attachment: IAttachment) => void
}

export const AttachmentsContext = createContext<IAttachmentContext>({
  attachments: [] as IAttachment[],
  updateAttachments: () => null,
  addAttachment: () => null,
})

export const AttachmentsProvider = (props: any) => {
  const [attachments, dispatch] = useReducer(reducer, [] as IAttachment[])

  const updateAttachments = useActionCreator(actions.updateAttachments, dispatch)
  const addAttachment = useActionCreator(actions.addAttachment, dispatch)

  return (
    <AttachmentsContext.Provider value={{ attachments, updateAttachments, addAttachment }}>
      {props.children}
    </AttachmentsContext.Provider>
  )
}
