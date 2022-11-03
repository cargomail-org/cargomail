import { COMMAND_PRIORITY_LOW, LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import * as React from 'react'
import { useEffect, useState } from 'react'

import useModal from '../../hooks/useModal'
import Button from '../../ui/Button'
import { SHOW_FILE_DIALOG_COMMAND } from '../AttachmentsPlugin'
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
  return (
    <>
      <div className="Modal__content">
        <Dropzone />
        <div className="Modal__buttons_bar">
          <Button
            onClick={() => {
              // editor.dispatchCommand(INSERT_ATTACHMENT_COMMAND, data)
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
