import { useContext, useCallback } from 'react'
import { ThreadsContext } from '../../context/ThreadsContext'
import { LabelsContext } from '../../context/LabelsContext'
import compose from '../compose'
import filterByLabel from '../mails/threads/filterByLabel'
import markPrimaryLabel from '../mails/threads/markPrimaryLabel'
import extract from '../mails/threads/extract'
import classify from '../mails/threads/classify'
import groupByDate from '../mails/threads/groupByDate'

const map = (func: any) => (array: any[]) => array.map(func)

const useProcessedThreads = ({ includes, excludes, aggregate = true, sent = false }: any) => {
  const { labels }: any = useContext(LabelsContext)
  const { threads }: any = useContext(ThreadsContext)
  const final = aggregate ? compose(groupByDate, classify(labels)) : (self: any) => self
  const process = useCallback(
    compose(final, map(markPrimaryLabel(labels, sent)), filterByLabel({ includes, excludes }), map(extract)),
    [threads]
  )
  return process(threads)
}

export default useProcessedThreads
