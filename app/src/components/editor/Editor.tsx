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
import ToolbarPlugin from './plugins/ToolbarPlugin'
import EditorOnChange from './EditorOnChange'
import MentionsPlugin from './plugins/MentionsPlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin'
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin'
import ImagesPlugin from './plugins/ImagesPlugin'
import AttachmentsPlugin from './plugins/AttachmentsPlugin'
import EmojisPlugin from './plugins/EmojisPlugin'
import KeywordsPlugin from './plugins/KeywordsPlugin'
import Placeholder from './ui/Placeholder'
import { useRef, useState } from 'react'

export interface EditorProps {
  initialValue?: string
  mimeType?: string
  onChange: (content: string, plainText: string) => void
}

const Editor = ({ initialValue, mimeType, onChange }: EditorProps) => {
  const text = 'Enter some text...'
  const placeholder = <Placeholder className="editor-placeholder">{text}</Placeholder>
  const scrollRef = useRef(null)
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  const richEditorRef = useRef(null)

  return (
    <LexicalComposer initialConfig={EditorConfig}>
      <div className="editor-container" ref={scrollRef}>
        <MentionsPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <EmojisPlugin />
        <AutoScrollPlugin scrollRef={scrollRef} />
        <div className="rich-editor-container" ref={richEditorRef}>
          <RichTextPlugin
            contentEditable={
              <div className="editor-scroller">
                <div className="editor-shell" ref={onRef}>
                  <ContentEditable />
                </div>
              </div>
            }
            placeholder={placeholder}
          />
        </div>
        <HistoryPlugin />
        <CheckListPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <CodeHighlightPlugin />
        <HorizontalRulePlugin />
        <ImagesPlugin />
        <AttachmentsPlugin />
        <ToolbarPlugin />
        <EditorSetValue value={initialValue || ''} mimeType={mimeType || ''} />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            EditorOnChange(editorState, editor, mimeType || '', onChange)
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
