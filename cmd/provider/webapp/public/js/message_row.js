import { parseNameAndEmail, parseInitialsAndName, parseDisplayDate } from "/public/js/utils.js";
import { threeDotIcon, attachmentIcon, starredIcon, unstarredIcon } from "/public/js/icons.js";

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

export const createMessageRow = (parsed) => {
  const person = parseNameAndEmail(parsed.from);
  const displayPerson = parseInitialsAndName(person);
  const displayDate = parseDisplayDate(parsed.date)

  const htmlDropdownMenu = `    
    <div class="message-row-dropdown">
        <button class="btn m-0 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
          ${threeDotIcon}
        </button>
        <ul class="dropdown-menu dropdown-menu-light">
            <li><a class="dropdown-item" href="#">Reply</a></li>
            <li><a class="dropdown-item href="#">Reply to all</a></li>
            <li><hr class="dropdown-divider border-top border-secondary"></li>
            <li><a class="dropdown-item href="#">Forward</a></li>
        </ul>
    </div>
    `;



  const htmlFlex = `
    <div class="message-row">
        <div class="message-row-icon">
            <div class="rounded-circle border d-flex justify-content-center align-items-center" style="width:34px;height:34px;background-color:${stringToHslColor(
              displayPerson.name,
              30,
              80
            )};" alt="Avatar">${displayPerson.initials}</div>
        </div>
        <div class="message-row-content">
            <div class="message-row-header">
                <div class="message-row-person">
                    <div class="message-row-fullname">${displayPerson.name}</div>
                    <div class="message-row-email">${person.email}</div>
                </div>    
                <div class="message-row-space"></div>
                <div class="message-row-attch">${
                  parsed.attachments.length > 0 ? attachmentIcon : ""
                }</div>
                <div class="message-row-date">${displayDate}</div>
                <div class="message-row-starred">${unstarredIcon}</div>
                ${htmlDropdownMenu}
            </div>
            <div class="message-row-message">${parsed.plainContent}</div>
        </div>
    </div>
`;

  return htmlFlex;
};
