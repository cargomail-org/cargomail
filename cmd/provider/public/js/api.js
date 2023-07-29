const parseJSON = async (response) => {
  if (
    response.status === 204 ||
    response.status === 205 ||
    parseInt(response.headers.get("content-length")) === 0
  ) {
    return null;
  }
  return await response.json();
};

const api = async (formId, status, url, options) => {
  const form = document.getElementById(formId);

  const alert = form.querySelector('div[name="alert"]');
  if (alert) alert.remove();
  let response;

  let spinner = document.querySelector(".menu-spinner");
  if (!spinner) {
    spinner = document.querySelector(".base-spinner");
  }

  let loading = true;
  setTimeout(() => {
    if (loading) {
      spinner.hidden = false;
    }
  }, "200");
  try {
    const result = await fetch(url, options);

    if (options.method != "HEAD") {
      response = await parseJSON(result);
    }

    if (result.status != status) {
      const error = new Error(result.statusText);
      error.response = response;
      throw error;
    }
  } catch (error) {
    let errMessage = "unknown error";
    if (
      error != null &&
      "response" in error &&
      error.response != null &&
      error.response.Err
    ) {
      errMessage =
        error.response.Err.charAt(0).toUpperCase() +
        error.response.Err.slice(1);
    } else if (error != null) {
      errMessage = error.message;
    }

    form.insertAdjacentHTML(
      "beforeend",
      `<div class="alert alert-warning alert-dismissible fade show" role="alert" name="alert">
                ${errMessage}
                 <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
           </div>`
    );
    return false;
  } finally {
    loading = false;
    spinner.hidden = true;
  }

  return response;
};
