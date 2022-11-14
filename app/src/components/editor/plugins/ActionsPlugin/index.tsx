import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  createEditor,
  LexicalEditor,
} from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { useEffect, useState } from 'react'

import useModal from '../../hooks/useModal'
import Button from '../../ui/Button'
import { InsertAttachmentPayload, INSERT_ATTACHMENT_COMMAND, SHOW_FILE_DIALOG_COMMAND } from '../AttachmentsPlugin'
import Dropzone from './Dropzone'

export default function ActionsPlugin({ isRichText }: { isRichText: boolean }): JSX.Element {
  const [editor] = useLexicalComposerContext()
  const [isEditable, setIsEditable] = useState(() => editor.isEditable())
  const [modal, showModal] = useModal()

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable)
      }),
      editor.registerCommand(
        SHOW_FILE_DIALOG_COMMAND,
        (payload: string) => {
          if (isEditable) {
            showModal('Select Files', (onClose) => <ShowUploadDialog editor={editor} onClose={onClose} />)
          }
          return false
        },
        COMMAND_PRIORITY_LOW
      )
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  return <div className="actions">{modal}</div>
}

function ShowUploadDialog({ editor, onClose }: { editor: LexicalEditor; onClose: () => void }): JSX.Element {
  const [validFiles, setValidFiles] = useState<any>([])

  return (
    <>
      <div className="Modal__content">
        <Dropzone validFiles={validFiles} setValidFiles={setValidFiles} />
        <div className="Modal__buttons_bar">
          <Button
            onClick={() => {
              validFiles.map((file: any) => {
                const captionEditor: LexicalEditor = createEditor()
                captionEditor.update(() => {
                  const root = $getRoot()
                  const paragraph = $createParagraphNode()
                  paragraph.append($createTextNode(file.name))
                  root.append(paragraph)
                })
                const attachmentPayload: InsertAttachmentPayload = {
                  src: '/images/cargo-container-blue.png',
                  width: 180,
                  height: 150,
                  file: file,
                  altText: 'attachment',
                  captionsEnabled: true,
                  showCaption: true,
                  caption: captionEditor,
                }
                return editor.dispatchCommand(INSERT_ATTACHMENT_COMMAND, attachmentPayload)
              })
              editor.focus()
              onClose()
            }}>
            Upload
          </Button>{' '}
          <Button
            onClick={() => {
              editor.focus()
              onClose()
            }}>
            Cancel
          </Button>
        </div>
      </div>
    </>
  )
}
