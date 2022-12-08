const filterByLabel =
  ({ includes, excludes }: any) =>
  (threads: any[]) =>
    threads
      .map((thread: any) => ({
        ...thread,
        messages: thread.messages
          .filter((message: any) => (includes ? message.labelIds.some((e: any) => includes.includes(e)) : true))
          .filter((message: any) => (excludes ? !message.labelIds.some((e: any) => excludes.includes(e)) : true)),
      }))
      .filter((thread) => thread.messages.length)

export default filterByLabel
