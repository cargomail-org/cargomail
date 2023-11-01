import { parseNameAndEmail, parseInitialsAndName, parseDisplayDate, getRecipientsShort } from "/public/js/utils.js";
import { threeDotIcon, attachmentIcon, starredIcon, unstarredIcon } from "/public/js/icons.js";

import { parsePayload } from "/public/js/utils.js";
import { getProfileUsername } from "/public/js/profile.js";

// https://codepen.io/sergiopedercini/pen/RLJYLj/
function stringToHslColor(str, s, l) {
  if (str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    const h = hash % 360;
    return "hsl(" + h + ", " + s + "%, " + l + "%)";
  }

  return "hsl(" + 0 + ", " + 0 + "%, " + 0 + "%)";
}

export const createMessageRow = (full) => {
  const id = full.id;
  const parsed = parsePayload(full.id, full.payload);
  const person = parseNameAndEmail(parsed.from);
  const displayPerson = parseInitialsAndName(person);
  const displayDate = parseDisplayDate(parsed.date);

  let displayPersonName = displayPerson.name;
  let personEmail = person.email;

  if (full.unread) {
    if (displayPersonName) {
      displayPersonName = `<b>${displayPersonName}</b>`;
    }

    if (personEmail) {
      personEmail = `<b>${personEmail}</b>`;
    }
  }

  const htmlDropdownMenu = `    
    <div class="message-row-dropdown">
        <button class="btn button-dropdown m-0 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          ${threeDotIcon}
        </button>
        <ul class="dropdown-menu dropdown-menu-light">
            <li><a class="dropdown-item message-reply" id="${id}" href="#">Reply</a></li>
            <li><a class="dropdown-item message-reply-all" id="${id}" href="#">Reply to all</a></li>
            <li><hr class="dropdown-divider border-top border-secondary"></li>
            <li><a class="dropdown-item message-forward" id="${id}" href="#">Forward</a></li>
        </ul>
    </div>
    `;

  const profileUsername = getProfileUsername();

  const recipients = getRecipientsShort(profileUsername, parsed);

  const htmlFlex = `
      <div class="message-row">
          <div class="message-row-icon">
              <div class="rounded-circle border d-flex justify-content-center align-items-center" style="width:34px;height:34px;background-color:${stringToHslColor(
                person.email,
                30,
                80
              )};" alt="Avatar">${displayPerson.initials}</div>
          </div>
          <div class="message-row-content">
              <div class="message-row-header">
                  <div class="message-row-person">
                      <div class="message-row-fullname">${displayPersonName}</div>
                      <div class="message-row-email">${personEmail}</div>
                  </div>    
                  <div class="message-row-space-1"></div>
                  <div class="message-row-attch">${parsed.attachments.length > 0 ? attachmentIcon : ""}</div>
                  <div class="message-row-date">${displayDate}</div>
                  <div class="message-row-starred">${unstarredIcon}</div>
                  ${htmlDropdownMenu}
              </div>
              <div class="message-row-message">${parsed.plainContent}</div>
              <div class="message-row-recipients">${recipients}</div>
          </div>
      </div>
    `;

  return htmlFlex;
};
