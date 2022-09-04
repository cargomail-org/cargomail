import { createContext, ReactNode, useReducer } from 'react'
import type { Draft } from '../api/generated/proto/fedemail/v1/fedemail'
import useActionCreator from '../utils/hooks/action_creator'

const actions = {
  updateDrafts: 'UPDATE_DRAFTS',
  newDraftEdit: 'NEW_DRAFT_EDIT',
  updateDraftEdit: 'UPDATE_DRAFT_EDIT',
  closeDraftEdit: 'CLOSE_DRAFT_EDIT',
}

const reducer = (state: any, action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateDrafts:
      return {
        ...state,
        drafts: payload,
      }
    case actions.newDraftEdit:
      return {
        ...state,
        editing: [...state.editing, payload],
      }
    case actions.updateDraftEdit:
      return {
        ...state,
        editing: state.editing.map((draft: { id: any }) => {
          if (draft.id === payload.id) {
            return { ...draft, ...payload }
          }
          return draft
        }),
      }
    case actions.closeDraftEdit: {
      return {
        ...state,
        editing: state.editing.filter((draft: { id: any }) => draft.id !== payload),
      }
    }
    default:
      return state
  }
}

export interface IDraftsProvider {
  children: ReactNode
}

export interface IDraftEdit {
  id: string
  sender: string
  recipients: string
  subject: string
  content: string
}

export interface IDraftsContext {
  draftsAll: { drafts: Draft[]; editing: IDraftEdit[] }
  updateDrafts: (drafts: Draft[]) => void
  newDraftEdit: (draft: IDraftEdit) => void
  updateDraftEdit: (draft: IDraftEdit) => void
  closeDraftEdit: (id: string) => void
}

export const DraftsContext = createContext<IDraftsContext>({
  draftsAll: { drafts: [] as Draft[], editing: [] as IDraftEdit[] },
  updateDrafts: () => null,
  newDraftEdit: () => null,
  updateDraftEdit: () => null,
  closeDraftEdit: () => null,
})

export const DraftsProvider = (props: any) => {
  const [draftsAll, dispatch] = useReducer(reducer, {
    drafts: [] as Draft[],
    editing: [] as IDraftEdit[],
  })

  const updateDrafts = useActionCreator(actions.updateDrafts, dispatch)
  const newDraftEdit = useActionCreator(actions.newDraftEdit, dispatch)
  const updateDraftEdit = useActionCreator(actions.updateDraftEdit, dispatch)
  const closeDraftEdit = useActionCreator(actions.closeDraftEdit, dispatch)

  return (
    <DraftsContext.Provider value={{ draftsAll, updateDrafts, newDraftEdit, updateDraftEdit, closeDraftEdit }}>
      {props.children}
    </DraftsContext.Provider>
  )
}
