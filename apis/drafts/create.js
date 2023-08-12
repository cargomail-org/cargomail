const raw = JSON.stringify({
  payload: {
    content_type: "multipart/mixed",
    headers: [
      {
        name: "to",
        value: [{ fullname: "Peter Greenwood", email_address: "p@b.com" }],
      },
    ],
    body: {
      content_type: "text/plain; charset=UTF-8",
      uri: "abc",
      size: 15,
    },
    files: [
      {
        content_type: "text/plain; charset=UTF-8",
        uri: "123",
        size: 230,
      },
      {
        content_type: "application/pdf",
        uri: "456",
        size: 634,
      },
    ],
  },
});

const requestOptions = {
  method: "POST",
  credentials: "include",
  body: raw,
  redirect: "follow",
};

fetch("http://127.0.0.1:8181/api/v1/drafts", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
