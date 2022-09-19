import { GrpcWebFetchTransport, GrpcWebOptions } from '@protobuf-ts/grpcweb-transport'
import { UnaryCall } from '@protobuf-ts/runtime-rpc'
import { useContext } from 'react'
import { FedemailClient } from './generated/proto/fedemail/v1/fedemail.client'
import { AuthContext } from '../packages/react-oauth2-code-pkce/index'
import { LabelsContext } from '../context/LabelsContext'
import { DraftsContext, IDraftEdit } from '../context/DraftsContext'
import encode from '../utils/mails/encode'
import { decodeCurrentUser } from '../auth'
import { Draft } from './generated/proto/fedemail/v1/fedemail'
import { buildDraftRecipients, b64EncodeUnicode } from '../utils/rfc5322'

const baseUrl: string = process.env.REACT_APP_SERVER_BASE_URL || ''

const transport = new GrpcWebFetchTransport({
  baseUrl,
})

const fedemailClient = new FedemailClient(transport)

const useFedemailAPI = () => {
  const { token, idToken } = useContext(AuthContext)
  const { updateLabels } = useContext(LabelsContext)
  const { listDrafts, createDraft, updateDraft, deleteDraft, newDraftEdit, updateDraftEdit, closeDraftEdit } =
    useContext(DraftsContext)

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

  const draftsList = async () => {
    const unaryCall = fedemailClient.draftsList(
      {
        maxResults: 0n,
      },
      options
    )

    const response = await unaryCall.then(async (response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return Promise.reject(new Error(response.status.detail))
        // throw response.status.detail
      }
      return Promise.resolve(response.response)
      // return response.response
    })

    const drafts = await Promise.all((response.drafts || []).map(async ({ id }: any) => await draftsGet(id)))
      .then((responses) => {
        return responses.map((result) => result)
      })
      .catch((error) => {
        console.error(error.message)
      })
    listDrafts(drafts || [])
  }

  const draftsGet = async (id: any): Promise<Draft> => {
    const unaryCall = fedemailClient.draftsGet(
      {
        id,
      },
      options
    )

    const response = await unaryCall.then(async (response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return Promise.reject(new Error(response.status.detail))
        // throw response.status.detail
      }
      return Promise.resolve(response.response)
      // return response.response
    })
    return response
  }

  const draftsCreate = (draft: IDraftEdit) => {
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

      newDraftEdit({
        ...draft,
        id: response.response.id,
        sender: decodeCurrentUser(idToken)?.username || '',
      })
      createDraft(response.response)
    })
  }

  const draftsUpdate = (draft: IDraftEdit) => {
    updateDraftEdit(draft)
    const message = { raw: encode(draft) }
    console.log('FedemailAPI', message)
    const unaryCall = fedemailClient.draftsUpdate(
      {
        id: draft.id,
        messageRaw: {
          id: '',
          message: {
            id: '',
            raw: message.raw,
            labelIds: [],
            snippet: draft.snippet,
            threadId: '',
            historyId: '',
            internalDate: '',
          },
        },
      },
      options
    )

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      response.response.message!.payload = {
        headers: [
          { name: 'Subject', value: draft.subject },
          { name: 'From', value: draft.sender },
          { name: 'To', value: buildDraftRecipients(draft.recipients) },
        ],
        mimeType: draft.mimeType,
        filename: '',
        partId: '',
        parts: [],
        body: { attachmentId: '', data: b64EncodeUnicode(draft.content), size: draft.content.length },
      }
      response.response.message!.snippet = draft.snippet
      console.log('FedemailAPI', response.response)
      updateDraft(response.response)
    })
  }

  const draftsDelete = (id: any) => {
    console.log('FedemailAPI', id)
    const unaryCall = fedemailClient.draftsDelete(
      {
        id,
      },
      options
    )

    unaryCall.then((response) => {
      if (response.status.code !== 'OK') {
        console.log(response.status.code, response.status.detail)
        return null
      }

      closeDraftEdit(id)
      deleteDraft(id)
    })
  }

  const draftsSend = (id: any) => {
    console.log('FedemailAPI', id)
  }

  return {
    labelsList,
    draftsList,
    draftsCreate,
    draftsUpdate,
    draftsSend,
    draftsDelete,
  }
}

export default useFedemailAPI
