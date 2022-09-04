import { useState, createContext, ReactNode } from 'react'

export interface IContactsProvider {
  children: ReactNode
}

export interface IContact {
  inputValue?: string
  id?: string
  givenName: string
  familyName: string
  emailAddress: string
}

export interface IContactsContext {
  contacts: IContact[]
  updateContacts: (contacts: IContact[]) => void
}

export const ContactsContext = createContext<IContactsContext>({
  contacts: [] as IContact[],
  updateContacts: () => null,
})

export const ContactsProvider = (props: any) => {
  const [contacts, setContacts] = useState([] as IContact[])

  const updateContacts = (updates: IContact[]) => {
    setContacts((prev) => ({
      ...prev,
      ...updates,
    }))
  }

  return <ContactsContext.Provider value={{ contacts, updateContacts }}>{props.children}</ContactsContext.Provider>
}
