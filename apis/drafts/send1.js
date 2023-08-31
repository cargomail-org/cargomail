const raw = JSON.stringify({
  payload: {
    headers: [
      //   {
      //     name: "Message-ID",
      //     value: "950124.162336@127.0.0.1:8181>",
      //   },
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
        value: "A simple test message",
      },
      {
        name: "Content-Type",
        value: "text/plain; charset=UTF-8",
      },
    ],
    body: [
      {
        raw: "SGkgdGhlcmUhCgpJJ2QgbGlrZSB0byBjb250cmlidXRlLgoKUmVnYXJkcw==",
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
