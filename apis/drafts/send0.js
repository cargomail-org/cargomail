const raw = JSON.stringify({
    payload: {
      headers: {
        // "Message-ID": "950124.162336@127.0.0.1:8181",
        Date: "Tue, 11 Apr 2023 09:19:22 +0200",
        From: "Alice Sanders <alice@cargomail.org>",
        To: "Bob Sanders <bob@cargomail.org>",
        Subject: "Without a body",
      },
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
  