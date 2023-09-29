import {
  parsePayload,
  parseNameAndEmail,
  createSubjectSnippet,
  createPlainContentSnippet,
  parseDisplayDate,
  getRecipientsShort,
} from "/public/js/utils.js";
import {
  attachmentIcon,
  starredIcon,
  unstarredIcon,
} from "/public/js/icons.js";

import { getProfileUsername } from "/public/js/profile.js";

const MAX_DISPLAYED_ATTACHMENTS = 3;

export const createDraftRow = (type, parsed) => {
  const person = parseNameAndEmail(parsed.from);
  const displayDate = parseDisplayDate(parsed.date);

  const profileUsername = getProfileUsername();

  const recipients = getRecipientsShort(profileUsername, parsed);

  const link = `${window.apiHost}/api/v1/files/`;
  const attachmentLinks = [];

  let moreAttachments = 0;

  for (const attachment of parsed.attachments) {
    if (attachmentLinks.length < MAX_DISPLAYED_ATTACHMENTS) {
      const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadId('inboxFormAlert', '${link}${attachment.digest}', '${attachment.fileName}');">${attachment.fileName}</a>`;
      attachmentLinks.push(attachmentAnchor);
    } else {
      moreAttachments += 1;
    }
  }

  const subject =
    type === "display" ? createSubjectSnippet(parsed.subject) : parsed.subject;
  let plainContent =
    type === "display"
      ? createPlainContentSnippet(parsed.plainContent)
      : parsed.plainContent;

  if (plainContent) {
    plainContent = `<span style="color: gray;">${plainContent}</span>`;
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
  }

  let renderAttachmentLinks = "";

  for (const item of attachmentLinks) {
    renderAttachmentLinks += `<span>${item}  </span>`;
  }

  if (moreAttachments > 0) {
    renderAttachmentLinks += `<span>+${moreAttachments}</span>`;
  }

  const htmlFlex = `
      <div class="draft-row">
          <div class="draft-row-content">
              <div class="draft-row-header">
                  <div class="draft-row-person">
                      <div class="draft-row-fullname">${recipients}</div>
                      <div class="draft-row-email">${person.email}</div>
                  </div>    
                  <div class="draft-row-space"></div>
                  <div class="draft-row-attch">${
                    parsed.attachments.length > 0 ? attachmentIcon : ""
                  }</div>
                  <div class="draft-row-date">${displayDate}</div>
                  <div class="draft-row-starred">${unstarredIcon}</div>
              </div>
              <div class="draft-row-message">${content}</div>
              <div class="draft-row-recipients">${recipients}</div>
              <div class="draft-row-attachments">${renderAttachmentLinks}</div>
          </div>
      </div>
  `;

  return htmlFlex;
};
