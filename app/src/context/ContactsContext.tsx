import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/action_creator'

const actions = {
  updateContacts: 'UPDATE_CONTACTS',
  setContacts: 'SET_CONTACTS',
}

const reducer = (state: IContact[], action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateContacts:
      return payload
    case actions.setContacts:
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
  setContacts: (contact: IContact) => void
}

export const ContactsContext = createContext<IContactsContext>({
  contacts: [] as IContact[],
  updateContacts: () => null,
  setContacts: () => null,
})

export const ContactsProvider = (props: any) => {
  const [contacts, dispatch] = useReducer(reducer, [] as IContact[])

  const updateContacts = useActionCreator(actions.updateContacts, dispatch)
  const setContacts = useActionCreator(actions.setContacts, dispatch)

  return (
    <ContactsContext.Provider value={{ contacts, updateContacts, setContacts }}>
      {props.children}
    </ContactsContext.Provider>
  )
}
