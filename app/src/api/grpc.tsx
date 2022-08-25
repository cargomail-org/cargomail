import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
import { UnaryCall } from '@protobuf-ts/runtime-rpc'
import { useContext } from 'react'
import { FedemailClient } from './generated/proto/fedemail/v1/fedemail.client'
import { AuthContext } from '../packages/react-oauth2-code-pkce/index'
import { LabelsContext } from '../context/LabelsContext'

const baseUrl: string = process.env.REACT_APP_SERVER_BASE_URL || ''

const transport = new GrpcWebFetchTransport({
  baseUrl,
})

const client = new FedemailClient(transport)

const useFedemailAPI = () => {
  const { token } = useContext(AuthContext)
  const { updateLabels } = useContext(LabelsContext)

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

  const labelsList = () => {
    const unaryCall = client.labelsList({}, options)

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }
      const systemAll = response.response.labels.filter((label) => label.type === 0)
      const category = systemAll
        .filter((label) => label.name.startsWith('CATEGORY'))
        .filter((label) => !label.name.endsWith('PERSONAL'))
      const system = systemAll.filter((label) => !label.name.startsWith('CATEGORY'))
      const userLabels = response.response.labels.filter((label) => label.type === 1)
      const personal = systemAll.find((label) => label.name === 'CATEGORY_PERSONAL')

      // const labels = {
      //   category,
      //   system,
      //   personal,
      //   user: userLabels,
      // }

      const labels = {
        category: ['a', 'b'],
        system: ['c', 'd'],
        user: ['e', 'f'],
      }

      updateLabels(labels)

      console.log(userLabels)
    })
  }

  return {
    labelsList,
  }
}

export default useFedemailAPI
