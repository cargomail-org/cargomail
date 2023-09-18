const raw = JSON.stringify({
  payload: {
    headers: {
      // "Message-ID": "950124.162336@127.0.0.1:8181",
      Date: "Tue, 11 Apr 2023 09:19:22 +0200",
      From: "Alice Sanders <alice@cargomail.org>",
      To: "Bob Sanders <bob@cargomail.org>",
      Cc: "Carol Sanders <carol@cargomail.org>, Dan Sanders <dan@cargomail.org>",
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
              "Content-Transfer-Encoding": "base64",
            },
            body: {
              data: "SGkgdGhlcmUhCgpJJ2QgbGlrZSB0byBjb250cmlidXRlLgoKUmVnYXJkcw==",
            },
          },
          {
            headers: {
              "Content-Type": "text/html; charset=UTF-8",
              "Content-Transfer-Encoding": "base64",
            },
            body: {
              data: "PGh0bWw+CjxoMj5IaSB0aGVyZSE8L2gyPgo8aT5JJ2QgbGlrZSB0byBjb250cmlidXRlLjwvaT48L2JyPgo8L2JyPgpSZWdhcmRzCjwvaHRtbD4=",
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
              "Content-Type": [
                'message/external-body; digest="UxG7xb9iTHQ2XP284bVnFjYbAcfher-LSS8uRGbhEvY"; size="182726"',
                "application/pdf",
              ],
              "Content-Disposition":
                'attachment; filename="INFO Malá maturita z ANJ 2023.pdf"',
            },
          },
          {
            headers: {
              "Content-Type": [
                'message/external-body; digest="bBjqnY0mM1YbspZVyHaIkDnJ6VL8jkr_sRX2Bsus__0"; size="48789"',
                "image/jpeg",
              ],
              "Content-Disposition": 'attachment; filename="1217350108.jpg"',
            },
          },
          {
            headers: {
              "Content-Type": [
                'message/external-body; digest="jeUTMsDAiJwrsenkYRSD05nG3DJwdMboIdVDdnLT4zw"; size="3593"',
                "image/png",
              ],
              "Content-Disposition": 'attachment; filename="sample.png"',
            },
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
