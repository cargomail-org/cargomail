import { createContext, ReactNode, Component, useReducer } from 'react'
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
      return { ...state, drafts: payload }
    case actions.newDraftEdit:
      return {
        ...state,
        editing: {
          ...state.editing,
          [payload.id]: payload,
        },
      }
    case actions.updateDraftEdit:
      return {
        ...state,
        editing: {
          ...state.editing,
          [payload.id]: {
            ...state[payload.id],
            ...payload,
          },
        },
      }
    case actions.closeDraftEdit: {
      const { [payload]: discard, ...editing } = state.editing
      return { ...state, editing }
    }
    default:
      return state
  }
}

export interface IDraftsProvider {
  children: ReactNode
}

export interface IDraftsContext {
  drafts: Draft[]
  updateDrafts: (drafts: Draft[]) => void
  newDraftEdit: (draft: Draft) => void
  updateDraftEdit: (draft: Draft) => void
  closeDraftEdit: (id: string) => void
}

export const DraftsContext = createContext<IDraftsContext>({
  drafts: [] as Draft[],
  updateDrafts: () => null,
  newDraftEdit: () => null,
  updateDraftEdit: () => null,
  closeDraftEdit: () => null,
})

export const DraftsProvider = (props: any) => {
  const [drafts, dispatch] = useReducer(reducer, {
    drafts: [] as Draft[],
    editing: {} as Draft,
  })

  const updateDrafts = useActionCreator(actions.updateDrafts, dispatch)
  const newDraftEdit = useActionCreator(actions.newDraftEdit, dispatch)
  const updateDraftEdit = useActionCreator(actions.updateDraftEdit, dispatch)
  const closeDraftEdit = useActionCreator(actions.closeDraftEdit, dispatch)

  return (
    <DraftsContext.Provider value={{ drafts, updateDrafts, newDraftEdit, updateDraftEdit, closeDraftEdit }}>
      {props.children}
    </DraftsContext.Provider>
  )
}
