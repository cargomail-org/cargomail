import { $getRoot, EditorState, LexicalEditor } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'

export default function EditorOnChange(
  editorState: EditorState,
  editor: LexicalEditor,
  mimeType: string,
  onChange: (content: string, plainText: string) => void
) {
  editor.update(() => {
    const root = $getRoot()
    const plainText = root.getTextContent()
    switch (mimeType) {
      case 'application/json': {
        const content = JSON.stringify(editorState)
        onChange(content, plainText)
        break
      }
      default: {
        const content = $generateHtmlFromNodes(editor, null)
        onChange(content, plainText)
      }
    }
  })
}
