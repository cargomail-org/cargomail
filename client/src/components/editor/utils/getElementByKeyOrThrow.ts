import { LexicalEditor, NodeKey } from 'lexical'
import invariant from '../shared/invariant'

export function getElementByKeyOrThrow(editor: LexicalEditor, key: NodeKey): HTMLElement {
  const element = editor._keyToDOMMap.get(key)

  if (element === undefined) {
    invariant(false, 'Reconciliation: could not find DOM element for node key %s', key)
  }

  return element
}
