const raw = JSON.stringify({
  payload: {
    headers: [
      {
        name: "Content-Type",
        value: "application/json",
      },
      {
        name: "To",
        value: [{ fullname: "Bob Sanders", emailAddress: "bob@cargomail.org" }],
      },
      {
        name: "Subject",
        value: "A test message",
      },
    ],
    parts: [
      {
        orderId: 1,
        headers: [
          {
            name: "Content-Type",
            value: "message/external-body; type=blob",
          },
          {
            name: "Content-Disposition",
            value: "inline",
          },
          {
            name: "Origin-Resource-Mailbox-URL",
            value: "http://127.0.0.:8181/api/v1/blobs/",
          },
        ],
        bodies: [
          {
            orderId: 1,
            contentType: "text/plain; charset=UTF-8",
            uri: "2208f8b6265458ab1a05aa2094d70cba",
          },
          {
            orderId: 2,
            contentType: "text/html; charset=UTF-8",
            uri: "cceea0dc10d6cbec9f9d702da4cd1e1b",
          },
        ],
      },
      {
        orderId: 1,
        headers: [
          {
            name: "Content-Type",
            value: "message/external-body; type=file",
          },
          {
            name: "Content-Disposition",
            value: "attachment",
          },
          {
            name: "Origin-Resource-Mailbox-URL",
            value: "http://127.0.0.:8181/api/v1/blobs/",
          },
        ],
        bodies: [
          {
            orderId: 1,
            contentType: "application/json",
            uri: "9d7289527975b42198248dc517008eea",
          },
        ],
      },
    ],
  },
});

const requestOptions = {
  method: "PUT",
  credentials: "include",
  body: raw,
  redirect: "follow",
};

fetch("http://127.0.0.1:8181/api/v1/drafts", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
