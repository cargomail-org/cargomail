import { $generateNodesFromDOM } from '@lexical/html'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { LexicalEditor, $insertNodes } from 'lexical'
import { useEffect } from 'react'

export default function ViewerSetValue({ value, mimeType }: { value: string; mimeType: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value)
      setTimeout(() => {
        setViewerState(editor)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setViewerState = (editor: LexicalEditor) => {
    editor.update(() => {
      switch (mimeType) {
        case 'application/json': {
          const editorState = editor.parseEditorState(value)
          editor.setEditorState(editorState)
          break
        }
        default: {
          const parser = new DOMParser()
          const dom = parser.parseFromString(value, 'text/html')
          const nodes = $generateNodesFromDOM(editor, dom)

          $insertNodes(nodes)
        }
      }
    })
  }

  return null
}
