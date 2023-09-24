import {
  createSubjectSnippet,
  createPlainContentSnippet,
} from "/public/js/utils.js";

export const createThreadRow = (type, parsed) => {
  const link = `${window.apiHost}/api/v1/files/`;
  const attachmentLinks = [];

  for (const attachment of parsed.attachments) {
    const attachmentAnchor = `<a class="attachmentLink" href="javascript:;" onclick="downloadId('inboxFormAlert', '${link}${attachment.digest}', '${attachment.fileName}');">${attachment.fileName}</a>`;
    attachmentLinks.push(attachmentAnchor);
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

  let renderHtml = `<div"><span>${content || "Message"}</span>`;
  if (attachmentLinks.length > 0) {
    renderHtml += `<br/>`;
    for (const item of attachmentLinks) {
      renderHtml += `<span>${item}  </span>`;
    }
  }
  renderHtml += "</div>";

  return renderHtml;
};
