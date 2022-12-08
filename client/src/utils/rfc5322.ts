import { IContact } from '../context/ContactsContext'
import { IDraftEdit } from '../context/DraftsContext'

const rfc5322 = (raw: IDraftEdit) =>
  `${
    `Content-Type: ${raw.mimeType}\n` +
    'Content-Transfer-Encoding: base64\n' +
    `From: ${raw.sender}\n` +
    `To: ${buildDraftRecipients(raw.to)}\n` +
    `Cc: ${buildDraftRecipients(raw.cc)}\n` +
    `Bcc: ${buildDraftRecipients(raw.bcc)}\n` +
    `Subject: ${raw.subject}\n\n`
  }${b64EncodeUnicode(raw.content)}`

export const buildDraftRecipients = (contacts: IContact[]): string => {
  const recipients = contacts
    .map((contact: any) => {
      const name = `${contact.givenName} ${contact.familyName}`
      return `${name.trim().length > 0 ? `"${name}"` : ''} <${contact.emailAddress}>`.trimStart()
    })
    .join()
  return recipients
}

// Encoding UTF8 ⇢ base64
export function b64EncodeUnicode(str: string) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    })
  )
}

// Decoding base64 ⇢ UTF8
export function b64DecodeUnicode(base64: any) {
  const text = atob(base64)
  const length = text.length
  const bytes = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    bytes[i] = text.charCodeAt(i)
  }
  const decoder = new TextDecoder() // default is utf-8
  return decoder.decode(bytes)
}

export default rfc5322
