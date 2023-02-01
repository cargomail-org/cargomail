import type {
  //   DOMConversionMap,
  //   DOMConversionOutput,
  //   DOMExportOutput,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  SerializedEditor,
  SerializedLexicalNode,
  Spread,
} from 'lexical'

import { $applyNodeReplacement, createEditor, DecoratorNode } from 'lexical'
import * as React from 'react'
import { Suspense } from 'react'

const AttachmentComponent = React.lazy(
  // @ts-ignore
  () => import('./AttachmentComponent')
)

export interface AttachmentPayload {
  altText: string
  caption?: LexicalEditor
  height?: number
  key?: NodeKey
  maxWidth?: number
  showCaption?: boolean
  src: string
  uploadId?: string
  downloadUrl?: string
  filename?: string
  mimeType?: string
  fileSize?: number
  sha256sum?: string
  width?: number
  captionsEnabled?: boolean
}

// function convertAttachmentElement(domNode: Node): null | DOMConversionOutput {
//   if (domNode instanceof HTMLAttachmentElement) {
//     const { alt: altText, src, uploadId, downloadUrl, filename, mimeType, fileSize, sha256sum } = domNode
//     const node = $createAttachmentNode({ altText, src, uploadId, downloadUrl, filename, mimeType, fileSize, sha256sum })
//     return { node }
//   }
//   return null
// }

export type SerializedAttachmentNode = Spread<
  {
    altText: string
    caption: SerializedEditor
    height?: number
    maxWidth: number
    showCaption: boolean
    src: string
    uploadId: string
    downloadUrl: string
    filename: string
    mimeType: string
    fileSize: number
    sha256sum: string
    width: number
    type: 'attachment'
    version: 1
  },
  SerializedLexicalNode
>

export class AttachmentNode extends DecoratorNode<JSX.Element> {
  __src: string
  __altText: string
  __width: 'inherit' | number
  __height: 'inherit' | number
  __maxWidth: number
  __uploadId: string
  __downloadUrl: string
  __filename: string
  __mimeType: string
  __fileSize: number
  __sha256sum: string
  __showCaption: boolean
  __caption: LexicalEditor
  // Captions cannot yet be used within editor cells
  __captionsEnabled: boolean

  // attachments state from the AttachmentContext provider
  static attachments: any

  static setAttachments(attachments: any) {
    this.attachments = attachments
  }

  static getType(): string {
    return 'attachment'
  }

