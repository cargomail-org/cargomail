const formdata = new FormData();

const blobPlain = new Blob(
  [
    `
    Hi there!

    I'd like to contribute.

    Regards`,
  ],
  { type: "text/plain; charset=UTF-8" }
);

const blobHtml = new Blob(
  [
    `
    <html>
    <h2>Hi there!</h2>
    <i>I'd like to contribute.</i></br>
    </br>
    Regards
    </html>`,
  ],
  { type: "text/html; charset=UTF-8" }
);

const blobFiles = new Blob(
  [
    { contentType: "application/pdf", uri: "123", size: 25100 },
    { contentType: "video/mp4", uri: "456", size: 195700 },
  ],
  { type: "application/json" }
);

formdata.append(
  "bodies",
  blobPlain,
  encodeURIComponent("Any text / it can be used as an alt subject!")
);

formdata.append(
  "bodies",
  blobHtml,
  encodeURIComponent("Any text / it can be used as an alt subject!")
);

formdata.append(
  "bodies",
  blobFiles,
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
