import { useCallback } from 'react'

const useActionCreator = (type: any, dispatch: any) =>
  useCallback((payload: any) => dispatch({ type, payload }), [type, dispatch])

export default useActionCreator
