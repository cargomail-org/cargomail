import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const pushOrNew = (array: any, value: any, label: any) => {
  const last = array.length ? array[array.length - 1] : null
  if (!last || last.label !== label) {
    array.push({ label, threads: [value] })
  } else last.threads.push(value)
}

const categorize = (result: any, date: any, value: any) => {
  if (date > dayjs().startOf('day')) {
    pushOrNew(result, value, 'TODAY')
  } else if (date > dayjs().startOf('day').subtract(1, 'day')) {
    pushOrNew(result, value, 'YESTERDAY')
  } else if (date > dayjs().startOf('month') && date > dayjs().startOf('year')) {
    pushOrNew(result, value, 'THIS_MONTH')
  } else if (date > dayjs().startOf('year')) {
    pushOrNew(result, value, 'MONTH')
    // eslint-disable-next-line
    result[result.length - 1].date = { month: date.month() + 1 }
  } else if (date > dayjs().subtract(1, 'year').startOf('year')) {
    pushOrNew(result, value, 'YEAR_N_MONTH')
    // eslint-disable-next-line
    result[result.length - 1].date = { year: date.year(), month: date.month() + 1 }
  } else {
    pushOrNew(result, value, 'EARLIER')
  }
}

const groupThreadsByDate = (cluster: any) => {
  const threads: any[] = []
  cluster.threads.forEach((thread: any) => {
    const date = dayjs(parseInt(thread.messages[0].internalDate, 10))
    categorize(threads, date, thread)
  })
  return { ...cluster, threads }
}

const groupByDate = (clusters: any) => {
  const result: any[] = []
  clusters.forEach((clusterOrThread: any) => {
    const cluster = clusterOrThread.id ? clusterOrThread : groupThreadsByDate(clusterOrThread)
    const internalDate = clusterOrThread.id
      ? clusterOrThread.messages[0].internalDate
      : clusterOrThread.threads[0].messages[0].internalDate
    const date = dayjs(parseInt(internalDate, 10))
    categorize(result, date, cluster)
  })
  return result
}

export default groupByDate
