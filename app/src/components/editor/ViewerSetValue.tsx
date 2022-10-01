import { $generateNodesFromDOM } from '@lexical/html'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { $createParagraphNode, $getRoot, LexicalEditor } from 'lexical'
import { useEffect } from 'react'

export default function ViewerSetValue({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (value) setViewerState(editor)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const setViewerState = (editor: LexicalEditor) => {
    editor.update(() => {
      const parser = new DOMParser()
      const dom = parser.parseFromString(value, 'text/html')
      const nodes = $generateNodesFromDOM(editor, dom)

      const root = $getRoot()
      const paragraphNode = $createParagraphNode()
      nodes.forEach((node) => paragraphNode.append(node))
      root.getFirstChild()?.replace(paragraphNode)
    })
  }

  return null
}
