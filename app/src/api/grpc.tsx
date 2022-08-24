import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
import { RpcStatus, UnaryCall } from '@protobuf-ts/runtime-rpc'
// import { STATUS_CODES } from 'http'
// import { useContext } from 'react'
import { getTokenFromStorage } from '../auth'
// import { LabelsContext } from '../components/main/Labels'
// import { Label_Type } from './generated/proto/fedemail/v1/fedemail'
// import { RpcError } from '@protobuf-ts/runtime-rpc'
// import { FailRequest } from './generated/proto/fedemail/v1/fedemail'
import { FedemailClient, IFedemailClient } from './generated/proto/fedemail/v1/fedemail.client'

const baseUrl: string = process.env.REACT_APP_SERVER_BASE_URL || ''

const transport = new GrpcWebFetchTransport({
  baseUrl,
})

const client = new FedemailClient(transport)

const options: GrpcWebOptions = {
  baseUrl,
  deadline: Date.now() + 2000,
  format: 'text',

  // simple example for how to add auth headers to each request
  // see `RpcInterceptor` for documentation
  interceptors: [
    {
      interceptUnary(next, method, input, options): UnaryCall {
        const token = getTokenFromStorage()

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

const LabelsList = () => {
  // const updateLabels = useContext(LabelsContext)

  const unaryCall = client.labelsList({}, options)

  // console.log(`### calling method "${call.method.name}"...`)

  // const headers = await call.headers
  // console.log('got response headers: ', headers)

  // const response = await call.response
  // console.log('got response message: ', response)

  // const status = await call.status
  // console.log('got status: ', status)

  // const trailers = await call.trailers
  // console.log('got trailers: ', trailers)

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

    const labels = {
      userLabels,
    }

    // updateLabels.updateLabels()

    console.log(userLabels)
  })
  return null
}

export default LabelsList