  static clone(node: AttachmentNode): AttachmentNode {
    return new AttachmentNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__uploadId,
      node.__downloadUrl,
      node.__filename,
      node.__mimeType,
      node.__fileSize,
      node.__sha256sum,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__captionsEnabled,
      node.__key
    )
  }

  static importJSON(serializedNode: SerializedAttachmentNode): AttachmentNode {
    const {
      altText,
      height,
      width,
      maxWidth,
      caption,
      src,
      uploadId,
      downloadUrl,
      filename,
      mimeType,
      fileSize,
      sha256sum,
      showCaption,
    } = serializedNode
    const node = $createAttachmentNode({
      altText,
      height,
      maxWidth,
      showCaption,
      src,
      uploadId,
      downloadUrl,
      filename,
      mimeType,
      fileSize,
      sha256sum,
      width,
    })
    const nestedEditor = node.__caption
    const editorState = nestedEditor.parseEditorState(caption.editorState)
    if (!editorState.isEmpty()) {
      nestedEditor.setEditorState(editorState)
    }
    return node
  }

  //   exportDOM(): DOMExportOutput {
  //     const element = document.createElement('img')
  //     element.setAttribute('src', this.__src)
  //     element.setAttribute('alt', this.__altText)
  //     return { element }
  //   }

  //   static importDOM(): DOMConversionMap | null {
  //     return {
  //       img: (node: Node) => ({
  //         conversion: convertAttachmentElement,
  //         priority: 0,
  //       }),
  //     }
  //   }

  constructor(
    src: string,
    altText: string,
    maxWidth: number,
    uploadId?: string,
    downloadUrl?: string,
    filename?: string,
    mimeType?: string,
    fileSize?: number,
    sha256sum?: string,
    width?: 'inherit' | number,
    height?: 'inherit' | number,
    showCaption?: boolean,
    caption?: LexicalEditor,
    captionsEnabled?: boolean,
    key?: NodeKey
  ) {
    super(key)
    this.__src = src
    this.__altText = altText
    this.__maxWidth = maxWidth
    this.__uploadId = uploadId || ''
    this.__downloadUrl = downloadUrl || ''
    this.__filename = filename || ''
    this.__mimeType = mimeType || ''
    this.__fileSize = fileSize || -1
    this.__sha256sum = sha256sum || ''
    this.__width = width || 'inherit'
    this.__height = height || 'inherit'
    this.__showCaption = showCaption || false
    this.__caption = caption || createEditor()
    this.__captionsEnabled = captionsEnabled || captionsEnabled === undefined
  }

  exportJSON(): SerializedAttachmentNode {
    return {
      altText: this.getAltText(),
      caption: this.__caption.toJSON(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      src: this.getSrc(),
      uploadId: this.getUploadId(),
      downloadUrl: this.getDownloadUrl(),
      filename: this.getFilename(),
      mimeType: this.getMimeType(),
      fileSize: this.getFileSize(),
      sha256sum: this.getSha256sum(),
      type: 'attachment',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    }
  }

  setWidthAndHeight(width: 'inherit' | number, height: 'inherit' | number): void {
    const writable = this.getWritable()
    writable.__width = width
    writable.__height = height
  }

  setShowCaption(showCaption: boolean): void {
    const writable = this.getWritable()
    writable.__showCaption = showCaption
  }

  setUploadId(uploadId: string): void {
    const writable = this.getWritable()
    writable.__uploadId = uploadId
  }

  setDownloadUrl(downloadUrl: string): void {
    const writable = this.getWritable()
    writable.__downloadUrl = downloadUrl
  }

  setFilename(filename: string): void {
    const writable = this.getWritable()
    writable.__filename = filename
  }

  setMimeType(mimeType: string): void {
    const writable = this.getWritable()
    writable.__mimeType = mimeType
  }

  setFileSize(fileSize: number): void {
    const writable = this.getWritable()
    writable.__fileSize = fileSize
  }

  setSha256sum(sha256sum: string): void {
    const writable = this.getWritable()
    writable.__sha256sum = sha256sum
  }

  // View

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement('span')
    const theme = config.theme
    const className = theme.attachment
    if (className !== undefined) {
      span.className = className
    }
    return span
  }

  updateDOM(): false {
    return false
  }

  getSrc(): string {
    return this.__src
  }

  getUploadId(): string {
    if (this.getDownloadUrl().length > 0) {
      return ''
    } else {
      const attachment =
        this.__uploadId.length > 0 ? AttachmentNode.attachments?.find((a: any) => a.uploadId === this.__uploadId) : null
      return attachment?.uploadId || this.__uploadId
    }
  }

  getDownloadUrl(): string {
    if (this.__downloadUrl.length > 0) {
      return this.__downloadUrl
    } else {
      const attachment =
        this.__uploadId.length > 0 ? AttachmentNode.attachments?.find((a: any) => a.uploadId === this.__uploadId) : null
      return attachment?.downloadUrl || this.__downloadUrl
    }
  }

  getFilename(): string {
    if (this.__filename.length > 0) {
      return this.__filename
    } else {
      const attachment =
        this.__uploadId.length > 0 ? AttachmentNode.attachments?.find((a: any) => a.uploadId === this.__uploadId) : null
      return attachment?.filename || this.__filename
    }
  }

  getMimeType(): string {
    if (this.__mimeType.length > 0) {
      return this.__mimeType
    } else {
      const attachment =
        this.__uploadId.length > 0 ? AttachmentNode.attachments?.find((a: any) => a.uploadId === this.__uploadId) : null
      return attachment?.mimeType || this.__mimeType
    }
  }

  getFileSize(): number {
    if (this.__fileSize >= 0) {
      return this.__fileSize
    } else {
      const attachment =
        this.__uploadId.length > 0 ? AttachmentNode.attachments?.find((a: any) => a.uploadId === this.__uploadId) : null
      return attachment?.fileSize || this.__fileSize
    }
  }

  getSha256sum(): string {
    if (this.__sha256sum.length > 0) {
      return this.__sha256sum
    } else {
      const attachment =
        this.__uploadId.length > 0 ? AttachmentNode.attachments?.find((a: any) => a.uploadId === this.__uploadId) : null
      return attachment?.sha256sum || this.__sha256sum
    }
  }

  getAltText(): string {
    return this.__altText
  }

  decorate(): JSX.Element {
    return (
      <Suspense fallback={null}>
        <AttachmentComponent
          src={this.__src}
          altText={this.__altText}
          width={this.__width}
          height={this.__height}
          maxWidth={this.__maxWidth}
          uploadId={this.__uploadId}
          downloadUrl={this.__downloadUrl}
          filename={this.__filename}
          mimeType={this.__mimeType}
          fileSize={this.__fileSize}
          sha256sum={this.__sha256sum}
          nodeKey={this.getKey()}
          showCaption={this.__showCaption}
          caption={this.__caption}
          captionsEnabled={this.__captionsEnabled}
          resizable={true}
        />
      </Suspense>
    )
  }
}

export function $createAttachmentNode({
  altText,
  height,
  maxWidth = 444,
  captionsEnabled,
  src,
  uploadId,
  downloadUrl,
  filename,
  mimeType,
  fileSize,
  sha256sum,
  width,
  showCaption,
  caption,
  key,
}: AttachmentPayload): AttachmentNode {
  return $applyNodeReplacement(
    new AttachmentNode(
      src,
      altText,
      maxWidth,
      uploadId,
      downloadUrl,
      filename,
      mimeType,
      fileSize,
      sha256sum,
      width,
      height,
      showCaption,
      caption,
      captionsEnabled,
      key
    )
  )
}

export function $isAttachmentNode(node: LexicalNode | null | undefined): node is AttachmentNode {
  return node instanceof AttachmentNode
}
