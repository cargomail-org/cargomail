export const b64EncodeUtf8 = (str) => {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function (match, p1) {
      return String.fromCharCode(parseInt(p1, 16));
    })
  );
};

export const b64DecodeUtf8 = (base64) => {
  const text = atob(base64);
  const length = text.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = text.charCodeAt(i);
  }

  const decoder = new TextDecoder(); // default is utf-8

  return decoder.decode(bytes);
};

export const treatDupliciteMessage = (thread, view, message, duplicateIndex) => {
  const parsed = parsePayload(message.id, message.payload);
  const from = parseNameAndEmail(parsed.from);
  const to = parsed.to?.find((recipient) => recipient.email == from.email);
  const cc = parsed.cc?.find((recipient) => recipient.email == from.email);
  const bcc = parsed.bcc?.find((recipient) => recipient.email == from.email);

  if (from.email == to.email || from.email == cc.email || from.email == bcc.email) {
    if (thread.messages[duplicateIndex].folder == 1 && message.folder == 2) {
      // ok! sent, then received a myself message
      if (view == 1) {
        // ignore the received
      } else if (view == 0 || view == 2) {
        // overwrite the sent with the received
        thread.messages[duplicateIndex] = message;
        return 1;
      } else if (view == -1) {
        // allow the duplicate
        thread.messages.push(message);
        return 2;
      } else {
        // ignore the duplicate
        console.log("the found duplicate ignored");
      }
    } else if (thread.messages[duplicateIndex].folder == 2 && message.folder == 1) {
      // weird, not chronological, but ok! received, then sent a myself message
      if (view == 1) {
        // overwrite the received with the sent
        thread.messages[duplicateIndex] = message;
        return 1;
      } else if (view == 0 || view == 2) {
        // ignore the sent
      } else if (view == -1) {
        // allow the duplicate
        thread.messages.push(message);
        return 2;
      } else {
        // ignore the duplicate
        console.log("the found duplicate ignored");
      }
    } else if (thread.messages[duplicateIndex].folder == 0 || message.folder == 0) {
      // ok! it's a draft, allow the duplicate
      thread.messages.push(message);
      return 2;
    } else if (view == -1) {
      // ok! allow the duplicate
      thread.messages.push(message);
      return 2;
    } else {
      // wrong! allow the duplicate and log about it
      thread.messages.push(message);
      console.log("the found duplicate ignored");
      return 2;
    }
  } else {
    if (thread.messages[duplicateIndex].folder == 0 || message.folder == 0) {
      // ok! it's a draft, allow the duplicate
      thread.messages.push(message);
      return 2;
    } else {
      // wrong! allow the duplicate and log about it
      thread.messages.push(message);
      console.log("the found duplicate ignored");
      return 2;
    }
  }
};

export const getParticipantsFrom = (username, messages) => {
  const participants = new Map();

  for (const message of messages) {
    const parsed = parsePayload(message.id, message.payload);

    const participant = parseNameAndEmail(parsed.from);
    participants.set(participant.email, participant.name);
  }

  let displayParticipants = "";

  for (const participant of Array.from(participants).reverse()) {
    const displayPerson = participant[0] == username ? "me" : participant[1] || participant[0];

    if (displayParticipants) {
      displayParticipants = `${displayPerson}, ${displayParticipants}`;
    } else {
      displayParticipants = displayPerson;
    }
  }

  return displayParticipants;
};

export const getParticipantsTo = (username, messages) => {
  const participants = new Map();

  for (const message of messages) {
    const parsed = parsePayload(message.id, message.payload);

    if (message.folder == 1) {
      for (const to of parsed.to) {
        participants.set(to.email, to.name);
      }

      for (const cc of parsed.cc) {
        participants.set(cc.email, cc.name);
      }

      for (const bcc of parsed.bcc) {
        participants.set(bcc.email, bcc.name);
      }
    }
  }

  let displayParticipants = "";

  for (const participant of Array.from(participants).reverse()) {
    const displayPerson = participant[0] == username ? "me" : participant[1] || participant[0];

    if (displayParticipants) {
      displayParticipants = `${displayPerson}, ${displayParticipants}`;
    } else {
      displayParticipants = displayPerson;
    }
  }

  return `To: ${displayParticipants}`;
};

