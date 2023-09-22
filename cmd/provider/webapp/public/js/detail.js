import {
  parsePayload,
  composePayload,
  createSubjectSnippet,
  createPlainContentSnippet,
} from "/public/js/utils.js";

export const showDetail = (data) => {
    const html = `
    <div class="detail">${data.folder}</div>
    `;
return html;
}