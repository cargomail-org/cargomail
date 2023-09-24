import { parseNameAndEmail } from "/public/js/utils.js";

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

  let splitted;

  if (person.name) {
    splitted = person.name?.split(" ");
  }

  if (!splitted) {
    splitted = person.email[0];
  }
  const initials = (
    splitted[1] ? splitted[0][0] + splitted[1][0] : splitted[0][0]
  ).toUpperCase();

  splitted = parsed.date.split(" ");

  const currentYear = new Date().getFullYear();

  let displayDate = "";

  if (splitted.length > 3) {
    let displayTime = splitted[3].split(":");

    displayDate = `${splitted[1]} ${splitted[2]}, ${displayTime[0]}:${
      displayTime[1]
    } ${
      splitted[splitted.length - 1] == currentYear
        ? ""
        : "," + splitted[splitted.length - 1]
    }`;
  }

  const htmlDropdownMenu = `    
    <div class="message-row-dropdown">
        <button class="btn m-0 p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-three-dots-vertical" viewBox="0 0 16 16">
                <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
            </svg>
        </button>
        <ul class="dropdown-menu dropdown-menu-light">
            <li><a class="dropdown-item" href="#">Reply</a></li>
            <li><a class="dropdown-item href="#">Reply to all</a></li>
            <li><hr class="dropdown-divider border-top border-secondary"></li>
            <li><a class="dropdown-item href="#">Forward</a></li>
        </ul>
    </div>
    `;

  const attachmentIcon = `
    <div class="unstarred">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-paperclip" viewBox="0 0 16 16">
            <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
        </svg>
    </div>
`;

  const starredIcon = `
    <div class="unstarred">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
            <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
        </svg>
    </div>
`;

  const unstarredIcon = `
    <div class="unstarred">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
            <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
        </svg>
    </div>
`;

  const htmlFlex = `
    <div class="message-row">
        <div class="message-row-icon">
            <div class="rounded-circle border d-flex justify-content-center align-items-center" style="width:34px;height:34px;background-color:${stringToHslColor(
              person.name || person.email.split("@")[0],
              30,
              80
            )};" alt="Avatar">${initials}</div>
        </div>
        <div class="message-row-content">
            <div class="message-row-header">
                <div class="message-row-person">
                    <div class="message-row-fullname">${
                      person.name?.length > 0
                        ? person.name
                        : person.email.split("@")[0]
                    }</div>
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
            <div class="message-row-message">
                ${parsed.plainContent}
            </div>
        </div>
    </div>
`;

  return htmlFlex;
};
