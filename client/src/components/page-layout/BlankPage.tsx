import React, { FC, ReactNode, useEffect } from 'react'
import { useConfig } from '../../packages/core/config'
import { createGlobalStyle } from 'styled-components'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
  }
`

export type BlankPageProps = {
  title: string
  children?: ReactNode
}

export const BlankPage: FC<BlankPageProps> = (props) => {
  const { productName } = useConfig()
  const titleParts: string[] = []
  if (props.title) {
    titleParts.push(props.title)
  }
  if (productName) {
    titleParts.push(productName)
  }
  useEffect(() => {
    if (document) {
      document.title = titleParts.join(' :: ')
    }
  })
  return (
    <>
      <GlobalStyle />
      {props.children}
    </>
  )
}
