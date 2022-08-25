import { useState, createContext, ReactNode, Component } from 'react'

export interface ILabelsProvider {
  children: ReactNode
}

export interface ILabelsContext {
  labels: {
    category: string[]
    system: string[]
    user: string[]
  }
  updateLabels: (labels: { category: string[]; system: string[]; user: string[] }) => void
}

export const LabelsContext = createContext<ILabelsContext>({
  labels: {
    category: [] as string[],
    system: [] as string[],
    user: ['x', 'y', 'z'] as string[],
  },
  updateLabels: () => null,
})

export const LabelsProvider = (props: any) => {
  const [labels, setLabels] = useState({
    category: [] as string[],
    system: [] as string[],
    user: ['q', 'w', 'e', 'r', 't', 'y'] as string[],
  })

  const updateLabels = (updates: { category: string[]; system: string[]; user: string[] }) => {
    setLabels((prev) => ({
      ...prev,
      ...updates,
    }))
    console.log('Provider:', labels)
  }

  return <LabelsContext.Provider value={{ labels, updateLabels }}>{props.children}</LabelsContext.Provider>
}
