import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/action_creator'

const actions = {
  updateContacts: 'UPDATE_CONTACTS',
  addContact: 'ADD_CONTACT',
}

const reducer = (state: IContact[], action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateContacts:
      return payload
    case actions.addContact:
      return [...state, payload]
    default:
      return state
  }
}

export interface IContactsProvider {
  children: ReactNode
}

export interface IContact {
  inputValue?: string
  id: string
  givenName: string
  familyName: string
  emailAddress: string
}

export interface IContactsContext {
  contacts: IContact[]
  updateContacts: (contacts: IContact[]) => void
  addContact: (contact: IContact) => void
}

export const ContactsContext = createContext<IContactsContext>({
  contacts: [] as IContact[],
  updateContacts: () => null,
  addContact: () => null,
})

export const ContactsProvider = (props: any) => {
  const [contacts, dispatch] = useReducer(reducer, [] as IContact[])

  const updateContacts = useActionCreator(actions.updateContacts, dispatch)
  const addContact = useActionCreator(actions.addContact, dispatch)

  return (
    <ContactsContext.Provider value={{ contacts, updateContacts, addContact }}>
      {props.children}
    </ContactsContext.Provider>
  )
}
