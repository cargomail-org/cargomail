import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { AutoScrollPlugin } from '@lexical/react/LexicalAutoScrollPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import ContentEditable from './ui/ContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import EditorConfig from './EditorConfig'
import EditorSetValue from './EditorSetValue'
import AttachmentsPlugin from './plugins/AttachmentsPlugin'
import ToolbarPlugin from './plugins/ToolbarPlugin'
import EditorOnChange from './EditorOnChange'
import MentionsPlugin from './plugins/MentionsPlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin'
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin'
import ImagesPlugin from './plugins/ImagesPlugin'
import EmojisPlugin from './plugins/EmojisPlugin'
import KeywordsPlugin from './plugins/KeywordsPlugin'
import Placeholder from './ui/Placeholder'
import { useCallback, useEffect, useRef, useState } from 'react'

export interface EditorProps {
  initialValue?: string
  onChange: (htmlBody: string, plainText: string) => void
}

const Editor = ({ initialValue, onChange }: EditorProps) => {
  const [animate, setAnimate] = useState<Boolean>(false)
  const text = 'Enter some text, or drop files or attachments...'
  const placeholder = <Placeholder className="editor-placeholder">{text}</Placeholder>
  const scrollRef = useRef(null)
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  const richEditorRef = useRef(null)

  useEffect(() => {
    let dragDiv: any = richEditorRef.current
    if (dragDiv) {
      dragDiv.ondragenter = handleDragEnter
      dragDiv.ondragover = handleDragOver
      dragDiv.ondrop = handleDrop
      dragDiv.ondragleave = handleDragLeave
    }
    // eslint-disable-next-line
  }, [richEditorRef.current])

  const handleDragEnter = useCallback((event: any) => {
    event.preventDefault()
    setAnimate(true)
  }, [])

  const handleDragOver = useCallback((event: any) => {
    event.stopPropagation()
    event.preventDefault()
    setAnimate(true)
  }, [])

  const handleDrop = useCallback((event: any) => {
    event.stopPropagation()
    event.preventDefault()
    let dt = event.dataTransfer
    if (dt.types) {
      console.log(dt.types)
    }
    if (dt.files) {
      console.log(dt.files)
    }
    if (dt.items) {
      for (let i = 0; i < dt.items.length; i++) {
        const item = dt.items[i] //Might be renamed to GetAsEntry() in 2020
        if (item) {
          console.log(item)
        }
      }
    }
    // if (dt.files) renderPreview(event, dt.files)
  }, [])

  const handleDragLeave = useCallback(() => {
    // console.log('DragLeave')
    setAnimate(false)
  }, [])

  return (
    <LexicalComposer initialConfig={EditorConfig}>
      <div className="editor-container" ref={scrollRef}>
        <MentionsPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <EmojisPlugin />
        <AutoScrollPlugin scrollRef={scrollRef} />
        <div className="rich-editor-container" ref={richEditorRef}>
          {animate === false ? (
            <RichTextPlugin
              contentEditable={
                <div className="editor-scroller">
                  <div className="editor" ref={onRef}>
                    <ContentEditable />
                  </div>
                </div>
              }
              placeholder={placeholder}
            />
          ) : (
            <>
              <div className="editor-drop-zone">Drop files or attachments here</div>
            </>
          )}
        </div>
        <HistoryPlugin />
        <CheckListPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <CodeHighlightPlugin />
        <HorizontalRulePlugin />
        <ImagesPlugin />
        {/* <AttachmentsPlugin /> */}
        <ToolbarPlugin />
        <EditorSetValue value={initialValue || ''} />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            EditorOnChange(editorState, editor, onChange)
          }}
          ignoreSelectionChange={true}
        />
        {floatingAnchorElem && (
          <>
            <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
      </div>
    </LexicalComposer>
  )
}

export default Editor
