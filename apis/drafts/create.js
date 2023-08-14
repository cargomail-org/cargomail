const raw = JSON.stringify({
  payload: {
    contentType: "application/json",
    headers: [
      {
        name: "X-Destination-Resource-Mailbox-URL",
        value: "http://127.0.0.:8181",
      },
      {
        name: "To",
        value: [
          { fullname: "Bob Sanders", emailAddress: "bob@cargomail.org" },
        ],
      },
      {
        name: "Subject",
        value: "A test message",
      },
    ],
    parts: [
      {
        partId: "1",
        headers: [
          {
            name: "Content-Type",
            value: "multipart/alternative",
          },
        ],
        parts: [
          {
            partId: "1",
            headers: [
              {
                name: "Content-Disposition",
                value: "inline",
              },
            ],
            body: {
              contentType: "application/json; charset=UTF-8",
              uri: "abc",
              size: 150,
            },
          },
          {
            partId: "2",
            headers: [
              {
                name: "Content-Disposition",
                value: "inline",
              },
            ],
            body: {
              contentType: "text/html; charset=UTF-8",
              uri: "efg",
              size: 160,
            },
          },
        ],
      },
      {
        partId: "2",
        headers: [
          {
            name: "Content-Disposition",
            value: "attachment",
          },
        ],
        body: {
          contentType: "application/json",
          uri: "ijk",
          size: 145,
        },
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
