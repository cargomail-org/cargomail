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

import { createEditor, DecoratorNode } from 'lexical'
import * as React from 'react'
import { Suspense } from 'react'
import { createTusUploadInstance } from '../../../api/fileAPI'

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
  file?: any
  width?: number
  captionsEnabled?: boolean
}

// function convertAttachmentElement(domNode: Node): null | DOMConversionOutput {
//   if (domNode instanceof HTMLAttachmentElement) {
//     const { alt: altText, src, file } = domNode
//     const node = $createAttachmentNode({ altText, src, file })
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
    width?: number
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
  __uploadInst: any
  __showCaption: boolean
  __caption: LexicalEditor
  // Captions cannot yet be used within editor cells
  __captionsEnabled: boolean

  static getType(): string {
    return 'attachment'
  }

  static clone(node: AttachmentNode): AttachmentNode {
    return new AttachmentNode(
      node.__src,
      node.__altText,
      node.__maxWidth,
      node.__uploadInst,
      node.__width,
      node.__height,
      node.__showCaption,
      node.__caption,
      node.__captionsEnabled,
      node.__key
    )
  }

  static importJSON(serializedNode: SerializedAttachmentNode): AttachmentNode {
    const { altText, height, width, maxWidth, caption, src, showCaption } = serializedNode
    const node = $createAttachmentNode({
      altText,
      height,
      maxWidth,
      showCaption,
      src,
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
    uploadInst?: any,
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
    this.__uploadInst = uploadInst
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

  getUploadInst(): string {
    return this.__uploadInst
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
          uploadInst={this.__uploadInst}
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
  file,
  width,
  showCaption,
  caption,
  key,
}: AttachmentPayload): AttachmentNode {
  const uploadInst = file ? createTusUploadInstance(file) : null
  return new AttachmentNode(
    src,
    altText,
    maxWidth,
    uploadInst,
    width,
    height,
    showCaption,
    caption,
    captionsEnabled,
    key
  )
}

export function $isAttachmentNode(node: LexicalNode | null | undefined): node is AttachmentNode {
  return node instanceof AttachmentNode
}
