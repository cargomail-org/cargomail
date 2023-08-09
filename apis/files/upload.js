const fileInput = document.querySelector('input[type="file"]');

fileInput.addEventListener("change", upload);

function upload() {
  const formdata = new FormData();
  formdata.append("files", fileInput.files[0]);

  const requestOptions = {
    method: "POST",
    credentials: "include",
    body: formdata,
    redirect: "follow",
  };

  fetch("http://127.0.0.1:8181/api/v1/files/upload", requestOptions)
    .then((response) => response.text())
    .then((result) => console.log(result))
    .catch((error) => console.log("error", error));
}
