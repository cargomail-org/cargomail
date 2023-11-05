const profileForm = await waitForElement('#profileForm');
// const profileForm = document.getElementById("profileForm");

let profileUsername = "";
let profileFullName = "";

profileForm.onsubmit = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;

  const formData = {
    firstName: form.querySelector('input[name="firstName"]').value,
    lastName: form.querySelector('input[name="lastName"]').value,
  };

  const response = await api(form.id, 200, `${window.mailApiHost}/api/v1/user/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (response === false) {
    return;
  }

  setProfile(response);
};

export const setProfile = (value) => {
  const loggedUsername = value.firstName.length > 0 ? value.firstName : value.username;

  if (loggedUsername) {
    document.getElementById("loggedUsernameLetter").innerHTML = loggedUsername.charAt(0).toUpperCase();
    document.getElementById("loggedUsername").innerHTML = loggedUsername;
  }

  const profileDomainName = document.getElementById("profileDomainName").innerHTML;

  const username = `${value.username}@${profileDomainName}`;

  document.getElementById("profileUsername").innerHTML = username;

  setProfileUsername(username);
  setProfileFullName(value.firstName, value.lastName);

  const composeFromInput = document.getElementById("composeFromInput");

  composeFromInput.value = `${getProfileFullName()} <${getProfileUsername()}>`.trim();

  const profileForm = document.getElementById("profileForm");

  profileForm.querySelector('input[name="firstName"]').value = value.firstName;
  profileForm.querySelector('input[name="lastName"]').value = value.lastName;
};

export const getProfileUsername = () => {
  return profileUsername;
};

export const setProfileUsername = (username) => {
  profileUsername = username;
};

export const getProfileFullName = () => {
  return profileFullName;
};

export const setProfileFullName = (firstName, lastName) => {
  if (firstName && lastName) {
    profileFullName = firstName + " " + lastName;
  } else if (firstName) {
    profileFullName = firstName;
  } else if (lastName) {
    profileFullName = lastName;
  }
};
