let historyId = 0;

export const getHistoryId = () => {
  return historyId;
};

export const setHistoryId = (value) => {
  historyId = value;
};

export const threadsRefresh = (sentTable, inboxTable, data) => {
  if (data.lastHistoryId) {
    historyId = data.lastHistoryId;
  }

  // should refresh both the send and the inbox table
  for (const message of data.inserted || []) {
    if (message.folder == 1) {
      const threadId = message.payload.headers["X-Thread-ID"];
      const payload = message.payload;
      const createdAt =
        message.modifiedAt != null ? message.modifiedAt : message.createdAt;

      const threadDataInbox = inboxTable
        .rows()
        .data()
        .toArray()
        .find((thread) => thread.threadId == threadId);

      const threadDataSent = sentTable
        .rows()
        .data()
        .toArray()
        .find((thread) => thread.threadId == threadId);

      if (threadDataInbox) {
        threadDataInbox.messages.push(message);
        threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + threadId).invalidate();
      }

      if (threadDataSent) {
        threadDataSent.messages.push(message);
        threadDataSent.createdAt = createdAt;
        sentTable.row("#" + threadId).invalidate();
      } else {
        if (threadDataInbox) {
          sentTable.rows.add([JSON.parse(JSON.stringify(threadDataInbox))]).draw();
        } else {
          const newThreadData = {
            threadId,
            payload,
            createdAt,
            messages: [message],
          };
          sentTable.rows.add([newThreadData]).draw();
        }
      }
    }

    if (message.folder == 2) {
      const threadId = message.payload.headers["X-Thread-ID"];
      const payload = message.payload;
      const createdAt =
        message.modifiedAt != null ? message.modifiedAt : message.createdAt;

      const threadDataSent = sentTable
        .rows()
        .data()
        .toArray()
        .find((thread) => thread.threadId == threadId);

      const threadDataInbox = inboxTable
        .rows()
        .data()
        .toArray()
        .find((thread) => thread.threadId == threadId);

      if (threadDataSent) {
        threadDataSent.messages.push(message);
        threadDataSent.createdAt = createdAt;
        sentTable.row("#" + threadId).invalidate();
      }

      if (threadDataInbox) {
        threadDataInbox.messages.push(message);
        threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + threadId).invalidate();
      } else {
        if (threadDataSent) {
          inboxTable.rows.add([JSON.parse(JSON.stringify(threadDataSent))]).draw();
        } else {
          const newThreadData = {
            threadId,
            payload,
            createdAt,
            messages: [message],
          };
          inboxTable.rows.add([newThreadData]).draw();
        }
      }
    }
  }

  for (const message of data.trashed || []) {
    const threadId = message.payload.headers["X-Thread-ID"];

    const threadDataInbox = inboxTable
      .rows()
      .data()
      .toArray()
      .find((thread) => thread.threadId == threadId);

    const threadDataSent = sentTable
      .rows()
      .data()
      .toArray()
      .find((thread) => thread.threadId == threadId);

    if (threadDataInbox) {
      inboxTable
        .row("#" + threadId)
        .remove()
        .draw();
    }

    if (threadDataSent) {
      sentTable
        .row("#" + threadId)
        .remove()
        .draw();
    }

    // if (message.id == composeIdInput.value) {
    //   composeClearForm();
    // }
  }

  for (const message of data.deleted || []) {
    const threadId = message.payload.headers["X-Thread-ID"];

    const threadDataInbox = inboxTable
      .rows()
      .data()
      .toArray()
      .find((thread) => thread.threadId == threadId);

    const threadDataSent = sentTable
      .rows()
      .data()
      .toArray()
      .find((thread) => thread.threadId == threadId);

    if (threadDataInbox) {
      inboxTable
        .row("#" + threadId)
        .remove()
        .draw();
    }

    if (threadDataSent) {
      sentTable
        .row("#" + threadId)
        .remove()
        .draw();
    }

    // if (message.id == composeIdInput.value) {
    //   composeClearForm();
    // }
  }

  /*for (const message of data.updated || []) {
      if (message.folder == 1) {
        // https://datatables.net/forums/discussion/59343/duplicate-data-in-the-data-table
        const notFound =
          sentTable.column(0).data().toArray().indexOf(message.id) === -1; // !!! must be
        if (notFound) {
          sentTable.row.add(message);
        } else {
          sentTable.row(`#${message.id}`).data(message);
  
          if (message.id == composeIdInput.value) {
            const parsed = parsePayload(message.id, message.payload);
  
            composePopulateForm(false, message.id, parsed);
          }
        }
      }
    }*/
};
