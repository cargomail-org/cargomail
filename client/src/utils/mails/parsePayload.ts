import { Buffer } from 'buffer'

export interface IRecipient {
  name: string
  mail: string
}

const getNameAndMail = (value: any): IRecipient => {
  if (!value) return { name: '', mail: '' }
  const delimiterIndex = value.lastIndexOf(' ')
  let name
  let mail
  if (delimiterIndex === -1) {
    mail = value[0] === '<' ? value.slice(1, value.length - 1) : value.slice(0, value.length)
    name = mail.split('@')[0] || mail
  } else {
    name = value[0] === '"' ? value.slice(1, delimiterIndex - 1) : value.slice(0, delimiterIndex)
    mail = value.slice(delimiterIndex + 2, value.length - 1)
  }
  return { name, mail }
}

const parseParts = ({ parts, headers, filename, body, mimeType }: any): any => {
  switch (mimeType) {
    case 'application/pdf':
    case 'image/jpeg': {
      const attachment = {
        name: filename,
        type: mimeType,
        id: body.attachmentId,
        cid: '',
      }
      const cidHeader = headers.find((header: any) => header.name === 'Content-ID')
      if (cidHeader) {
        const cidValue = cidHeader.value
        attachment.cid = cidValue.slice(1, cidValue.length - 1)
      }

      return { attachments: [attachment] }
    }
    case 'text/html':
    case 'text/plain':
    case 'application/json': {
      const uint8arr = new Uint8Array(Buffer.from(body.data, 'base64'))
      const content = new TextDecoder().decode(uint8arr)
      return { content }
    }
    case 'multipart/alternative':
      return parseParts(parts[parts.length - 1])
    case 'message/external-body':
    case 'multipart/related':
    case 'multipart/report':
    case 'multipart/mixed': {
      const mixed = parts.map(parseParts)
      return mixed.reduce(
        (result: any, current: any) => ({
          content: result.content + (current.content || ''),
          attachments: result.attachments.concat(current.attachments || []),
        }),
        { content: '', attachments: [] }
      )
    }
    default:
      return {}
  }
}

const parsePayload = ({ id, payload }: any) => {
  const findHeader = (field: any) => (payload?.headers?.find((e: any) => e.name === field) || {}).value

  const from = getNameAndMail(findHeader('From') || '')
  const toArray = findHeader('To')?.split(',') || []
  const to = toArray?.map((recipient: any) => {
    return getNameAndMail(recipient)
  })
  const ccArray = findHeader('Cc')?.split(',') || []
  const cc = ccArray?.map((recipient: any) => {
    return getNameAndMail(recipient)
  })
  const bccArray = findHeader('Bcc')?.split(',') || []
  const bcc = bccArray?.map((recipient: any) => {
    return getNameAndMail(recipient)
  })
  const subject = findHeader('Subject') || ''

  try {
    const { content = '', attachments = [] } = payload ? parseParts(payload) : {}
    return {
      from,
      to,
      cc,
      bcc,
      subject,
      content,
      mimeType: payload?.mimeType,
      attachments,
    }
  } catch (e) {
    ;(window as any).debug(`Message ID: ${id}`)
    ;(window as any).debug(e)
    return {
      from,
      to,
      cc,
      bcc,
      subject,
      content: `Parse failed for Message ${id}`,
      mimeType: payload?.mimeType,
      attachments: [],
    }
  }
}

export default parsePayload
