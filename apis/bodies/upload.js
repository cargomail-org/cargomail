const formdata = new FormData();
formdata.append("Subject", "Meeting 1");


const blob = new Blob(["Hello World!"], { type: "plain/text" });
formdata.append("bodies", blob, "readme.txt");

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