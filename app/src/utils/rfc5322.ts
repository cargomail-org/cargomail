const rfc5322 = (raw: any) =>
  `${
    'Content-Type: text/html\n' +
    'Content-Transfer-Encoding: base64\n' +
    `From: ${raw.sender}\n` +
    `To: ${raw.recipients}\n` +
    `Subject: ${raw.subject}\n\n`
  }${b64EncodeUnicode(raw.content)}`

// Encoding UTF8 ⇢ base64
export function b64EncodeUnicode(str: string) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    })
  )
}

// Decoding base64 ⇢ UTF8
export function b64DecodeUnicode(str: string) {
  return decodeURIComponent(
    Array.prototype.map
      .call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      })
      .join('')
  )
}

export default rfc5322
