import { createContext, useContext } from 'react'

export type Config = {
  productName: string
  ProductLogo: any
}

const configContext = createContext<Config | null>(null)

export const ConfigProvider = configContext.Provider

export function useConfig(): Config {
  const config = useContext(configContext)
  if (!config) {
    throw new Error(`no config was provided`)
  }
  return config
}
