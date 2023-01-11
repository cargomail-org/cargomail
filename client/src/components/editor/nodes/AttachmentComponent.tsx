import type { GridSelection, LexicalEditor, NodeKey, NodeSelection, RangeSelection } from 'lexical'

import './AttachmentNode.css'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection'
import { mergeRegister } from '@lexical/utils'
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  $setSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  DRAGSTART_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import * as React from 'react'
import { Suspense, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { useSettings } from '../context/SettingsContext'
import { useSharedHistoryContext } from '../context/SharedHistoryContext'
import { MaxLengthPlugin } from '../plugins/MaxLengthPlugin'
import KeywordsPlugin from '../plugins/KeywordsPlugin'
import LinkPlugin from '../plugins/LinkPlugin'
import TreeViewPlugin from '../plugins/TreeViewPlugin'
import ContentEditable from '../ui/ContentEditable'
import ImageResizer from '../ui/ImageResizer'
import Placeholder from '../ui/Placeholder'
import { $isAttachmentNode } from './AttachmentNode'
import { AttachmentsContext } from '../../../context/AttachmentsContext'

import jsSHA from 'jssha'

const imageCache = new Set()

function useSuspenseImage(src: string) {
  if (!imageCache.has(src)) {
    throw new Promise((resolve) => {
      const img = new Image()
      img.src = src
      img.onload = () => {
        imageCache.add(src)
        resolve(null)
      }
    })
  }
}

function LazyAttachment({
  altText,
  className,
  imageRef,
  src,
  width,
  height,
  maxWidth,
}: {
  altText: string
  className: string | null
  height: 'inherit' | number
  imageRef: { current: null | HTMLImageElement }
  maxWidth: number
  src: string
  width: 'inherit' | number
}): JSX.Element {
  useSuspenseImage(src)
  return (
    <img
      className={className || undefined}
      src={src}
      alt={altText}
      ref={imageRef}
      style={{
        height,
        maxWidth,
        width,
      }}
      draggable="false"
    />
  )
}

export default function AttachmentComponent({
  src,
  id,
  transientUri,
  sha256sum,
  altText,
  nodeKey,
  width,
  height,
  maxWidth,
  resizable,
  showCaption,
  caption,
  captionsEnabled,
}: {
  altText: string
  caption: LexicalEditor
  height: 'inherit' | number
  maxWidth: number
  nodeKey: NodeKey
  resizable: boolean
  showCaption: boolean
  src: string
  id: string
  transientUri: string
  sha256sum: string
  width: 'inherit' | number
  captionsEnabled: boolean
}): JSX.Element {
  const imageRef = useRef<null | HTMLImageElement>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const [editor] = useLexicalComposerContext()
  const [selection, setSelection] = useState<RangeSelection | NodeSelection | GridSelection | null>(null)
  const activeEditorRef = useRef<LexicalEditor | null>(null)
  const { attachments } = useContext(AttachmentsContext)

  const onDelete = useCallback(
    (payload: KeyboardEvent) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        const event: KeyboardEvent = payload
        event.preventDefault()
        const node = $getNodeByKey(nodeKey)
        if ($isAttachmentNode(node)) {
          node.remove()
        }
        setSelected(false)
      }
      return false
    },
    [isSelected, nodeKey, setSelected]
  )

  const onEnter = useCallback(
    (event: KeyboardEvent) => {
      const latestSelection = $getSelection()
      const buttonElem = buttonRef.current
      if (isSelected && $isNodeSelection(latestSelection) && latestSelection.getNodes().length === 1) {
        if (showCaption) {
          // Move focus into nested editor
          $setSelection(null)
          event.preventDefault()
          caption.focus()
          return true
        } else if (buttonElem !== null && buttonElem !== document.activeElement) {
          event.preventDefault()
          buttonElem.focus()
          return true
        }
      }
      return false
    },
    [caption, isSelected, showCaption]
  )

  const onEscape = useCallback(
    (event: KeyboardEvent) => {
      if (activeEditorRef.current === caption || buttonRef.current === event.target) {
        $setSelection(null)
        editor.update(() => {
          setSelected(true)
          const parentRootElement = editor.getRootElement()
          if (parentRootElement !== null) {
            parentRootElement.focus()
          }
        })
        return true
      }
      return false
    },
    [caption, editor, setSelected]
  )

  useEffect(() => {
    caption.setEditable(editor.isEditable())

    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        setSelection(editorState.read(() => $getSelection()))
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_, activeEditor) => {
          activeEditorRef.current = activeEditor
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand<MouseEvent>(
        CLICK_COMMAND,
        (payload) => {
          const event = payload

          if (isResizing) {
            return true
          }
          if (event.target === imageRef.current) {
            if (event.shiftKey) {
              setSelected(!isSelected)
            } else {
              clearSelection()
              setSelected(true)
            }
            return true
          }

          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        DRAGSTART_COMMAND,
        (event) => {
          if (event.target === imageRef.current) {
            // TODO This is just a temporary workaround for FF to behave like other browsers.
            // Ideally, this handles drag & drop too (and all browsers).
            event.preventDefault()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(KEY_DELETE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_BACKSPACE_COMMAND, onDelete, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ENTER_COMMAND, onEnter, COMMAND_PRIORITY_LOW),
      editor.registerCommand(KEY_ESCAPE_COMMAND, onEscape, COMMAND_PRIORITY_LOW)
    )
  }, [clearSelection, editor, caption, isResizing, isSelected, nodeKey, onDelete, onEnter, onEscape, setSelected])

  const setShowCaption = () => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isAttachmentNode(node)) {
        node.setShowCaption(true)
      }
    })
  }

  const onResizeEnd = (nextWidth: 'inherit' | number, nextHeight: 'inherit' | number) => {
    // Delay hiding the resize bars for click case
    setTimeout(() => {
      setIsResizing(false)
    }, 200)

    editor.update(() => {
      const node = $getNodeByKey(nodeKey)
      if ($isAttachmentNode(node)) {
        node.setWidthAndHeight(nextWidth, nextHeight)
      }
    })
  }

  const onResizeStart = () => {
    setIsResizing(true)
  }

  const { historyState } = useSharedHistoryContext()
  const {
    settings: { showNestedEditorTreeView },
  } = useSettings()

  const draggable = isSelected && $isNodeSelection(selection)
  const isFocused = isSelected || isResizing

  return (
    <Suspense fallback={null}>
      <>
        <div className="attachment-body-container" draggable={draggable}>
          <LazyAttachment
            className={isFocused ? `focused ${$isNodeSelection(selection) ? 'draggable' : ''}` : null}
            src={src}
            altText={altText}
            imageRef={imageRef}
            width={width}
            height={height}
            maxWidth={maxWidth}
          />
          <div className="attachment-progress-container">
            {(() => {
              const attachment = attachments.find((a) => a.id === id)
              const downloadUrl = attachment?.downloadUrl || ''

              const streamToFile = async (url: any) => {
                let shaObj: any

                // readable stream
                const rs_src = fetch(url).then((response) => response.body)

                // writable stream
                // @ts-ignore
                const ws_dest = window.showSaveFilePicker().then((handle: any) => handle.createWritable())

                // dummy transform stream to compute checksum
                const ts_dec = new TransformStream({
                  start() {
                    shaObj = new jsSHA('SHA-256', 'ARRAYBUFFER')
                  },
                  async transform(chunk, controller) {
                    shaObj.update(chunk)
                    controller.enqueue(await chunk)
                  },
                  flush(controller) {
                    console.log('Download:', shaObj.getHash('HEX'))
                    // controller.error(new Error('what?'))
                  },
                })

                // stream to tmp
                const rs_tmp = rs_src.then((s: any) => s.pipeThrough(ts_dec))
                // stream to file
                return (await rs_tmp).pipeTo(await ws_dest).catch((err: any) => console.log(err))
              }

              return downloadUrl.length > 0 ? (
                // eslint-disable-next-line jsx-a11y/anchor-is-valid
                <a
                  href="#"
                  onClick={() => {
                    streamToFile(downloadUrl)
                  }}>
                  Download
                </a>
              ) : (
                attachment?.progress.toString().concat('%')
              )
            })()}
          </div>
        </div>
        {showCaption && (
          <div className="attachment-caption-container">
            <LexicalNestedComposer initialEditor={caption}>
              <MaxLengthPlugin maxLength={500} />
              <LinkPlugin />
              <HashtagPlugin />
              <KeywordsPlugin />
              <HistoryPlugin externalHistoryState={historyState} />
              <OnChangePlugin
                ignoreSelectionChange={true}
                onChange={() => {
                  editor.setEditorState(editor.getEditorState())
                }}
              />
              <RichTextPlugin
                contentEditable={
                  <div className="attachment-caption-scroller">
                    <ContentEditable className="AttachmentNode__contentEditable" />
                  </div>
                }
                placeholder={<Placeholder className="AttachmentNode__placeholder">Enter a caption...</Placeholder>}
                ErrorBoundary={LexicalErrorBoundary}
              />
              {showNestedEditorTreeView === true ? <TreeViewPlugin /> : null}
            </LexicalNestedComposer>
          </div>
        )}
        {resizable && $isNodeSelection(selection) && isFocused && (
          <ImageResizer
            showCaption={showCaption}
            setShowCaption={setShowCaption}
            editor={editor}
            buttonRef={buttonRef}
            imageRef={imageRef}
            maxWidth={maxWidth}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            captionsEnabled={captionsEnabled}
          />
        )}
        {/* <div>{id}</div> */}
      </>
    </Suspense>
  )
}
