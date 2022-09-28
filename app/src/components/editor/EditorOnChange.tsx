import { EditorState, LexicalEditor } from 'lexical'
import { $generateHtmlFromNodes } from '@lexical/html'

export default function EditorOnChange(
  editorState: EditorState,
  editor: LexicalEditor,
  onChange: (html: string) => void
) {
  editorState.toJSON()
  editor.update(() => {
    const html = $generateHtmlFromNodes(editor)
    const parser = new DOMParser()
    const dom = parser.parseFromString(html, 'text/html')
    onChange(dom.body.innerHTML)
  })
}
