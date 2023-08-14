const profileForm = document.getElementById("profileForm");

profileForm.onsubmit = async (e) => {
  e.preventDefault();

  const form = e.currentTarget;

  const formData = {
    firstName: form.querySelector('input[name="firstName"]').value,
    lastName: form.querySelector('input[name="lastName"]').value,
  };

  const response = await api(
    form.id,
    200,
    `${window.apiHost}/api/v1/user/profile`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    }
  );

  if (response === false) {
    return;
  }

  const loggedUsername =
    response.firstName.length > 0 ? response.firstName : response.username;

  if (loggedUsername?.length) {
    document.getElementById("loggedUsernameLetter").innerHTML = loggedUsername
      .charAt(0)
      .toUpperCase();
    document.getElementById("loggedUsername").innerHTML = loggedUsername;
  }
};
