import { createContext, ReactNode, useReducer } from 'react'
import { AttachmentNode } from '../components/editor/nodes/AttachmentNode'
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
      const index = state.findIndex((attachment: IAttachment) =>
        payload.uploadId ? attachment.uploadId === payload.uploadId : attachment.downloadUrl === payload.downloadUrl
      )
      const result = [...state.slice(0, index), payload, ...state.slice(index + 1)]
      // a hackish way to enable access to the state in the AttachmentNode class
      AttachmentNode.setAttachments(result)
      return result
    }
    case actions.updateProgress: {
      const index = state.findIndex((attachment: IAttachment) =>
        payload.uploadId ? attachment.uploadId === payload.uploadId : attachment.downloadUrl === payload.downloadUrl
      )
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

export enum ResumableState {
  None,
  Aborted,
  Resumed,
}

export interface IAttachment {
  nodesCount: number
  resumableState: ResumableState
  uploadId: string
  upload: any
  uploadProgress: number
  download: any
  downloadProgress: number
  downloadUrl: string | null
  filename: string | null
  mimeType: string | null
  fileSize: number | null
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
