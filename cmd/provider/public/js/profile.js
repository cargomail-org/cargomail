const profileForm = document.getElementById("profileForm");

profileForm.onsubmit = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;

  const formData = {
    firstname: form.querySelector('input[name="firstname"]').value,
    lastname: form.querySelector('input[name="lastname"]').value,
  };

  const response = await api(form.id, 200, "/api/v1/user/profile", {
    method: "PATCH",
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
