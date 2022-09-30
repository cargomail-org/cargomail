import { $getRoot, EditorState, LexicalEditor } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'

export default function EditorOnChange(
  editorState: EditorState,
  editor: LexicalEditor,
  onChange: (htmlBody: string, plainText: string) => void
) {
  editorState.toJSON()
  editor.update(() => {
    const root = $getRoot()
    const plainText = root.getTextContent()
    const htmlBody = $generateHtmlFromNodes(editor, null)
    onChange(htmlBody, plainText)
  })
}
