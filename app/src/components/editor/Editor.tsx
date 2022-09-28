import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { AutoScrollPlugin } from '@lexical/react/LexicalAutoScrollPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import EditorConfig from './EditorConfig'
import EditorSetValue from './EditorSetValue'
import EditorToolbar from './EditorToolbar'
import EditorOnChange from './EditorOnChange'
import MentionsPlugin from './plugins/MentionsPlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin'
import Placeholder from './ui/Placeholder'
import { useRef, useState } from 'react'

export interface EditorProps {
  initialValue?: string
  onChange: (html: string) => void
  editMode: boolean
}

const Editor = ({ initialValue, onChange, editMode }: EditorProps) => {
  const text = 'Enter some rich text...'
  const placeholder = <Placeholder>{text}</Placeholder>
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
        <div className="editor-inner">
          <MentionsPlugin />
          <HashtagPlugin />
          {/* <RichTextPlugin
            contentEditable={<ContentEditable className="editor-input" />}
            placeholder={<Placeholder />}
          /> */}
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
          <OnChangePlugin onChange={(editorState, editor) => EditorOnChange(editorState, editor, onChange)} />
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          <AutoLinkPlugin />
          <CodeHighlightPlugin />
          {floatingAnchorElem && (
            <>
              <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
            </>
          )}
        </div>
      </div>
      <EditorToolbar />
    </LexicalComposer>
  )
}

// function Placeholder() {
//   return <div className="editor-placeholder">Enter some text...</div>
// }

export default Editor
