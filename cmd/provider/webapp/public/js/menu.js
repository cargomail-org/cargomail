import { getProfileUsername, setProfileUsername, getProfileFullName, setProfileFullName } from "/public/js/profile.js";

export function composeContentPage(e) {
  document.getElementById("messagesLink").classList.remove("active");
  document.getElementById("userLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = false;
  document.getElementById("composeLink").classList.add("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = false;
  document.getElementById("inboxPanel").hidden = true;
  document.getElementById("sentPanel").hidden = true;
  document.getElementById("draftsPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;
}

export function inboxContentPage(e) {
  document.getElementById("messagesLink").classList.add("active");
  document.getElementById("userLink").classList.remove("active");

  const messagesIcon = document.getElementById("messagesIcon");

  const selectedClassName = e.getElementsByTagName("i")[0].className;

  messagesIcon.className = selectedClassName;

  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  e.classList.add("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = false;
  document.getElementById("inboxLinkSm").classList.add("active");
  document.getElementById("inboxLinkLg").classList.add("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("inboxPanel").hidden = false;
  document.getElementById("sentPanel").hidden = true;
  document.getElementById("draftsPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;

  document.getElementById("inboxTable").classList.remove("table-striped");
}

export function sentContentPage(e) {
  document.getElementById("messagesLink").classList.add("active");
  document.getElementById("userLink").classList.remove("active");

  const messagesIcon = document.getElementById("messagesIcon");

  const selectedClassName = e.getElementsByTagName("i")[0].className;

  messagesIcon.className = selectedClassName;

  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  e.classList.add("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");

  document.getElementById("sentContainer").hidden = false;
  document.getElementById("sentLinkSm").classList.add("active");
  document.getElementById("sentLinkLg").classList.add("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("inboxPanel").hidden = true;
  document.getElementById("sentPanel").hidden = false;
  document.getElementById("draftsPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;

  document.getElementById("sentTable").classList.remove("table-striped");
}

export function draftsContentPage(e) {
  document.getElementById("messagesLink").classList.add("active");
  document.getElementById("userLink").classList.remove("active");

  const messagesIcon = document.getElementById("messagesIcon");

  const selectedClassName = e.getElementsByTagName("i")[0].className;

  messagesIcon.className = selectedClassName;

  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  e.classList.add("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");

  document.getElementById("draftsContainer").hidden = false;
  document.getElementById("draftsLinkSm").classList.add("active");
  document.getElementById("draftsLinkLg").classList.add("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("inboxPanel").hidden = true;
  document.getElementById("sentPanel").hidden = true;
  document.getElementById("draftsPanel").hidden = false;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;

  document.getElementById("draftsTable").classList.remove("table-striped");
}

export function filesContentPage(e) {
  document.getElementById("messagesLink").classList.remove("active");
  document.getElementById("userLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  document.getElementById("filesContainer").hidden = false;
  document.getElementById("filesLink").classList.add("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("inboxPanel").hidden = true;
  document.getElementById("sentPanel").hidden = true;
  document.getElementById("draftsPanel").hidden = true;
  document.getElementById("filesPanel").hidden = false;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;
}

export function contactsContentPage(e) {
  document.getElementById("userLink").classList.add("active");

  document.getElementById("messagesLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = false;
  document.getElementById("contactsLink").classList.add("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("inboxPanel").hidden = true;
  document.getElementById("sentPanel").hidden = true;
  document.getElementById("draftsPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = false;
  document.getElementById("profilePanel").hidden = true;
}

export function profileContentPage(e) {
  document.getElementById("userLink").classList.add("active");

  document.getElementById("messagesLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLinkSm").classList.remove("active");
  document.getElementById("inboxLinkLg").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLinkSm").classList.remove("active");
  document.getElementById("sentLinkLg").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLinkSm").classList.remove("active");
  document.getElementById("draftsLinkLg").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = false;
  document.getElementById("profileLink").classList.add("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("inboxPanel").hidden = true;
  document.getElementById("sentPanel").hidden = true;
  document.getElementById("draftsPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = false;

  const profileForm = document.getElementById("profileForm");

  loadProfile(profileForm);
}

export const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const loadProfile = async (form) => {
  const response = await api(
    form.id,
    200,
    `${window.apiHost}/api/v1/user/profile`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (response === false) {
    return;
  }

  const loggedUsername =
    response.firstName.length > 0 ? response.firstName : response.username;

  if (loggedUsername) {
    document.getElementById("loggedUsernameLetter").innerHTML = loggedUsername
      .charAt(0)
      .toUpperCase();
    document.getElementById("loggedUsername").innerHTML = loggedUsername;
  }

  const profileDomainName =
    document.getElementById("profileDomainName").innerHTML;

  const username = `${response.username}@${profileDomainName}`;

  document.getElementById("profileUsername").innerHTML = username;

  setProfileUsername(username);
  setProfileFullName(response.firstName, response.lastName);

  const composeFromInput = document.getElementById("composeFromInput");

  composeFromInput.value = `${getProfileFullName()} <${getProfileUsername()}>`.trim();


  const profileForm = document.getElementById("profileForm");

  profileForm.querySelector('input[name="firstName"]').value =
    response.firstName;
  profileForm.querySelector('input[name="lastName"]').value = response.lastName;

  return response.username;
};
