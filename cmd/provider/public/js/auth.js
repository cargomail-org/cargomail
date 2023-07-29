const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');

if (registerForm) {
  registerForm.onsubmit = async (e) => {
    e?.preventDefault();

    const form = e.currentTarget;
  
    const formData = {
      username: form.querySelector('input[name="username"]').value,
      password: form.querySelector('input[name="password"]').value,
    };
  
    const confirmation = form.querySelector('input[name="confirmation"]').value;
  
    const alert = form.querySelector('div[name="alert"]')
    if (alert) alert.remove();
  
    if (formData.password != confirmation) {
      form.insertAdjacentHTML(
        "beforeend",
        `<div class="alert alert-warning alert-dismissible fade show" role="alert" name="alert">
          Passwords do NOT match
           <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>`
      );
      return
    }

    const response = await api(form.id, 201, "/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
  
    if (response === false) {
      return;
    }

    window.location.href="/login";  
  };
}

if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e?.preventDefault();

    const form = e.currentTarget;
  
    const formData = {
      username: form.querySelector('input[name="username"]').value,
      password: form.querySelector('input[name="password"]').value,
      rememberMe: form.querySelector('input[name="rememberMe"]').checked,
    };

    const response = await api(form.id, 200, "/api/v1/auth/authenticate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
  
    if (response === false) {
      return;
    }
  
    window.location.href="/";
  };
}


