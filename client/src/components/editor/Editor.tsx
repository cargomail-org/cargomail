import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import ContentEditable from './ui/ContentEditable'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { HashtagPlugin } from '@lexical/react/LexicalHashtagPlugin'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import EditorConfig from './EditorConfig'
import EditorSetValue from './EditorSetValue'
import ToolbarPlugin from './plugins/ToolbarPlugin'
import EditorOnChange from './EditorOnChange'
import CodeHighlightPlugin from './plugins/CodeHighlightPlugin'
import AutoLinkPlugin from './plugins/AutoLinkPlugin'
import ClickableLinkPlugin from './plugins/ClickableLinkPlugin'
import DragDropPaste from './plugins/DragDropPastePlugin'
import DraggableBlockPlugin from './plugins/DraggableBlockPlugin'
import FloatingLinkEditorPlugin from './plugins/FloatingLinkEditorPlugin'
import HorizontalRulePlugin from './plugins/HorizontalRulePlugin'
import ImagesPlugin from './plugins/ImagesPlugin'
import AttachmentsPlugin from './plugins/AttachmentsPlugin'
import KeywordsPlugin from './plugins/KeywordsPlugin'
import Placeholder from './ui/Placeholder'
import { useEffect, useRef, useState } from 'react'
import { LexicalEditor } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import ActionsPlugin from './plugins/ActionsPlugin'

export interface EditorProps {
  handleEditor: (editor: LexicalEditor) => void
  initialValue?: string
  mimeType?: string
  onChange: (content: string, plainText: string) => void
}

const Editor = ({ handleEditor, initialValue, mimeType, onChange }: EditorProps) => {
  const text = 'Enter some text...'
  const placeholder = <Placeholder className="editor-placeholder">{text}</Placeholder>
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null)

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem)
    }
  }

  const richEditorRef = useRef(null)

  function EditorInstancePlugin(props: any) {
    const [editor] = useLexicalComposerContext()

    useEffect(() => {
      handleEditor(editor)
    }, [editor])

    return null
  }

  return (
    <LexicalComposer initialConfig={EditorConfig}>
      <div className="editor-container">
        <DragDropPaste />
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
            placeholder={placeholder}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <EditorInstancePlugin />
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
            <DraggableBlockPlugin anchorElem={floatingAnchorElem} />
            <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
          </>
        )}
        <ActionsPlugin isRichText={true} />
      </div>
    </LexicalComposer>
  )
}

export default Editor
