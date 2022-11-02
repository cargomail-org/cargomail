import { COMMAND_PRIORITY_LOW, LexicalEditor } from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import useModal from '../../hooks/useModal'
import Button from '../../ui/Button'
import { SHOW_FILE_DIALOG_COMMAND } from '../AttachmentsPlugin'

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
        <FileDropzone
          onDrop={(acceptedFiles: any) => {
            console.log(acceptedFiles)
          }}
        />
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

const baseStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '20px',
  borderWidth: 2,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'dashed',
  backgroundColor: '#fafafa',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
}

const focusedStyle = {
  borderColor: '#2196f3',
}

const acceptStyle = {
  borderColor: '#00e676',
}

const rejectStyle = {
  borderColor: '#ff1744',
}

function FileDropzone({ onDrop }: any) {
  const { getRootProps, getInputProps, acceptedFiles, open, isDragAccept, isFocused, isDragReject } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
  })

  const style: any = useMemo(
    () => ({
      ...baseStyle,
      ...(isFocused ? focusedStyle : {}),
      ...(isDragAccept ? acceptStyle : {}),
      ...(isDragReject ? rejectStyle : {}),
    }),
    [isFocused, isDragAccept, isDragReject]
  )

  const lists = acceptedFiles.map((list: any) => (
    <li key={list.path}>
      {list.path} - {list.size} bytes
    </li>
  ))

  return (
    <>
      <section className="dropzone">
        <div className="dropzone" {...getRootProps({ style })}>
          <input {...getInputProps()} />
          <p>Drag 'n' drop some files here</p>
          <button type="button" className="btn" onClick={open}>
            Click to select file
          </button>
        </div>
      </section>
      <aside>
        <p>{lists}</p>
      </aside>
    </>
  )
}
