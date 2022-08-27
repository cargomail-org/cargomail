import { useState, createContext, ReactNode, Component } from 'react'
import type { Draft } from '../api/generated/proto/fedemail/v1/fedemail'

export interface IDraftsProvider {
  children: ReactNode
}

export interface IDraftsContext {
  drafts: Draft[]
  updateDrafts: (drafts: Draft[]) => void
}

export const DraftsContext = createContext<IDraftsContext>({
  drafts: [] as Draft[],
  updateDrafts: () => null,
})

export const DraftsProvider = (props: any) => {
  const [drafts, setDrafts] = useState([] as Draft[])

  const updateDrafts = (updates: Draft[]) => {
    setDrafts((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  return <DraftsContext.Provider value={{ drafts, updateDrafts }}>{props.children}</DraftsContext.Provider>
}
