const raw = JSON.stringify({
  username: "alice",
  password: "password",
});

const requestOptions = {
  method: "POST",
  credentials: "include",
  body: raw,
  redirect: "follow",
};

fetch("http://127.0.0.1:8181/api/v1/auth/authenticate", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));