import {
  parsePayload,
  createSubjectSnippet,
  createPlainContentSnippet,
  parseNameAndEmail,
  parseInitialsAndName,
  parseDisplayDbDate,
  getParticipantsFrom,
  getParticipantsTo,
} from "/public/js/utils.js";

import { attachmentIcon, starredIcon, unstarredIcon } from "/public/js/icons.js";

import { getProfileUsername } from "/public/js/profile.js";

const MAX_DISPLAYED_ATTACHMENTS = 3;

export const createThreadRow = (view, type, username, full) => {
  const parsed = parsePayload(full.id, full.payload);
  const messages = full.messages;
  const messagesCount = messages?.length || 0;

  let participants;

  if (view == "sent") {
    participants = getParticipantsTo(username, messages);
  } else if (view == "inbox") {
    participants = getParticipantsFrom(username, messages);
  }

  const link = `${window.mailboxApiHost}/api/v1/files/`;
  const attachmentLinks = [];

  let unread = false;
  let moreAttachments = 0;

  for (const message of messages) {
    if (message.unread && !unread) {
      unread = true;
    }

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

  const lastMessage = messages.at(-1);

  const timestamp = lastMessage.createdAt;

  const date = new Date(timestamp);

  const displayDate = parseDisplayDbDate(date);

  const lastPlainContent = parsePayload(lastMessage.id, lastMessage.payload).plainContent || "";

  let subject = type === "display" ? createSubjectSnippet(parsed.subject) : parsed.subject;
  let plainContent = type === "display" ? createPlainContentSnippet(lastPlainContent) : lastPlainContent;

  if (type === "display" && subject && unread) {
    subject = `<b>${subject}</b>`;
  }

  if (plainContent) {
    plainContent = `<span style="color: gray;">${plainContent.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</span>`;
  }

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

  if (!content) {
    content = "(no subject)";
    
    if (type === "display" && content && unread) {
      content = `<b>${content}</b>`;
    }
  }

  let renderAttachmentLinks = "";

  for (const item of attachmentLinks) {
    renderAttachmentLinks += `<span>${item}  </span>`;
  }

  if (moreAttachments > 0) {
    renderAttachmentLinks += `<span>+${moreAttachments}</span>`;
  }

  const htmlFlex = `
  <div class="thread-row">
      <div class="thread-row-content">
          <div class="thread-row-header">
              <div class="thread-row-person">
                  <div class="thread-row-fullname">${participants}</div>
              </div>
              <div class="thread-row-count">${messagesCount > 1 ? messagesCount : ""}</div>
              <div class="thread-row-space-1"></div>
              <div class="thread-row-attch">${attachmentLinks.length > 0 ? attachmentIcon : ""}</div>
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
