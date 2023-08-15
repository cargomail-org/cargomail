const formdata = new FormData();

const blobPlain = new Blob(
  [
    `
    Hi everybody!

    Thanks for accepting.

    Best`,
  ],
  { type: "text/plain; charset=UTF-8" }
);

const blobHtml = new Blob(
  [
    `
    <html>
    <h2>Hi everybody!</h2>
    <i>Thanks for accepting.</i></br>
    </br>
    Best
    </html>`,
  ],
  { type: "text/html; charset=UTF-8" }
);

const blobFiles = new Blob(
  [
    JSON.stringify([
      { contentType: "application/pdf", uri: "abc", size: 25100 },
      { contentType: "video/mp4", uri: "efg", size: 195700 },
    ]),
  ],
  { type: "application/json" }
);

formdata.append("bodies", blobPlain, "dc8c8ff247cf8829415cd1ec5d023eea");

formdata.append("bodies", blobHtml, "cb6dae8bbd7a557a5fa795a32a48c972");

formdata.append("bodies", blobFiles, "dc8c8ff247cf8829415cd1ec5d023eea");

const headers = new Headers();
headers.append(
  "Original-Subject",
  encodeURIComponent("Any text / it can be used as an alt subject!")
);

const requestOptions = {
  method: "PUT",
  headers: headers,
  credentials: "include",
  body: formdata,
  redirect: "follow",
};

fetch("http://127.0.0.1:8181/api/v1/bodies/upload", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
