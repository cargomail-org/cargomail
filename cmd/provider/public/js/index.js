let profileForm;

document.addEventListener("DOMContentLoaded", function () {
  filesContent(); // in prod should be cargoesContent

  profileForm = document.getElementById("profileForm");
  loadProfile(profileForm);
});

function composeContent(e) {
  e?.preventDefault();

  document.getElementById("composeContainer").hidden = false;
  document.getElementById("composeLink").classList.add("active");

  document.getElementById("cargoesContainer").hidden = true;
  document.getElementById("cargoesLink").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = false;
  document.getElementById("cargoesPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;
}

function cargoesContent(e) {
  e?.preventDefault();

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("cargoesContainer").hidden = false;
  document.getElementById("cargoesLink").classList.add("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("cargoesPanel").hidden = false;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;
}

function filesContent(e) {
  e?.preventDefault();

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("cargoesContainer").hidden = true;
  document.getElementById("cargoesLink").classList.remove("active");

  document.getElementById("filesContainer").hidden = false;
  document.getElementById("filesLink").classList.add("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("cargoesPanel").hidden = true;
  document.getElementById("filesPanel").hidden = false;
  document.getElementById("contactsPanel").hidden = true;
  document.getElementById("profilePanel").hidden = true;
}

function contactsContent(e) {
  e?.preventDefault();

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("cargoesContainer").hidden = true;
  document.getElementById("cargoesLink").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = false;
  document.getElementById("contactsLink").classList.add("active");

  document.getElementById("profileContainer").hidden = true;
  document.getElementById("profileLink").classList.remove("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("cargoesPanel").hidden = true;
  document.getElementById("filesPanel").hidden = true;
  document.getElementById("contactsPanel").hidden = false;
  document.getElementById("profilePanel").hidden = true;
}

function profileContent(e) {
  e?.preventDefault();

  document.getElementById("composeContainer").hidden = true;
  document.getElementById("composeLink").classList.remove("active");

  document.getElementById("cargoesContainer").hidden = true;
  document.getElementById("cargoesLink").classList.remove("active");

  document.getElementById("filesContainer").hidden = true;
  document.getElementById("filesLink").classList.remove("active");

  document.getElementById("contactsContainer").hidden = true;
  document.getElementById("contactsLink").classList.remove("active");

  document.getElementById("profileContainer").hidden = false;
  document.getElementById("profileLink").classList.add("active");

  document.getElementById("composePanel").hidden = true;
  document.getElementById("cargoesPanel").hidden = true;
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
  const response = await api(form.id, 200, "/api/v1/user/profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response === false) {
    return;
  }

  const loggedUsername =
    response.firstname.length > 0 ? response.firstname : response.username;

  if (loggedUsername?.length) {
    document.getElementById("loggedUsernameLetter").innerHTML = loggedUsername
      .charAt(0)
      .toUpperCase();
    document.getElementById("loggedUsername").innerHTML = loggedUsername;
  }

  const profileDomainName = document.getElementById("profileDomainName").innerHTML;

  document.getElementById("profileUsername").innerHTML = `${response.username}@${profileDomainName}`;

  form.querySelector('input[name="firstname"]').value = response.firstname;
  form.querySelector('input[name="lastname"]').value = response.lastname;
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
