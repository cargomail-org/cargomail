import { messageListResponse } from "/public/js/message.js";
import { treatDupliciteMessage } from "/public/js/utils.js"

// folder -1 means all, where 0=draft (reserved, not used), 1=sent, 2=inbox, 3=spam (reserved, not used)
export const getThreads = (folder = -1) => {
  const historyId = messageListResponse.lastHistoryId;

  const threadsById = new Map();
  for (const message of messageListResponse.messages) {
    const threadId = message.payload.headers["X-Thread-ID"];
    const thread = threadsById.get(threadId);
    const payload = message.payload;
    const createdAt = message.createdAt;

    if (thread) {
      const dupliciteIndex = thread.messages.indexOf(
        thread.messages.find((item) => {
          return item.payload.headers["Message-ID"] == message.payload.headers["Message-ID"];
        })
      );

      if (dupliciteIndex >= 0) {
        const view = folder;
        treatDupliciteMessage(thread, view, message, dupliciteIndex);
      } else {
        thread.messages.push(message);
      }

      if ((folder == -1 || message.folder == folder) && message.createdAt > thread.createdAt) {
        thread.createdAt = message.createdAt;
      }
    } else {
      threadsById.set(threadId, {
        threadId,
        payload,
        createdAt,
        messages: [message],
      });
    }
  }
  const threads = [...threadsById.values()];

  if (folder == -1) {
    return threads;
  } else {
    return threads.filter((thread) => {
      const messages = thread.messages.filter((message, index) => message.folder == folder);
      return messages.length > 0;
    });
  }
};
