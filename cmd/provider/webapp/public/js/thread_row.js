import {
  parsePayload,
  createSubjectSnippet,
  createPlainContentSnippet,
  parseNameAndEmail,
  parseInitialsAndName,
  parseDisplayDate,
} from "/public/js/utils.js";

import {
  attachmentIcon,
  starredIcon,
  unstarredIcon,
} from "/public/js/icons.js";

const MAX_DISPLAYED_ATTACHMENTS = 3;

export const createThreadRow = (type, messages, parsed) => {
  const messagesCount = messages?.length || 0;

  const person = parseNameAndEmail(parsed.from);
  const displayPerson = parseInitialsAndName(person);
  const displayDate = parseDisplayDate(parsed.date);

  const link = `${window.apiHost}/api/v1/files/`;
  const attachmentLinks = [];

  let moreAttachments = 0;

  for (const message of messages) { // TODO error:  messages is not iterable
    const parsedMessage = parsePayload(message.id, message.payload);

    for (const attachment of parsedMessage.attachments) {
      if (attachmentLinks.length < MAX_DISPLAYED_ATTACHMENTS) {
        const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadId('inboxFormAlert', '${link}${attachment.digest}', '${attachment.fileName}');">${attachment.fileName}</a>`;
        attachmentLinks.push(attachmentAnchor);
      } else {
        moreAttachments += 1;
      }
    }
  }

  const subject =
    type === "display" ? createSubjectSnippet(parsed.subject) : parsed.subject;
  const plainContent =
    type === "display"
      ? createPlainContentSnippet(parsed.plainContent)
      : parsed.plainContent;

  let content;

  if (subject) {
    content = subject;
    if (plainContent) {
      content = subject + " - " + plainContent;
    }
  } else {
    if (plainContent) {
      content = plainContent;
    }
  }

  let renderAttachmentLinks = "";

  for (const item of attachmentLinks) {
    renderAttachmentLinks += `<span>${item}  </span>`;
  }

  if (moreAttachments > 0) {
    renderAttachmentLinks += `<span>+${moreAttachments}</span>`
  }

  const htmlFlex = `
  <div class="thread-row">
      <div class="thread-row-content">
          <div class="thread-row-header">
              <div class="thread-row-person">
                  <div class="thread-row-fullname">${displayPerson.name}</div>
              </div>
              <div class="thread-row-count">${
                messagesCount > 1 ? messagesCount : ""
              }</div>
              <div class="thread-row-space"></div>
              <div class="thread-row-attch">${
                attachmentLinks.length > 0 ? attachmentIcon : ""
              }</div>
            <div class="thread-row-date">${displayDate}</div>
              <div class="thread-row-starred">${unstarredIcon}</div>
          </div>
          <div class="thread-row-message">${content}</div>
          <div class="thread-row-attachments">${renderAttachmentLinks}</div>
      </div>
  </div>
`;

  return htmlFlex;
};
