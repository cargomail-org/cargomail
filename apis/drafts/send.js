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
            hash: "ffdec06b6273de37af36894cfc6055d8",
            size: 56,
          },
          {
            orderId: 2,
            contentType: "text/html; charset=UTF-8",
            uri: "cceea0dc10d6cbec9f9d702da4cd1e1b",
            hash: "5ac939e0103ad2466c213ac8dd75261d",
            size: 108,
          },
        ],
      },
      {
        orderId: 2,
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
            value: "http://127.0.0.:8181/api/v1/files/",
          },
        ],
        bodies: [
          {
            orderId: 1,
            contentType: "application/json",
            uri: "9d7289527975b42198248dc517008eea",
            hash: "2aed754ebc10114d3e5d7fe500078207",
            size: 115,
          },
        ],
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

fetch("http://127.0.0.1:8181/api/v1/drafts/send", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log("error", error));
