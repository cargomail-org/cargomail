const raw = JSON.stringify({
  payload: {
    headers: {
      // "Message-ID": "950124.162336@127.0.0.1:8181",
      Date: "Tue, 11 Apr 2023 09:19:22 +0200",
      From: "Alice Sanders <alice@cargomail.org>",
      To: "Bob Sanders <bob@cargomail.org>",
      Subject: "A test message",
      "Content-Type": "multipart/mixed",
    },
    parts: [
      {
        headers: {
          "Content-Type": "multipart/alternative",
        },
        parts: [
          {
            headers: {
              "Content-Type": "text/plain; charset=UTF-8",
            },
            body: {
              raw: "SGkgdGhlcmUhCgpJJ2QgbGlrZSB0byBjb250cmlidXRlLgoKUmVnYXJkcw==",
            },
          },
          {
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
            },
            body: {
              raw: "PGh0bWw+CjxoMj5IaSB0aGVyZSE8L2gyPgo8aT5JJ2QgbGlrZSB0byBjb250cmlidXRlLjwvaT48L2JyPgo8L2JyPgpSZWdhcmRzCjwvaHRtbD4=",
            },
          },
        ],
      },
      {
        headers: {
          "Content-Type": "multipart/mixed",
        },
        parts: [
          {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": "attachment",
            },
            body: {
              uri: "9d7289527975b42198248dc517008eea",
              hash: "2aed754ebc10114d3e5d7fe500078207",
              size: 315,
            },
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
