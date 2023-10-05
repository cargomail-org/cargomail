import { treatDupliciteMessage } from "/public/js/utils.js";

let historyId = 0;

export const getHistoryId = () => {
  return historyId;
};

export const setHistoryId = (value) => {
  historyId = value;
};

const composeIdInput = document.getElementById("composeIdInput");
const composeInReplyToInput = document.getElementById("composeInReplyToInput");
const composeXThreadIdInput = document.getElementById("composeXThreadIdInput");

export const threadsRefresh = (sentTable, inboxTable, data) => {
  if (data.lastHistoryId) {
    historyId = data.lastHistoryId;
  }

  // should refresh both the send and the inbox table
  for (const message of data.inserted || []) {
    const threadId = message.payload.headers["X-Thread-ID"];
    const payload = message.payload;
    const createdAt = message.createdAt;

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

    const dupliciteInboxIndex = threadDataInbox?.messages.indexOf(
      threadDataInbox.messages.find((item) => {
        return (
          item.payload.headers["Message-ID"] ==
          message.payload.headers["Message-ID"]
        );
      })
    );

    const dupliciteSentIndex = threadDataSent?.messages.indexOf(
      threadDataSent.messages.find((item) => {
        return (
          item.payload.headers["Message-ID"] ==
          message.payload.headers["Message-ID"]
        );
      })
    );

    if (message.folder == 1) {
      if (threadDataInbox) {
        if (dupliciteInboxIndex >= 0) {
          treatDupliciteMessage(
            threadDataInbox,
            2,
            message,
            dupliciteInboxIndex
          );
        } else {
          threadDataInbox.messages.push(message);
        }

        threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + threadId).invalidate();
      }

      if (threadDataSent) {
        if (dupliciteSentIndex >= 0) {
          treatDupliciteMessage(threadDataSent, 1, message, dupliciteSentIndex);
        } else {
          threadDataSent.messages.push(message);
        }

        threadDataSent.createdAt = createdAt;
        sentTable.row("#" + threadId).invalidate();
      } else {
        if (threadDataInbox) {
          sentTable.rows
            .add([JSON.parse(JSON.stringify(threadDataInbox))])
            .draw();
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

      sentTable.draw();
      inboxTable.draw();
    }

    if (message.folder == 2) {
      if (threadDataSent) {
        if (dupliciteSentIndex >= 0) {
          treatDupliciteMessage(threadDataSent, 1, message, dupliciteSentIndex);
        } else {
          threadDataSent.messages.push(message);
        }

        threadDataSent.createdAt = createdAt;
        sentTable.row("#" + threadId).invalidate();
      }

      if (threadDataInbox) {
        if (dupliciteInboxIndex >= 0) {
          treatDupliciteMessage(
            threadDataInbox,
            2,
            message,
            dupliciteInboxIndex
          );
        } else {
          threadDataInbox.messages.push(message);
        }

        threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + threadId).invalidate();
      } else {
        if (threadDataSent) {
          inboxTable.rows
            .add([JSON.parse(JSON.stringify(threadDataSent))])
            .draw();
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

      sentTable.draw();
      inboxTable.draw();
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

    // do not clear compose!
    // if (message.id == composeIdInput.value) ||
    //    ((message.id == composeInReplyToInput.value) && (threadId == composeXThreadIdInput.value)) {
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

    // do not clear compose!
    // if (message.id == composeIdInput.value) ||
    //    ((message.id == composeInReplyToInput.value) && (threadId == composeXThreadIdInput.value)) {
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