export const getRecipientsShort = (profileUsername, parsed) => {
  let recipientTo = "";
  let recipientCc = "";
  let recipientBcc = "";

  for (const to of parsed.to) {
    const delim = recipientTo.length > 0 ? ", " : "";

    if (to.email == profileUsername) {
      recipientTo += delim + "me";
    } else {
      recipientTo += delim + (to.name || to.email);
    }
  }

  for (const cc of parsed.cc) {
    const delim = recipientCc.length > 0 ? ", " : "";

    if (cc.email == profileUsername) {
      recipientCc += delim + "me";
    } else {
      recipientCc += delim + (cc.name || cc.email);
    }
  }

  for (const bcc of parsed.bcc) {
    const delim = recipientBcc.length > 0 ? ", " : "";

    if (bcc.email == profileUsername) {
      recipientBcc += delim + "me";
    } else {
      recipientBcc += delim + (bcc.name || bcc.email);
    }
  }

  let recipients = `to: ${recipientTo}`;

  if (recipientCc) {
    recipients += `, cc: ${recipientCc}`;
  }

  if (recipientBcc) {
    recipients += `, bcc: ${recipientBcc}`;
  }

  return recipients;
};

export const getRecipientsFull = (parsed) => {
  let recipientTo = "";

  for (const to of parsed.to) {
    const delim = recipientTo.length > 0 ? ", " : "";

    recipientTo += delim + (to.name ? `${to.name} <${to.email}>` : `<${to.email}>`);
  }

  let recipientCc = "";

  for (const cc of parsed.cc) {
    const delim = recipientCc.length > 0 ? ", " : "";

    recipientCc += delim + (cc.name ? `${cc.name} <${cc.email}>` : `<${cc.email}>`);
  }

  let recipients = `To: ${recipientTo.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;

  if (recipientCc) {
    recipients += `<br/>Cc: ${recipientCc.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
  }

  return recipients;
};

export const getRecipientsCcFull = (parsed) => {
  let recipientCc = "";

  for (const cc of parsed.cc) {
    const delim = recipientCc.length > 0 ? ", " : "";

    recipientCc += delim + (cc.name ? `${cc.name} ${cc.email}` : cc.email);
  }

  let recipients;

  if (recipientCc) {
    recipients += `Cc: ${recipientCc}`;
  }

  return recipients;
};

export const parseNameAndEmail = (value) => {
  if (!value) return { name: "", email: "" };

  const delimiterIndex = value.lastIndexOf(" ");

  let name;
  let email;

  if (delimiterIndex === -1) {
    email = value[0] === "<" ? value.slice(1, value.length - 1) : value.slice(0, value.length);
  } else {
    name = value[0] === '"' ? value.slice(1, delimiterIndex - 1) : value.slice(0, delimiterIndex);
    email = value.slice(delimiterIndex + 2, value.length - 1);
  }

  let person;

  if (name) {
    person = { name, email };
  } else {
    person = { email };
  }

  return person;
};

export const parseInitialsAndName = (person) => {
  const name = person.name || person.email.split("@")[0];

  let splitted;

  if (person.name) {
    splitted = person.name?.split(" ");
  }

  if (!splitted) {
    splitted = person.email[0];
  }
  const initials = splitted[0][0] // splitted[1] ? splitted[0][0] + splitted[1][0] : splitted[0][0]
    .toUpperCase();

  return { name, initials };
};

export const parseDisplayDate = (value) => {
  let displayDate = "";

  if (value) {
    value = value.replace(/\s+/g, " ");

    const splitted = value.split(" ");
    const currentYear = new Date().getFullYear();

    if (splitted.length > 3) {
      let displayTime = splitted[3].split(":");

      displayDate = `${splitted[1]} ${splitted[2]}, ${displayTime[0]}:${displayTime[1]}${
        splitted[splitted.length - 1] == currentYear ? "" : ", " + splitted[splitted.length - 1]
      }`;
    }
  }

  return displayDate;
};

export const parseDisplayDbDate = (value) => {
  let displayDate = "";

  if (value) {
    value = value.toString().replace(/\s+/g, " ");

    const splitted = value.split(" ");
    const currentYear = new Date().getFullYear();

    if (splitted.length > 3) {
      let displayTime = splitted[4].split(":");

      displayDate = `${splitted[1]} ${splitted[2]}, ${displayTime[0]}:${displayTime[1]}${
        splitted[3] == currentYear ? "" : ", " + splitted[3]
      }`;
    }
  }

  return displayDate;
};

