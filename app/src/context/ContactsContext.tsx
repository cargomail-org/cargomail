import { createContext, ReactNode, useReducer } from 'react'
import useActionCreator from '../utils/hooks/action_creator'

const actions = {
  updateContacts: 'UPDATE_CONTACTS',
}

const reducer = (state: IContact[], action: any) => {
  const { payload } = action
  switch (action.type) {
    case actions.updateContacts:
      return payload
    default:
      return state
  }
}
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
  const [contacts, dispatch] = useReducer(reducer, [] as IContact[])

  const updateContacts = useActionCreator(actions.updateContacts, dispatch)

  return <ContactsContext.Provider value={{ contacts, updateContacts }}>{props.children}</ContactsContext.Provider>
}
