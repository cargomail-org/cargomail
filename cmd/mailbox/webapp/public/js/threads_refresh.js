import { treatDupliciteMessage } from "/public/js/utils.js";
import { draftsTable } from "/public/js/drafts.js";

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
        return item.payload.headers["Message-ID"] == message.payload.headers["Message-ID"];
      })
    );

    const dupliciteSentIndex = threadDataSent?.messages.indexOf(
      threadDataSent.messages.find((item) => {
        return item.payload.headers["Message-ID"] == message.payload.headers["Message-ID"];
      })
    );

    if (message.folder == 1) {
      if (threadDataInbox) {
        if (dupliciteInboxIndex >= 0) {
          const view = 2;
          treatDupliciteMessage(threadDataInbox, view, message, dupliciteInboxIndex);
        } else {
          threadDataInbox.messages.push(message);
        }

        // threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + threadId).invalidate();
      }

      if (threadDataSent) {
        if (dupliciteSentIndex >= 0) {
          const view = 1;
          treatDupliciteMessage(threadDataSent, view, message, dupliciteSentIndex);
        } else {
          threadDataSent.messages.push(message);
        }

        threadDataSent.createdAt = createdAt;
        sentTable.row("#" + threadId).invalidate();
      } else {
        if (threadDataInbox) {
          const newThreadData = JSON.parse(JSON.stringify(threadDataInbox));
          newThreadData.createdAt = createdAt;
          sentTable.rows.add([newThreadData]).draw();
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
          const view = 1;
          treatDupliciteMessage(threadDataSent, view, message, dupliciteSentIndex);
        } else {
          threadDataSent.messages.push(message);
        }

        // threadDataSent.createdAt = createdAt;
        sentTable.row("#" + threadId).invalidate();
      }

      if (threadDataInbox) {
        if (dupliciteInboxIndex >= 0) {
          const view = 2;
          treatDupliciteMessage(threadDataInbox, view, message, dupliciteInboxIndex);
        } else {
          threadDataInbox.messages.push(message);
        }

        threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + threadId).invalidate();
      } else {
        if (threadDataSent) {
          const newThreadData = JSON.parse(JSON.stringify(threadDataSent));
          newThreadData.createdAt = createdAt;
          inboxTable.rows.add([newThreadData]).draw();
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

    if (threadId == composeXThreadIdInput.value) {
      composeClearForm();
    }

    // delete affected drafts
    draftsTable.rows().every((index) => {
      const row = draftsTable.row(index);
      const data = row.data();

      if (data.payload.headers["X-Thread-ID"] == threadId) {
        draftsTable.rows(index).remove().draw();
      }
    });
  }

  for (const message of data.deleted || []) {
    const messageId = message.id;

    const threadDataInbox = inboxTable
      .rows()
      .data()
      .toArray()
      .find((thread) => thread.messages.find((message) => message.id == messageId));

    const threadDataSent = sentTable
      .rows()
      .data()
      .toArray()
      .find((thread) => thread.messages.find((message) => message.id == messageId));

    const threadId = threadDataInbox?.threadId || threadDataSent?.threadId;

    if (threadDataInbox) {
      const child = inboxTable.row("#" + threadId).child();

      if (child) {
        const messageTable = $("table", child);

        messageTable
          .DataTable()
          .row("#" + messageId)
          .remove()
          .draw();
      }
    }

    if (threadDataSent) {
      const child = sentTable.row("#" + threadId).child();

      if (child) {
        const messageTable = $("table", child);

        messageTable
          .DataTable()
          .row("#" + messageId)
          .remove()
          .draw();
      }
    }

    let inboxThreadRemoved = false;
    let sentThreadRemoved = false;

    const inboxThread = inboxTable
      .data()
      .toArray()
      .find((thread) => thread.messages.find((message) => message.id == messageId));

    if (inboxThread?.messages?.length > 0) {
      inboxThread.messages = inboxThread.messages.filter((message) => message.id != messageId);

      if (inboxThread.messages?.length > 0) {
        const inboxFolderMessages = inboxThread.messages.filter((message) => message.folder == 2);

        if (inboxFolderMessages?.length > 0) {
          inboxTable
            .row("#" + threadId)
            .invalidate()
            .draw();
        } else {
          inboxTable
            .row("#" + threadId)
            .remove()
            .draw();
          inboxThreadRemoved = true;
        }
      } else {
        inboxTable
          .row("#" + threadId)
          .remove()
          .draw();
        inboxThreadRemoved = true;
      }
    }

    const sentThread = sentTable
      .data()
      .toArray()
      .find((thread) => thread.messages.find((message) => message.id == messageId));

    if (sentThread?.messages?.length > 0) {
      sentThread.messages = sentThread.messages.filter((message) => message.id != messageId);

      if (sentThread.messages?.length > 0) {
        const sentFolderMessages = sentThread.messages.filter((message) => message.folder == 1);

        if (sentFolderMessages?.length > 0) {
          sentTable
            .row("#" + threadId)
            .invalidate()
            .draw();
        } else {
          sentTable
            .row("#" + threadId)
            .remove()
            .draw();
          sentThreadRemoved = true;
        }
      } else {
        sentTable
          .row("#" + threadId)
          .remove()
          .draw();
        sentThreadRemoved = true;
      }
    }

    if (inboxThreadRemoved && sentThreadRemoved) {
      // if (threadId == composeXThreadIdInput.value) {
      //   composeClearForm();
      // }

      //// delete affected drafts
      // draftsTable.rows().every((index) => {
      //   const row = draftsTable.row(index);
      //   const data = row.data();

      //   if (data.payload.headers["X-Thread-ID"] == threadId) {
      //     draftsTable.rows(index).remove().draw();
      //   }
      // });
    }
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
