const formdata = new FormData();

const blob = new Blob(["Hello World!"], { type: "plain/text" });
formdata.append(
  "bodies",
  blob,
  encodeURIComponent("Any text / it can be used as an alt subject!")
);

const requestOptions = {
  method: "POST",
  credentials: "include",
  body: formdata,
  redirect: "follow",
};

fetch("http://127.0.0.1:8181/api/v1/bodies/upload", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
