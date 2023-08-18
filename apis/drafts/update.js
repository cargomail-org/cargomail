const raw = JSON.stringify({
    payload: {
      contentType: "application/json",
      headers: [
        {
          name: "X-Origin-Resource-Mailbox-URL",
          value: "http://127.0.0.:8181/api/v1/bodies/",
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
              value: "multipart/mixed",
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
                contentType: "text/plain; charset=UTF-8",
                name: "2208f8b6265458ab1a05aa2094d70cba",
                size: 56,
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
                name: "cceea0dc10d6cbec9f9d702da4cd1e1b",
                size: 108,
              },
            },
            {
              partId: "3",
              headers: [
                {
                  name: "Content-Disposition",
                  value: "attachment",
                },
              ],
              body: {
                contentType: "application/json",
                name: "9d7289527975b42198248dc517008eea",
                size: 115,
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
  