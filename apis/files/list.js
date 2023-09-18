const requestOptions = {
  method: "POST",
  credentials: "include",
  redirect: "follow",
};

fetch("http://127.0.0.1:8181/api/v1/files/list", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
