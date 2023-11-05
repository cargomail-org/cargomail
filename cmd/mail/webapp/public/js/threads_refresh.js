import { treatDupliciteMessage } from "/public/js/utils.js";
import { draftsTable } from "/public/js/drafts.js";

import $ from "jquery";

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
        const child = inboxTable.row("#" + $.escapeSelector(threadId)).child();
        if (dupliciteInboxIndex >= 0) {
          const view = 2;
          const rslt = treatDupliciteMessage(threadDataInbox, view, message, dupliciteInboxIndex);
          if (rslt == 2) {
            if (child) {
              const messageTable = $(`.message-inbox-table`, child);
              messageTable.DataTable().rows.add([message]).draw();
            }
          } else if (rslt == 1) {
            if (child) {
              const messageTable = $(`.message-inbox-table`, child);
              messageTable
                .DataTable()
                .row("#" + message.id)
                .invalidate()
                .draw();
            }
          }
        } else {
          threadDataInbox.messages.push(message);
          if (child) {
            const messageTable = $(`.message-inbox-table`, child);
            messageTable.DataTable().rows.add([message]).draw();
          }
        }

        // threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + $.escapeSelector(threadId)).invalidate();
      }

      if (threadDataSent) {
        const child = sentTable.row("#" + $.escapeSelector(threadId)).child();
        if (dupliciteSentIndex >= 0) {
          const view = 1;
          const rslt = treatDupliciteMessage(threadDataSent, view, message, dupliciteSentIndex);
          if (rslt == 2) {
            if (child) {
              const messageTable = $(`.message-sent-table`, child);
              messageTable.DataTable().rows.add([message]).draw();
            }
          } else if (rslt == 1) {
            if (child) {
              const messageTable = $(`.message-sent-table`, child);
              messageTable
                .DataTable()
                .row("#" + message.id)
                .invalidate()
                .draw();
            }
          }
        } else {
          threadDataSent.messages.push(message);
          if (child) {
            const messageTable = $(`.message-sent-table`, child);

            messageTable.DataTable().rows.add([message]).draw();
          }
        }

        threadDataSent.createdAt = createdAt;
        sentTable.row("#" + $.escapeSelector(threadId)).invalidate();
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
        const child = sentTable.row("#" + $.escapeSelector(threadId)).child();
        if (dupliciteSentIndex >= 0) {
          const view = 1;
          const rslt = treatDupliciteMessage(threadDataSent, view, message, dupliciteSentIndex);
          if (rslt == 2) {
            if (child) {
              const messageTable = $(`.message-sent-table`, child);
              messageTable.DataTable().rows.add([message]).draw();
            }
          } else if (rslt == 1) {
            if (child) {
              const messageTable = $(`.message-sent-table`, child);
              messageTable
                .DataTable()
                .row("#" + message.id)
                .invalidate()
                .draw();
            }
          }
        } else {
          threadDataSent.messages.push(message);
          if (child) {
            const messageTable = $(`.message-sent-table`, child);
            messageTable.DataTable().rows.add([message]).draw();
          }
        }

        // threadDataSent.createdAt = createdAt;
        sentTable.row("#" + $.escapeSelector(threadId)).invalidate();
      }

      if (threadDataInbox) {
        const child = inboxTable.row("#" + $.escapeSelector(threadId)).child();
        if (dupliciteInboxIndex >= 0) {
          const view = 2;
          const rslt = treatDupliciteMessage(threadDataInbox, view, message, dupliciteInboxIndex);
          if (rslt == 2) {
            if (child) {
              const messageTable = $(`.message-inbox-table`, child);
              messageTable.DataTable().rows.add([message]).draw();
            }
          } else if (rslt == 1) {
            if (child) {
              const messageTable = $(`.message-inbox-table`, child);
              messageTable
                .DataTable()
                .row("#" + message.id)
                .invalidate()
                .draw();
            }
          }
        } else {
          threadDataInbox.messages.push(message);
          if (child) {
            const messageTable = $(`.message-inbox-table`, child);
            messageTable.DataTable().rows.add([message]).draw();
          }
        }

        threadDataInbox.createdAt = createdAt;
        inboxTable.row("#" + $.escapeSelector(threadId)).invalidate();
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
    messageRemoved(inboxTable, sentTable, message);
  }

  for (const message of data.deleted || []) {
    messageRemoved(inboxTable, sentTable, message);
  }

  for (const message of data.updated || []) {
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

    const inboxMessage = threadDataInbox?.messages.find((item) => {
      return item.id == message.id;
    });

    const sentMessage = threadDataSent?.messages.find((item) => {
      return item.id == message.id;
    });

    if (inboxMessage) {
      inboxMessage.unread = message.unread;
      inboxMessage.starred = message.starred;
    }

    if (sentMessage) {
      sentMessage.unread = message.unread;
      sentMessage.starred = message.starred;
    }

    inboxTable.row("#" + $.escapeSelector(threadId)).invalidate().draw(false);
    sentTable.row("#" + $.escapeSelector(threadId)).invalidate().draw(false);

    const messagesInboxTable = $(`.message-inbox-table`);
    const messagesSentTable = $(`.message-sent-table`);

    messagesInboxTable
      .DataTable()
      .row("#" + message.id)
      .invalidate()
      .draw(false);

    messagesSentTable
      .DataTable()
      .row("#" + message.id)
      .invalidate()
      .draw(false);
  }
};

const messageRemoved = (inboxTable, sentTable, message) => {
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
    const child = inboxTable.row("#" + $.escapeSelector(threadId)).child();

    if (child) {
      const messageTable = $(`.message-inbox-table`, child);

      messageTable
        .DataTable()
        .row("#" + messageId)
        .remove()
        .draw();
    }
  }

  if (threadDataSent) {
    const child = sentTable.row("#" + $.escapeSelector(threadId)).child();

    if (child) {
      const messageTable = $(`.message-sent-table`, child);

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
          .row("#" + $.escapeSelector(threadId))
          .invalidate()
          .draw();
      } else {
        inboxTable
          .row("#" + $.escapeSelector(threadId))
          .remove()
          .draw();
        inboxThreadRemoved = true;
      }
    } else {
      inboxTable
        .row("#" + $.escapeSelector(threadId))
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
          .row("#" + $.escapeSelector(threadId))
          .invalidate()
          .draw();
      } else {
        sentTable
          .row("#" + $.escapeSelector(threadId))
          .remove()
          .draw();
        sentThreadRemoved = true;
      }
    } else {
      sentTable
        .row("#" + $.escapeSelector(threadId))
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
};