import { $generateNodesFromDOM } from '@lexical/html'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalEditor, $insertNodes } from 'lexical'
import { useEffect } from 'react'

export default function EditorSetValue({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value) setEditorState(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setEditorState = (editor: LexicalEditor) => {
    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(value, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)

      $insertNodes(nodes)
    })
  }

  return null
}
