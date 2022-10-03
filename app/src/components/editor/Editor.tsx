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
import EmojisPlugin from './plugins/EmojisPlugin'
import KeywordsPlugin from './plugins/KeywordsPlugin'
import Placeholder from './ui/Placeholder'
import { useRef, useState } from 'react'

export interface EditorProps {
  initialValue?: string
  onChange: (htmlBody: string, plainText: string) => void
}

const Editor = ({ initialValue, onChange }: EditorProps) => {
  const text = 'Content...'
  const placeholder = <Placeholder className="editor-placeholder">{text}</Placeholder>
  const scrollRef = useRef(null)
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <LexicalComposer initialConfig={EditorConfig}>
      <div className="editor-container" ref={scrollRef}>
        <MentionsPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <EmojisPlugin />
        <AutoScrollPlugin scrollRef={scrollRef} />
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
        <EditorSetValue value={initialValue || ''} />
        <OnChangePlugin
          onChange={(editorState, editor) => {
            EditorOnChange(editorState, editor, onChange)
          }}
          ignoreSelectionChange={true}
        />
        <HistoryPlugin />
        <CheckListPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <CodeHighlightPlugin />
        <HorizontalRulePlugin />
        <ImagesPlugin />
        {floatingAnchorElem && (
          <>
            <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
        <ToolbarPlugin />
      </div>
    </LexicalComposer>
  )
}

export default Editor
