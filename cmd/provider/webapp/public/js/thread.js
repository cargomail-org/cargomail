const getMessages = async () => {
  const response = await api(
    sentFormAlert.id,
    200,
    `${window.apiHost}/api/v1/messages/list`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ folder: 0 }),
    }
  );

  if (response === false) {
    return;
  }

  return response;
};

export const conversationPane = (data) => {
  var trs = "";
  let subject;
  data.messages.forEach((message) => {
    if (!subject) {
      subject = message.payload?.headers?.["Subject"];
    }
    trs +=
      "<tr><td>" +
      message.id +
      "</td><td>" +
      message.payload?.headers?.["Subject"] +
      "</td></tr>";
  });
  const html = `
      <table class="table table-border table-hover">
      <thead>
      <th colspan="2">${subject}</th>
      </thead><tbody>
      ${trs}
      </tbody></table>
    `;
  return html;
};

export const messageListResponse = await getMessages();
