let profileForm;

function composeContent(e) {
  e?.preventDefault();

  document.getElementById("messagesLink").classList.remove("active");
  document.getElementById("userLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = false;
  document.getElementById("composeLink").classList.add("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLink").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLink").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLink").classList.remove("active");

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

function inboxContent(e) {
  document.getElementById("messagesLink").classList.add("active");
  document.getElementById("userLink").classList.remove("active");

  const messagesIcon = document.getElementById("messagesIcon");

  const selectedClassName = e.getElementsByTagName("i")[0].className;

  messagesIcon.className = selectedClassName;

  document.getElementById("inboxLink").classList.remove("active");
  document.getElementById("sentLink").classList.remove("active");
  document.getElementById("draftsLink").classList.remove("active");

  e.classList.add("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = false;
  document.getElementById("inboxLink").classList.add("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLink").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLink").classList.remove("active");

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
}

function sentContent(e) {
  document.getElementById("messagesLink").classList.add("active");
  document.getElementById("userLink").classList.remove("active");

  const messagesIcon = document.getElementById("messagesIcon");

  const selectedClassName = e.getElementsByTagName("i")[0].className;

  messagesIcon.className = selectedClassName;

  document.getElementById("inboxLink").classList.remove("active");
  document.getElementById("sentLink").classList.remove("active");
  document.getElementById("draftsLink").classList.remove("active");

  e.classList.add("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLink").classList.remove("active");

  document.getElementById("sentContainer").hidden = false;
  document.getElementById("sentLink").classList.add("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLink").classList.remove("active");

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
}

function draftsContent(e) {
  document.getElementById("messagesLink").classList.add("active");
  document.getElementById("userLink").classList.remove("active");

  const messagesIcon = document.getElementById("messagesIcon");

  const selectedClassName = e.getElementsByTagName("i")[0].className;

  messagesIcon.className = selectedClassName;

  document.getElementById("inboxLink").classList.remove("active");
  document.getElementById("sentLink").classList.remove("active");
  document.getElementById("draftsLink").classList.remove("active");

  e.classList.add("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLink").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLink").classList.remove("active");

  document.getElementById("draftsContainer").hidden = false;
  document.getElementById("draftsLink").classList.add("active");

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
}

function filesContent(e) {
  e?.preventDefault();

  document.getElementById("messagesLink").classList.remove("active");
  document.getElementById("userLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLink").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLink").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLink").classList.remove("active");

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

function contactsContent(e) {
  e?.preventDefault();

  document.getElementById("userLink").classList.add("active");

  document.getElementById("messagesLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLink").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLink").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLink").classList.remove("active");

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

function profileContent(e) {
  e?.preventDefault();

  document.getElementById("userLink").classList.add("active");

  document.getElementById("messagesLink").classList.remove("active");

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("inboxContainer").hidden = true;
  document.getElementById("inboxLink").classList.remove("active");

  document.getElementById("sentContainer").hidden = true;
  document.getElementById("sentLink").classList.remove("active");

  document.getElementById("draftsContainer").hidden = true;
  document.getElementById("draftsLink").classList.remove("active");

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

  loadProfile(profileForm);
}

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const loadProfile = async (form) => {
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

  document.getElementById(
    "profileUsername"
  ).innerHTML = `${response.username}@${profileDomainName}`;

  form.querySelector('input[name="firstName"]').value = response.firstName;
  form.querySelector('input[name="lastName"]').value = response.lastName;

  return response.username;
};

const downloadURI = (formId, uri, name) => {
  (async () => {
    const response = await api(formId, 200, uri, {
      method: "HEAD",
      headers: {
        Accept: "application/json",
      },
    });

    if (response === false) {
      return;
    }

    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    link.click();
  })();
};
