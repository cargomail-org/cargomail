import { useState, createContext, ReactNode } from 'react'
import type { Label } from '../api/generated/proto/fedemail/v1/fedemail'

export interface ILabelsProvider {
  children: ReactNode
}

export interface ILabelsContext {
  labels: {
    category: Label[]
    system: Label[]
    user: Label[]
  }
  updateLabels: (labels: { category: Label[]; system: Label[]; user: Label[] }) => void
}

export const LabelsContext = createContext<ILabelsContext>({
  labels: {
    category: [] as Label[],
    system: [] as Label[],
    user: [] as Label[],
  },
  updateLabels: () => null,
})

export const LabelsProvider = (props: any) => {
  const [labels, setLabels] = useState({
    category: [] as Label[],
    system: [] as Label[],
    user: [] as Label[],
  })

  const updateLabels = (updates: { category: Label[]; system: Label[]; user: Label[] }) => {
    setLabels((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  return <LabelsContext.Provider value={{ labels, updateLabels }}>{props.children}</LabelsContext.Provider>
}
