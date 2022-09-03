const rfc5322 = (raw: any) =>
  `${
    'Content-Type: text/html\n' +
    'Content-Transfer-Encoding: base64\n' +
    `From: ${raw.sender}\n` +
    `To: ${raw.recipients}\n` +
    `Subject: ${raw.subject}\n\n`
  }${window.btoa(raw.content)}`

export default rfc5322
