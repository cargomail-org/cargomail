const raw = JSON.stringify({
  payload: {
    headers: [
      // {
      //   name: "Message-ID",
      //   value: "950124.162336@127.0.0.1:8181>",
      // },
      {
        name: "Date",
        value: "Tue, 11 Apr 2023 09:19:22 +0200",
      },
      {
        name: "From",
        value: [
          { fullname: "Alice Sanders", emailAddress: "alice@cargomail.org" },
        ],
      },
      {
        name: "To",
        value: [{ fullname: "Bob Sanders", emailAddress: "bob@cargomail.org" }],
      },
      {
        name: "Subject",
        value: "A test message",
      },
      {
        name: "Content-Type",
        value: "multipart/mixed",
      },
    ],
    parts: [
      {
        headers: [
          {
            name: "Content-Type",
            value: "multipart/alternative",
          },
        ],
        body: [
          {
            contentType: "text/plain; charset=UTF-8",
            raw: "SGkgdGhlcmUhCgpJJ2QgbGlrZSB0byBjb250cmlidXRlLgoKUmVnYXJkcw==",
          },
          {
            contentType: "text/html; charset=UTF-8",
            raw: "PGh0bWw+CjxoMj5IaSB0aGVyZSE8L2gyPgo8aT5JJ2QgbGlrZSB0byBjb250cmlidXRlLjwvaT48L2JyPgo8L2JyPgpSZWdhcmRzCjwvaHRtbD4=",
          },
        ],
      },
      {
        headers: [
          {
            name: "Content-Type",
            value: "multipart/mixed",
          },
          {
            name: "Content-Disposition",
            value: "attachment",
          },
        ],
        body: [
          {
            contentType: "application/pdf",
            uri: "9d7289527975b42198248dc517008eea",
            hash: "2aed754ebc10114d3e5d7fe500078207",
            size: 315,
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
