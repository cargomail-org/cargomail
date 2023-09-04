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
                'message/external-body; uri="f3ee6cf816db5c0e1c83be9a9c90e4cb"; digest:sha-256="a5eaaf3bbe2549411939779431aa4eab2ded6d0f424a7d72b394a481783077d1"; size="182726"',
                "application/pdf",
              ],
              "Content-Disposition":
                'attachment; filename="INFO Malá maturita z ANJ 2023.pdf"',
            },
          },
          {
            headers: {
              "Content-Type": [
                'message/external-body; uri="e3671df3331059e5b510b6ebd9b91a63"; digest:sha-256="eb32e1238ef21baae083d30bd3b3c8fc0137231957b750c69b9089f8d66cac51"; size="48789"',
                "image/jpeg",
              ],
              "Content-Disposition": 'attachment; filename="1217350108.jpg"',
            },
          },
          {
            headers: {
              "Content-Type": [
                'message/external-body; uri="1a513cea72f78aa4853afc9a6d1b91dd"; digest:sha-256="1330e1c67dfcdd117dfda958c2d179da1e87e56c041670908334b0ae13c10980"; size="3593"',
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
