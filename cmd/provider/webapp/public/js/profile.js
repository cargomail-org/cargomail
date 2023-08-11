const profileForm = document.getElementById("profileForm");

(async () => {
  const response = await api(null, 200, "http://127.0.0.1:8181/api/v1/auth/info", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response && response.domain_name) {
    if (profileForm) {
      profileForm.querySelector('#profileDomainName').innerHTML =
        response.domain_name;
    }
  }
})();

profileForm.onsubmit = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;

  const formData = {
    firstname: form.querySelector('input[name="firstname"]').value,
    lastname: form.querySelector('input[name="lastname"]').value,
  };

  const response = await api(form.id, 200, "http://127.0.0.1:8181/api/v1/user/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
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
};