const getPartIfNotContainer = (part) => {
  if (part?.headers) {
    const contentType = part.headers["Content-Type"];
    const contentTransferEnconding = part.headers["Content-Transfer-Encoding"];
    const contentDisposition = part.headers["Content-Disposition"];
    const contentId = part.headers["Content-ID"];

    let isContainer;

    if (Array.isArray(contentType)) {
      const items = contentType.filter((item) => item["Content-Type"]?.startsWith("multipart/"));
      isContainer = items.length > 0;
    } else {
      isContainer = contentType && contentType.startsWith("multipart/");
    }

    if (!isContainer) {
      const result = {};

      if (part.body) {
        result.body = part.body;
      }

      if (contentType) {
        result["Content-Type"] = contentType;
      }

      if (contentTransferEnconding) {
        result["Content-Transfer-Encoding"] = contentTransferEnconding;
      }

      if (contentDisposition) {
        result["Content-Disposition"] = contentDisposition;
      }

      if (contentId) {
        result["Content-ID"] = contentId;
      }

      if (Object.keys(result).length > 0) {
        return result;
      }
    }
  }
};

const getPartsWithContainersExcluded = (payload) => {
  const result = [];

  if (!payload) {
    return result;
  }

  const part = getPartIfNotContainer(payload);
  if (part) {
    result.push(part);
  }

  if (payload.parts) {
    payload.parts.filter((part) => {
      result.push(...getPartsWithContainersExcluded(part));
    });
  }

  return result;
};

const parseParts = (payload) => {
  const partsWithContainersExcluded = getPartsWithContainersExcluded(payload);

  let plainContent;
  let htmlContent;

  const plainPart = partsWithContainersExcluded.find((part) => {
    return !Array.isArray(part["Content-Type"]) && part["Content-Type"] && part["Content-Type"].startsWith("text/plain");
  });

  const htmlPart = partsWithContainersExcluded.find((part) => {
    return !Array.isArray(part["Content-Type"]) && part["Content-Type"] && part["Content-Type"].startsWith("text/html");
  });

  const attachmentsDisposition = partsWithContainersExcluded.filter((part) =>
    part["Content-Disposition"]?.startsWith("attachment")
  );

  const link = `${window.apiHost}/api/v1/files/`;
  const attachments = [];

  for (const attachmentDisposition of attachmentsDisposition) {
    let attachmentFileName = attachmentDisposition["Content-Disposition"].split("filename=").pop();
    if (attachmentFileName) {
      attachmentFileName = attachmentFileName.replace(/^"(.+(?="$))"$/, "$1");
    }

    const attachmentContentType = attachmentDisposition["Content-Type"].find(
      (item) => !item.startsWith("message/external-body;")
    );

    const externalContent = attachmentDisposition["Content-Type"].find((item) => item.startsWith("message/external-body"));

    const contentAddressedUri = attachmentDisposition["Content-Type"].find((item) =>
      item.includes('access-type="x-content-addressed-uri"')
    );

    const sha256Algorithm = attachmentDisposition["Content-Type"].find((item) => item.includes('hash-algorithm="sha256"'));

    let contentId;

    if (attachmentDisposition["Content-ID"]) {
      const value = attachmentDisposition["Content-ID"];

      if (value.length > 2) {
        contentId = value[0] === "<" ? value.slice(1, value.length - 1) : value.slice(0, value.length);
      }
    }

    let attachmentSize;

    if (externalContent && contentAddressedUri) {
      attachmentSize = externalContent.split("size=").pop();

      const quotedStrings = attachmentSize.split('"');
      if (quotedStrings?.length > 1) {
        attachmentSize = quotedStrings[1];
      } else {
        attachmentSize = undefined;
      }
    }

    if (contentId && attachmentFileName && attachmentSize) {
      const contentType = attachmentContentType ? { contentType: attachmentContentType } : undefined;
      attachments.push({
        digest: contentId,
        ...contentType,
        fileName: attachmentFileName,
        size: parseInt(attachmentSize),
      });
    }
  }

  if (plainPart?.["Content-Transfer-Encoding"] == "base64") {
    plainContent = plainPart?.body?.data ? b64DecodeUtf8(plainPart.body.data) : undefined;
  } else {
    plainContent = plainPart?.body?.data ? plainPart.body.data : undefined;
  }

  if (htmlPart?.["Content-Transfer-Encoding"] == "base64") {
    htmlContent = htmlPart?.body?.data ? b64DecodeUtf8(htmlPart.body.data) : undefined;
  } else {
    htmlContent = htmlPart?.body?.data ? htmlPart.body.data : undefined;
  }

  return { plainContent, htmlContent, attachments };
};

