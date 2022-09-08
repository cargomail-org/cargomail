import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
import { UnaryCall } from '@protobuf-ts/runtime-rpc'
import { useContext } from 'react'
import { PeopleClient } from './generated/proto/people/v1/people.client'
import { AuthContext } from '../packages/react-oauth2-code-pkce/index'
import { ContactsContext, IContact } from '../context/ContactsContext'
import { Person } from './generated/proto/people/v1/people'

const baseUrl: string = process.env.REACT_APP_SERVER_BASE_URL || ''

const transport = new GrpcWebFetchTransport({
  baseUrl,
})

const peopleClient = new PeopleClient(transport)

const usePeopleAPI = () => {
  const { token } = useContext(AuthContext)
  const { updateContacts, addContact } = useContext(ContactsContext)

  const options: GrpcWebOptions = {
    baseUrl,
    deadline: Date.now() + 2000,
    format: 'text',

    interceptors: [
      {
        interceptUnary(next, method, input, options): UnaryCall {
          if (!options.meta) {
            options.meta = {}
          }
          if (token) {
            options.meta.Authorization = `Bearer ${token}`
          }
          return next(method, input, options)
        },
      },
    ],

    // you can set global request headers here
    meta: {},
  }

  const contactsList = () => {
    const unaryCall = peopleClient.contactsList(
      {
        maxResults: 0n,
      },
      options
    )

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      const contacts: IContact[] = response.response.contacts.map((contact) => ({
        id: contact.id,
        givenName: contact.name?.givenName || '',
        familyName: contact.name?.familyName || '',
        emailAddress: contact.emailAddresses[0].value,
      }))

      console.log('PeopleAPI', contacts)

      updateContacts(contacts)
    })
  }

  const contactsCreate = async (contact: IContact) => {
    console.log('PeopleAPI/contactsCreate', contact)

    const person: Person = {
      id: contact.id,
      name: {
        givenName: contact.givenName,
        familyName: contact.familyName,
        displayName: `${contact.givenName} ${contact.familyName}`,
        displayNameLastFirst: `${contact.familyName} ${contact.givenName}`,
      },
      emailAddresses: [{ displayName: '', value: contact.emailAddress }],
    }

    const unaryCall = peopleClient.contactsCreate({ person }, options)

    await unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      contact.id = response.response.id
    })

    addContact(contact)
    console.log('PeopleAPI/contactsCreate', contact)
  }

  const contactsUpdate = (person: Person) => {
    const unaryCall = peopleClient.contactsUpdate(person, options)

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      // updateContact(response.response)
    })
    console.log('PeopleAPI', person)
  }

  return {
    contactsList,
    contactsCreate,
    contactsUpdate,
  }
}

export default usePeopleAPI
