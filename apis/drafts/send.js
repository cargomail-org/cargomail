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
                uri: "ffdec06b6273de37af36894cfc6055d8",
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
                uri: "5ac939e0103ad2466c213ac8dd75261d",
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
                uri: "2aed754ebc10114d3e5d7fe500078207",
                size: 115,
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
  