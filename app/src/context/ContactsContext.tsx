import { useState, createContext, ReactNode, Component } from 'react'
import type { Person } from '../api/generated/proto/people/v1/people'

export interface IContactsProvider {
  children: ReactNode
}

export interface IContactsContext {
  contacts: Person[]
  updateContacts: (contacts: Person[]) => void
}

export const ContactsContext = createContext<IContactsContext>({
  contacts: [] as Person[],
  updateContacts: () => null,
})

export const ContactsProvider = (props: any) => {
  const [contacts, setContacts] = useState([] as Person[])

  const updateContacts = (updates: Person[]) => {
    setContacts((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  return <ContactsContext.Provider value={{ contacts, updateContacts }}>{props.children}</ContactsContext.Provider>
}
