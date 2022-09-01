import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
import { UnaryCall } from '@protobuf-ts/runtime-rpc'
import { useContext } from 'react'
import { FedemailClient } from './generated/proto/fedemail/v1/fedemail.client'
import { AuthContext } from '../packages/react-oauth2-code-pkce/index'
import { LabelsContext } from '../context/LabelsContext'
import { DraftsContext } from '../context/DraftsContext'

const baseUrl: string = process.env.REACT_APP_SERVER_BASE_URL || ''

const transport = new GrpcWebFetchTransport({
  baseUrl,
})

const fedemailClient = new FedemailClient(transport)

const useFedemailAPI = () => {
  const { token } = useContext(AuthContext)
  const { updateLabels } = useContext(LabelsContext)
  const { updateDrafts, newDraftEdit, updateDraftEdit, closeDraftEdit } = useContext(DraftsContext)

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
    const unaryCall = fedemailClient.labelsList({}, options)

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
        category,
        system,
        personal,
        user: userLabels,
      }

      updateLabels(labels)
    })
  }

  const draftsList = () => {
    const unaryCall = fedemailClient.draftsList(
      {
        maxResults: 0n,
      },
      options
    )

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      updateDrafts(response.response.drafts)
    })
  }

  const createDraft = (draft: any) => {
    const unaryCall = fedemailClient.draftsCreate(
      {
        messageRaw: draft,
      },
      options
    )

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      console.log('FedemailAPI', response.response)

      draft.content = response.response.message?.raw

      newDraftEdit({
        id: response.response.id,
        sender: 'me',
        ...draft,
      })
    })
  }

  const updateDraft = (draft: any) => {
    console.log('FedemailAPI', draft)
    updateDraftEdit(draft)
  }

  const sendDraft = (id: any) => {
    console.log('FedemailAPI', id)
  }

  const deleteDraft = (id: any) => {
    console.log('FedemailAPI', id)
    closeDraftEdit(id)
  }

  return {
    labelsList,
    draftsList,
    createDraft,
    updateDraft,
    sendDraft,
    deleteDraft,
  }
}

export default useFedemailAPI
