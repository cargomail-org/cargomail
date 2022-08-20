import { GrpcWebFetchTransport } from '@protobuf-ts/grpcweb-transport'
// import { RpcError } from '@protobuf-ts/runtime-rpc'
// import { FailRequest } from './gen/proto/fedemail/v1/fedemail'
import { FedemailClient, IFedemailClient } from './gen/proto/fedemail/v1/fedemail.client'

const transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:8180',
})

const client = new FedemailClient(transport)

async function main() {
  await callUnary(client)
}

async function callUnary(client: IFedemailClient) {
  const call = client.labelsList({})

  console.log(`### calling method "${call.method.name}"...`)

  const headers = await call.headers
  console.log('got response headers: ', headers)

  const response = await call.response
  console.log('got response message: ', response)

  const status = await call.status
  console.log('got status: ', status)

  const trailers = await call.trailers
  console.log('got trailers: ', trailers)

  console.log()
}
