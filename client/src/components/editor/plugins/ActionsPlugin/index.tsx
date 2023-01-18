import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  createEditor,
  LexicalEditor,
  LexicalNode,
} from 'lexical'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { mergeRegister } from '@lexical/utils'
import { useContext, useEffect, useState } from 'react'

import useModal from '../../hooks/useModal'
import Button from '../../ui/Button'
import { InsertAttachmentPayload, INSERT_ATTACHMENT_COMMAND, SHOW_FILE_DIALOG_COMMAND } from '../AttachmentsPlugin'
import Dropzone from './Dropzone'
import { createTusUploadInstance } from '../../../../api/fileAPI'
import { AttachmentsContext } from '../../../../context'
import { IAttachment } from '../../../../context/AttachmentsContext'
import { $isAttachmentNode, AttachmentNode } from '../../nodes/AttachmentNode'

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

function uuidv4() {
  return `${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`.replace(/[018]/g, (c: any) =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
  )
}

function getAllAttachmentNodes(node: LexicalNode): Array<AttachmentNode> {
  let attachmentNodes: Array<AttachmentNode> = []
  let children: Array<LexicalNode> = []

  if ($isAttachmentNode(node)) {
    attachmentNodes.push(node)
  }

  if (node.getChildren) {
    children = node.getChildren()
    for (const child of children) {
      attachmentNodes = attachmentNodes.concat(getAllAttachmentNodes(child))
    }
  }

  return attachmentNodes
}

function ShowUploadDialog({ editor, onClose }: { editor: LexicalEditor; onClose: () => void }): JSX.Element {
  const [validFiles, setValidFiles] = useState<any>([])
  const { addAttachment, updateAttachment, updateProgress } = useContext(AttachmentsContext)

  return (
    <>
      <div className="Modal__content">
        <Dropzone validFiles={validFiles} setValidFiles={setValidFiles} />
        <div className="Modal__buttons_bar">
          <Button
            onClick={() => {
              validFiles.map((file: any) => {
                const uploadId = uuidv4()

                const upload = createTusUploadInstance(file, uploadId)

                const attachment: IAttachment = { uploadId, upload, progress: 0, downloadUrl: null, sha256sum: null }

                attachment.upload.options.onProgress = (bytesUploaded: any, bytesTotal: any) => {
                  const percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2)
                  attachment.progress = parseFloat(percentage)
                  updateProgress(attachment)
                }

                attachment.upload.options.onSuccess = () => {
                  attachment.downloadUrl = attachment.upload.url
                  attachment.sha256sum = attachment.upload.sha256sum

                  // TODO Do not update via API, tus do

                  // editor.getEditorState().read(() => {
                  editor.update(() => {
                    // https://github.com/facebook/lexical/issues/3419
                    const attachmentChildren: Array<AttachmentNode> = getAllAttachmentNodes($getRoot())

                    for (const attachmentChild of attachmentChildren) {
                      if (attachmentChild.getUploadId() === uploadId) {
                        attachmentChild.setUploadId('')
                        attachmentChild.setSha256sum(attachment.sha256sum || '')
                        attachmentChild.setTransientUri(attachment.downloadUrl || '')
                      }
                    }
                  })

                  updateAttachment(attachment)
                }

                addAttachment(attachment)

                attachment.upload.start()

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
                  uploadId: uploadId,
                  transientUri: '',
                  sha256sum: '',
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
