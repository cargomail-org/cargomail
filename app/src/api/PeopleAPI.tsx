import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
import { UnaryCall } from '@protobuf-ts/runtime-rpc'
import { useContext } from 'react'
import { PeopleClient } from './generated/proto/people/v1/people.client'
import { AuthContext } from '../packages/react-oauth2-code-pkce/index'
import { ContactsContext } from '../context/ContactsContext'

const baseUrl: string = process.env.REACT_APP_SERVER_BASE_URL || ''

const transport = new GrpcWebFetchTransport({
  baseUrl,
})

const peopleClient = new PeopleClient(transport)

const usePeopleAPI = () => {
  const { token } = useContext(AuthContext)
  const { updateContacts } = useContext(ContactsContext)

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

  const getContacts = () => {
    const unaryCall = peopleClient.connectionsList({}, options)

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }
      updateContacts(response.response.connections)
    })
  }

  return {
    getContacts,
  }
}

export default usePeopleAPI
