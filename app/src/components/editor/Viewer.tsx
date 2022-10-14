import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { AutoScrollPlugin } from '@lexical/react/LexicalAutoScrollPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import ContentEditable from './ui/ContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import ViewerConfig from './ViewerConfig'
import ViewerSetValue from './ViewerSetValue'
import MentionsPlugin from './plugins/MentionsPlugin'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin'
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin'
import ImagesPlugin from './plugins/ImagesPlugin'
import EmojisPlugin from './plugins/EmojisPlugin'
import KeywordsPlugin from './plugins/KeywordsPlugin'
import { useRef, useState } from 'react'

export interface EditorProps {
  initialValue?: string
  mimeType?: string
}

const Viewer = ({ initialValue, mimeType }: EditorProps) => {
  const scrollRef = useRef(null)
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  return (
    <LexicalComposer initialConfig={ViewerConfig}>
      <div className="viewer-container" ref={scrollRef}>
        <MentionsPlugin />
        <HashtagPlugin />
        <KeywordsPlugin />
        <EmojisPlugin />
        <AutoScrollPlugin scrollRef={scrollRef} />
        <RichTextPlugin
          contentEditable={
            <div className="viewer-scroller">
              <div className="viewer" ref={onRef}>
                <ContentEditable />
              </div>
            </div>
          }
          placeholder=""
        />
        <ViewerSetValue value={initialValue || ''} mimeType={mimeType || ''} />
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
      </div>
    </LexicalComposer>
  )
}

export default Viewer
