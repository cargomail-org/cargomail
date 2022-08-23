import React, { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
// import MailIcon from '@mui/icons-material/Mail'
import InboxIcon from '@mui/icons-material/Inbox'
import DraftsIcon from '@mui/icons-material/Drafts'
import CheckIcon from '@mui/icons-material/Check'
import DeleteIcon from '@mui/icons-material/Delete'
import AccountBoxIcon from '@mui/icons-material/AccountBox'
import * as ROUTES from '../../routes'

import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
// import { RpcError } from '@protobuf-ts/runtime-rpc'
// import { FailRequest } from './generated/proto/fedemail/v1/fedemail'
import { FedemailClient, IFedemailClient } from '../../api/generated/proto/fedemail/v1/fedemail.client'
import { RpcError, RpcOptions, UnaryCall } from '@protobuf-ts/runtime-rpc'

const transport = new GrpcWebFetchTransport({
  baseUrl: 'http://localhost:8180',
})

const client = new FedemailClient(transport)

async function callUnary(client: IFedemailClient, options: RpcOptions) {
  const call = client.labelsList({}, options)

  console.log(`### calling method "${call.method.name}"...`)

  const headers = await call.headers
  console.log('got response headers: ', headers)

  const response = await call.response
  console.log('got response message: ', response)

  const status = await call.status
  console.log('got status: ', status)

  const trailers = await call.trailers
  console.log('got trailers: ', trailers)

  console.log(response)
}

export const Labels = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0)
  const navigate = useNavigate()
  const location = useLocation()

  const options: GrpcWebOptions = {
    baseUrl: 'http://localhost:8180',
    deadline: Date.now() + 2000,
    format: 'text',

    // simple example for how to add auth headers to each request
    // see `RpcInterceptor` for documentation
    interceptors: [
      {
        interceptUnary(next, method, input, options): UnaryCall {
          if (!options.meta) {
            options.meta = {}
          }
          options.meta.Authorization = 'abc'
          console.log('unary interceptor added authorization header (gRPC-web transport)')
          return next(method, input, options)
        },
      },
    ],

    // you can set global request headers here
    meta: {},
  }

  useEffect(() => {
    switch (location.pathname) {
      case '/':
        setSelectedIndex(0)
        break
      default:
        setSelectedIndex(null)
        break
    }
  }, [location])

  const handleListItemClick = async (event: React.MouseEvent<HTMLDivElement, MouseEvent>, index: number) => {
    setSelectedIndex(index)
    console.log('clicked', index)
    await callUnary(client, options)
  }

  return (
    <List>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.INBOX)
            handleListItemClick(e, 0)
          }}>
          <ListItemIcon>
            <InboxIcon />
          </ListItemIcon>
          <ListItemText primary="Inbox" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.DONE)
            handleListItemClick(e, 1)
          }}>
          <ListItemIcon>
            <CheckIcon />
          </ListItemIcon>
          <ListItemText primary="Done" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.DRAFTS)
            handleListItemClick(e, 2)
          }}>
          <ListItemIcon>
            <DraftsIcon />
          </ListItemIcon>
          <ListItemText primary="Drafts" />
        </ListItemButton>
      </ListItem>
      <ListItem disablePadding>
        <ListItemButton
          onClick={(e) => {
            // navigate(ROUTES.TRASH)
            handleListItemClick(e, 3)
          }}>
          <ListItemIcon>
            <DeleteIcon />
          </ListItemIcon>
          <ListItemText primary="Trash" />
        </ListItemButton>
      </ListItem>
    </List>
  )
}
