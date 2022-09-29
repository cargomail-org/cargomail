import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { HashtagNode } from '@lexical/hashtag'
import { ListItemNode, ListNode } from '@lexical/list'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { ImageNode } from './nodes/ImageNode'
import { EmojiNode } from './nodes/EmojiNode'
import { KeywordNode } from './nodes/KeywordNode'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import EmailTheme from './themes/EmailTheme'

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: any) {
  console.error(error)
}

const EditorConfig = {
  namespace: 'ComposeEditor',
  theme: EmailTheme,
  onError,
  nodes: [
    HeadingNode,
    HashtagNode,
    ListNode,
    ListItemNode,
    QuoteNode,
    CodeNode,
    CodeHighlightNode,
    KeywordNode,
    EmojiNode,
    ImageNode,
    HorizontalRuleNode,
    AutoLinkNode,
    LinkNode,
  ],
}

export default EditorConfig
