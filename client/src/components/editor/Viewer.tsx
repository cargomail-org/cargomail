import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import ContentEditable from './ui/ContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import ViewerConfig from './ViewerConfig'
import ViewerSetValue from './ViewerSetValue'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import ClickableLinkPlugin from './plugins/ClickableLinkPlugin'
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin'
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin'
import ImagesPlugin from './plugins/ImagesPlugin'
import KeywordsPlugin from './plugins/KeywordsPlugin'
import { useRef, useState } from 'react'

export interface EditorProps {
  initialValue?: string
  mimeType?: string
}

const Viewer = ({ initialValue, mimeType }: EditorProps) => {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  const richEditorRef = useRef(null)

  return (
    <LexicalComposer initialConfig={ViewerConfig}>
      <div className="editor-container">
        <HashtagPlugin />
        <KeywordsPlugin />
        <div className="rich-editor-container" ref={richEditorRef}>
          <RichTextPlugin
            contentEditable={
              <div className="editor-scroller">
                <div className="editor-shell" ref={onRef}>
                  <ContentEditable />
                </div>
              </div>
            }
            placeholder=""
            ErrorBoundary={LexicalErrorBoundary}
          />
          {/* <EditorInstancePlugin /> */}
        </div>
        <HistoryPlugin />
        <CheckListPlugin />
        <ListPlugin />
        <LinkPlugin />
        <AutoLinkPlugin />
        <ClickableLinkPlugin />
        <CodeHighlightPlugin />
        <HorizontalRulePlugin />
        <ImagesPlugin />
        <ViewerSetValue value={initialValue || ''} mimeType={mimeType || ''} />
        {floatingAnchorElem && (
          <>
            <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
      </div>
    </LexicalComposer>
  )
}

export default Viewer
