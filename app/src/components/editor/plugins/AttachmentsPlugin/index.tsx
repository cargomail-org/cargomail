import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $wrapNodeInElement, mergeRegister } from '@lexical/utils'
import {
  $createParagraphNode,
  $createRangeSelection,
  $getSelection,
  $insertNodes,
  $isNodeSelection,
  $isRootOrShadowRoot,
  $setSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DRAGOVER_COMMAND,
  DRAGSTART_COMMAND,
  DROP_COMMAND,
  LexicalCommand,
  LexicalEditor,
} from 'lexical'
import { useEffect } from 'react'
import getSelection from '../../shared/getDOMSelection'

import { $createAttachmentNode, $isAttachmentNode, AttachmentNode, AttachmentPayload } from '../../nodes/AttachmentNode'

export type InsertAttachmentPayload = Readonly<AttachmentPayload>

export const SHOW_FILE_DIALOG_COMMAND: LexicalCommand<string> = createCommand()

export const INSERT_ATTACHMENT_COMMAND: LexicalCommand<InsertAttachmentPayload> = createCommand()

export default function AttachmentsPlugin({ captionsEnabled }: { captionsEnabled?: boolean }): JSX.Element | null {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!editor.hasNodes([AttachmentNode])) {
      throw new Error('AttachmentsPlugin: AttachmentNode not registered on editor')
    }

    return mergeRegister(
      editor.registerCommand<InsertAttachmentPayload>(
        INSERT_ATTACHMENT_COMMAND,
        (payload) => {
          const attachmentNode = $createAttachmentNode(payload)
          $insertNodes([attachmentNode])
          if ($isRootOrShadowRoot(attachmentNode.getParentOrThrow())) {
            $wrapNodeInElement(attachmentNode, $createParagraphNode).selectEnd()
          }

          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand<DragEvent>(
        DRAGSTART_COMMAND,
        (event) => {
          return onDragStart(event)
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand<DragEvent>(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<DragEvent>(
        DROP_COMMAND,
        (event) => {
          return onDrop(event, editor)
        },
        COMMAND_PRIORITY_HIGH
      )
    )
  }, [captionsEnabled, editor])

  return null
}

const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const img = document.createElement('img')
img.src = TRANSPARENT_IMAGE

function onDragStart(event: DragEvent): boolean {
  const node = getAttachmentNodeInSelection()
  if (!node) {
    return false
  }
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) {
    return false
  }
  dataTransfer.setData('text/plain', '_')
  dataTransfer.setDragImage(img, 0, 0)
  dataTransfer.setData(
    'application/x-lexical-drag',
    JSON.stringify({
      data: {
        altText: node.__altText,
        caption: node.__caption,
        height: node.__height,
        key: node.getKey(),
        maxWidth: node.__maxWidth,
        showCaption: node.__showCaption,
        src: node.__src,
        filename: node.__filename,
        width: node.__width,
      },
      type: 'attachment',
    })
  )

  return true
}

function onDragover(event: DragEvent): boolean {
  const node = getAttachmentNodeInSelection()
  if (!node) {
    return false
  }
  if (!canDropAttachment(event)) {
    event.preventDefault()
  }
  return true
}

function onDrop(event: DragEvent, editor: LexicalEditor): boolean {
  const node = getAttachmentNodeInSelection()
  if (!node) {
    return false
  }
  const data = getDragAttachmentData(event)
  if (!data) {
    return false
  }
  event.preventDefault()
  if (canDropAttachment(event)) {
    const range = getDragSelection(event)
    node.remove()
    const rangeSelection = $createRangeSelection()
    if (range !== null && range !== undefined) {
      rangeSelection.applyDOMRange(range)
    }
    $setSelection(rangeSelection)
    editor.dispatchCommand(INSERT_ATTACHMENT_COMMAND, data)
  }
  return true
}

function getAttachmentNodeInSelection(): AttachmentNode | null {
  const selection = $getSelection()
  if (!$isNodeSelection(selection)) {
    return null
  }
  const nodes = selection.getNodes()
  const node = nodes[0]
  return $isAttachmentNode(node) ? node : null
}

function getDragAttachmentData(event: DragEvent): null | InsertAttachmentPayload {
  const dragData = event.dataTransfer?.getData('application/x-lexical-drag')
  if (!dragData) {
    return null
  }
  const { type, data } = JSON.parse(dragData)
  if (type !== 'attachment') {
    return null
  }

  return data
}

declare global {
  interface DragEvent {
    rangeOffset?: number
    rangeParent?: Node
  }
}

function canDropAttachment(event: DragEvent): boolean {
  const target = event.target
  return !!(
    target &&
    target instanceof HTMLElement &&
    !target.closest('code, span.editor-attachment') &&
    target.parentElement &&
    target.parentElement.closest('div.ContentEditable__root')
  )
}

function getDragSelection(event: DragEvent): Range | null | undefined {
  let range
  const domSelection = getSelection()
  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(event.clientX, event.clientY)
  } else if (event.rangeParent && domSelection !== null) {
    domSelection.collapse(event.rangeParent, event.rangeOffset || 0)
    range = domSelection.getRangeAt(0)
  } else {
    throw Error(`Cannot get the selection when dragging`)
  }

  return range
}