export const parsePayload = (id, payload) => {
  const xOriginResourceMailboxUrl = payload?.headers?.["X-Origin-Resource-Mailbox-URL"];
  const xDestinationResourceMailboxUrl = payload?.headers?.["X-Destination-Resource-Mailbox-URL"];
  const messageId = payload?.headers?.["Message-ID"];
  const xThreadId = payload?.headers?.["X-Thread-ID"];
  const inReplyTo = payload?.headers?.["In-Reply-To"];
  const references = payload?.headers?.["References"];
  const date = payload?.headers?.["Date"] || "";
  const from = payload?.headers?.["From"] || "";

  const to = (payload?.headers?.["To"]?.split(",") || []).map((recipient) => {
    return parseNameAndEmail(recipient.trim());
  });

  const cc = (payload?.headers?.["Cc"]?.split(",") || []).map((recipient) => {
    return parseNameAndEmail(recipient.trim());
  });

  const bcc = (payload?.headers?.["Bcc"]?.split(",") || []).map((recipient) => {
    return parseNameAndEmail(recipient.trim());
  });

  const subject = payload?.headers?.["Subject"] || "";

  try {
    const { plainContent = "", htmlContent = "", attachments = [] } = payload ? parseParts(payload) : {};

    const obj = {
      xOriginResourceMailboxUrl,
      xDestinationResourceMailboxUrl,
      messageId,
      xThreadId,
      inReplyTo,
      references,
      date,
      from,
      to,
      cc,
      bcc,
      subject,
      plainContent,
      htmlContent,
      attachments,
    };

    // remove blank attributes from an Object
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null));
  } catch (e) {
    console.log(`message id: ${id}`);
    console.log(e);
    return {
      xOriginResourceMailboxUrl,
      xDestinationResourceMailboxUrl,
      messageId,
      xThreadId,
      inReplyTo,
      references,
      date,
      from,
      to,
      cc,
      bcc,
      subject,
      plainContent: `Parse failed for Message ${id}`,
      htmlContent: `<span>Parse failed for Message ${id}</span>`,
      attachments: [],
    };
  }
};

const composeNameAndEmail = (recipients) => {
  let result = "";

  recipients.forEach((recipient, i) => {
    if (recipient?.name) {
      result += `${recipient.name} <${recipient.email}>`;
    } else {
      result += `<${recipient.email}>`;
    }

    if (i < recipients.length - 1) {
      result = `${result}, `;
    }
  });

  return result;
};

