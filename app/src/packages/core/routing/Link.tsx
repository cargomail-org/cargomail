import React, { FC, ReactNode } from 'react'
import { Link as MuiLink, LinkProps as MuiLinkProps } from '@mui/material'
import { Link as ReactRouterDomLink } from 'react-router-dom'

export type RoutingLinkProps = MuiLinkProps & {
  to: string
  children?: ReactNode
}

export const RoutingLink: FC<RoutingLinkProps> = (props) => {
  return <MuiLink {...props} component={ReactRouterDomLink} />
}

export type FunctionalLinkProps = MuiLinkProps & {
  onClick: () => void
}

export const FunctionalLink: FC<FunctionalLinkProps> = (props) => (
  <MuiLink
    {...props}
    href="#"
    onClick={(event) => {
      event.preventDefault()
      if (props.onClick) {
        props.onClick()
      }
    }}
  />
)
