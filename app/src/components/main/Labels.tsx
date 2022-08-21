import React, { useEffect, useState } from 'react'
import InboxIcon from '@mui/icons-material/MoveToInbox'
import { useNavigate, useLocation } from 'react-router-dom'
// import * as ROUTES from '../../constants/routes'
import { List, ListItem, ListItemButton, ListItemIcon, ListItemText, styled } from '@mui/material'
import MailIcon from '@mui/icons-material/Mail'

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

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  // fontWeight: 'bold',
  // color: theme.palette.text.secondary,
  padding: '16px 24px',
  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.background.default,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
  '&.Mui-selected': {
    color: theme.palette.text.primary,
    backgroundColor: theme.palette.background.paper,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    '& .MuiListItemIcon-root': {
      color: theme.palette.text.primary,
    },
  },
  '&.Mui-selected:hover': {
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.background.paper,
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}))

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
    // <List component="nav" sx={{ bgcolor: 'Background.default' }}>
    //   <StyledListItemButton
    //     onClick={(e) => {
    //       // navigate(ROUTES.MAIN)
    //       handleListItemClick(e, 0)
    //     }}
    //     selected={selectedIndex === 0}>
    //     <ListItemIcon>
    //       <InboxIcon />
    //     </ListItemIcon>
    //     <ListItemText primary="Inbox" disableTypography />
    //   </StyledListItemButton>
    // </List>
    <List>
      {['Inbox', 'Starred', 'Sent', 'Drafts'].map((text, index) => (
        <ListItem key={text} disablePadding>
          <ListItemButton
            onClick={(e) => {
              handleListItemClick(e, 0)
            }}>
            <ListItemIcon>{index % 2 === 0 ? <InboxIcon /> : <MailIcon />}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  )
}