export const composePayload = (parsed) => {
  const payload = { headers: {} };

  if (parsed.date !== undefined) {
    payload.headers["Date"] = parsed.date;
  }

  if (parsed.from !== undefined) {
    payload.headers["From"] = parsed.from;
  }

  if (parsed.to?.length > 0) {
    payload.headers["To"] = composeNameAndEmail(parsed.to);
  } else {
    delete payload.headers["To"];
  }

  if (parsed.cc?.length > 0) {
    payload.headers["Cc"] = composeNameAndEmail(parsed.cc);
  } else {
    delete payload.headers["Cc"];
  }

  if (parsed.bcc?.length > 0) {
    payload.headers["Bcc"] = composeNameAndEmail(parsed.bcc);
  } else {
    delete payload.headers["Bcc"];
  }

  if (parsed.subject !== undefined) {
    payload.headers["Subject"] = parsed.subject;
  }

  if (parsed.plainContent !== undefined || parsed.htmlContent !== undefined || parsed.attachments?.length > 0) {
    let plainTextPart;
    let htmlTextPart;
    const attachmentParts = [];

    if (parsed.plainContent) {
      plainTextPart = {
        headers: {
          "Content-Disposition": "inline",
          "Content-Type": "text/plain; charset=UTF-8",
          "Content-Transfer-Encoding": "base64",
        },
        body: { data: b64EncodeUtf8(parsed.plainContent) },
      };
    }

    if (parsed.htmlContent) {
      htmlTextPart = {
        headers: {
          "Content-Disposition": "inline",
          "Content-Type": "text/html; charset=UTF-8",
          "Content-Transfer-Encoding": "base64",
        },
        body: { data: b64EncodeUtf8(parsed.htmlContent) },
      };
    }

    if (parsed.attachments?.length > 0) {
      for (const attachment of parsed.attachments) {
        const attachmentPart = {
          headers: {
            "Content-Type": [
              `message/external-body; access-type="x-content-addressed-uri"; hash-algorithm="sha256"; size="${attachment.size}"`,
              attachment.contentType,
            ],
            "Content-Disposition": `attachment; filename="${attachment.fileName}"`,
            "Content-ID": `<${attachment.digest}>`,
          },
        };
        attachmentParts.push(attachmentPart);
      }
    }

    let alternativeTextPart;

    if (plainTextPart && htmlTextPart) {
      alternativeTextPart = {
        headers: { "Content-Type": "multipart/alternative" },
        parts: [],
      };
      alternativeTextPart.parts.push(plainTextPart);
      alternativeTextPart.parts.push(htmlTextPart);
    }

    let mixedAttachmentsPart;

    if (attachmentParts.length > 0) {
      mixedAttachmentsPart = {
        headers: { "Content-Type": "multipart/mixed" },
        parts: attachmentParts,
      };
    }

    if ((plainTextPart || htmlTextPart || alternativeTextPart) && mixedAttachmentsPart) {
      payload.headers["Content-Type"] = "multipart/mixed";
      payload.parts = [];

      if (alternativeTextPart) {
        payload.parts.push(alternativeTextPart);
      } else if (plainTextPart) {
        payload.parts.push(plainTextPart);
      } else if (htmlTextPart) {
        payload.parts.push(htmlTextPart);
      }

      payload.parts.push(mixedAttachmentsPart);
    } else if (plainTextPart || htmlTextPart || alternativeTextPart) {
      if (alternativeTextPart) {
        payload.headers = {
          ...payload.headers,
          ...alternativeTextPart.headers,
        };
        payload.parts = alternativeTextPart.parts;
      } else if (plainTextPart) {
        payload.headers = { ...payload.headers, ...plainTextPart.headers };
        payload.body = plainTextPart.body;
      } else if (htmlTextPart) {
        payload.headers = { ...payload.headers, ...htmlTextPart.headers };
        payload.body = htmlTextPart.body;
      }
    } else if (mixedAttachmentsPart) {
      payload.parts = [];
      payload.parts.push(mixedAttachmentsPart);
    }
  }

  return payload;
};

const subjectSnippetMaxLength = 100;
const plainTextSnippetMaxLength = 160;

export const createSubjectSnippet = (str) => {
  if (str?.length > subjectSnippetMaxLength) {
    return str.slice(0, subjectSnippetMaxLength) + "...";
  }
  return str;
};

export const createPlainContentSnippet = (str) => {
  if (str?.length > plainTextSnippetMaxLength) {
    return str.slice(0, plainTextSnippetMaxLength) + "...";
  }
  return str;
};

// https://stackoverflow.com/questions/6249095/how-to-set-the-caret-cursor-position-in-a-contenteditable-element-div
// https://codepen.io/jeffward/pen/OJjPKYo?editors=1010
export const setCaretPosition = (container, position) => {
  if (position >= 0) {
    const selection = window.getSelection();
    const range = createRange(container, { count: position });

    if (range) {
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }
};

export const getCaretPosition = (container) => {
  var selection = window.getSelection();
  var charCount = -1;
  var node;
  if (selection.focusNode != null) {
    if (isDescendantOf(selection.focusNode, container)) {
      node = selection.focusNode;
      charCount = selection.focusOffset;
      while (node != null) {
        if (node == container) {
          break;
        }
        if (node.previousSibling != null) {
          node = node.previousSibling;
          charCount += node.textContent.length;
        } else {
          node = node.parentNode;
          if (node == null) {
            break;
          }
        }
      }
    }
  }
  return charCount;
};

const isDescendantOf = (node, parent) => {
  while (node != null) {
    if (node == parent) {
      return true;
    }
    node = node.parentNode;
  }
  return false;
};

const createRange = (node, chars, range) => {
  if (range == null) {
    range = window.document.createRange();
    range.selectNode(node);
    range.setStart(node, 0);
  }
  if (chars.count == 0) {
    range.setEnd(node, chars.count);
  } else if (node != null && chars.count > 0) {
    if (node.nodeType == 3) {
      if (node.textContent.length < chars.count) {
        chars.count -= node.textContent.length;
      } else {
        range.setEnd(node, chars.count);
        chars.count = 0;
      }
    } else {
      var _g = 0;
      var _g1 = node.childNodes.length;
      while (_g < _g1) {
        var lp = _g++;
        range = createRange(node.childNodes[lp], chars, range);
        if (chars.count == 0) {
          break;
        }
      }
    }
  }
  return range;
};
