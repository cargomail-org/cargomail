import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { HashtagNode } from '@lexical/hashtag'
import { ListItemNode, ListNode } from '@lexical/list'
import { AutoLinkNode, LinkNode } from '@lexical/link'
import { CodeHighlightNode, CodeNode } from '@lexical/code'
import EmailTheme from './themes/EmailTheme'

// const ComposeTheme = {
//   ltr: 'ltr',
//   rtl: 'rtl',
//   placeholder: 'editor-placeholder',
//   paragraph: 'editor-paragraph',
//   quote: 'editor-quote',
//   heading: {
//     h1: 'editor-heading-h1',
//     h2: 'editor-heading-h2',
//     h3: 'editor-heading-h3',
//     h4: 'editor-heading-h4',
//     h5: 'editor-heading-h5',
//   },
//   list: {
//     nested: {
//       listitem: 'editor-nested-listitem',
//     },
//     ol: 'editor-list-ol',
//     ul: 'editor-list-ul',
//     listitem: 'editor-listitem',
//   },
//   image: 'editor-image',
//   link: 'editor-link',
//   text: {
//     bold: 'editor-text-bold',
//     italic: 'editor-text-italic',
//     overflowed: 'editor-text-overflowed',
//     hashtag: 'editor-text-hashtag',
//     underline: 'editor-text-underline',
//     strikethrough: 'editor-text-strikethrough',
//     underlineStrikethrough: 'editor-text-underlineStrikethrough',
//     code: 'editor-text-code',
//   },
//   code: 'editor-code',
//   codeHighlight: {
//     atrule: 'editor-tokenAttr',
//     attr: 'editor-tokenAttr',
//     boolean: 'editor-tokenProperty',
//     builtin: 'editor-tokenSelector',
//     cdata: 'editor-tokenComment',
//     char: 'editor-tokenSelector',
//     class: 'editor-tokenFunction',
//     'class-name': 'editor-tokenFunction',
//     comment: 'editor-tokenComment',
//     constant: 'editor-tokenProperty',
//     deleted: 'editor-tokenProperty',
//     doctype: 'editor-tokenComment',
//     entity: 'editor-tokenOperator',
//     function: 'editor-tokenFunction',
//     important: 'editor-tokenVariable',
//     inserted: 'editor-tokenSelector',
//     keyword: 'editor-tokenAttr',
//     namespace: 'editor-tokenVariable',
//     number: 'editor-tokenProperty',
//     operator: 'editor-tokenOperator',
//     prolog: 'editor-tokenComment',
//     property: 'editor-tokenProperty',
//     punctuation: 'editor-tokenPunctuation',
//     regex: 'editor-tokenVariable',
//     selector: 'editor-tokenSelector',
//     string: 'editor-tokenSelector',
//     symbol: 'editor-tokenProperty',
//     tag: 'editor-tokenProperty',
//     url: 'editor-tokenOperator',
//     variable: 'editor-tokenVariable',
//   },
// }

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
    AutoLinkNode,
    LinkNode,
  ],
}

export default EditorConfig
