import { FC, useCallback, useContext, useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  colors,
  debounce,
  Divider,
  IconButton,
  InputBase,
  useMediaQuery,
} from '@mui/material'
import DraftsIcon from '@mui/icons-material/Drafts'
import ClearIcon from '@mui/icons-material/Clear'
import { DraftsContext, IDraftEdit } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'
import { RecipientsSelect } from './Recipients'
import Editor from '../editor/Editor'

export type EditDraftProps = {
  draftEdit: IDraftEdit
}

const EditDraft: FC<EditDraftProps> = (props) => {
  const isMobileLandscape = useMediaQuery('(max-height: 520px)')

  const { closeDraftEdit } = useContext(DraftsContext)
  const { draftsUpdate, draftsSend, draftsDelete } = useFedemailAPI()

  const snippet_max_length = 240

  const [subject, setSubject] = useState(props.draftEdit.subject)

  const getSnippet = (str: string): string => {
    if (str.length > snippet_max_length) {
      return str.slice(0, snippet_max_length) + '...'
    }
    return str
  }

  const updateSubject = (draftEdit: IDraftEdit, subject: any) => {
    draftsUpdate({ ...draftEdit, subject })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSubjectSave = useCallback(
    debounce((draftEdit, subject) => updateSubject(draftEdit, subject), 1000),
    [] // will be created only once initially
  )

  const handleSubjectChange = (event: any) => {
    const value = event.target.value
    props.draftEdit.subject = value
    setSubject(value)
    debouncedSubjectSave(props.draftEdit, value)
  }

  const updateContent = (draftEdit: IDraftEdit, htmlBody: string, plainText: string) => {
    const snippet = getSnippet(plainText)
    draftsUpdate({ ...draftEdit, content: htmlBody, snippet })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedContentSave = useCallback(
    debounce((draftEdit, htmlBody, plainText) => updateContent(draftEdit, htmlBody, plainText), 1000),
    [] // will be created only once initially
  )

  const handleContentChange = (htmlBody: string, plainText: string) => {
    props.draftEdit.snippet = getSnippet(plainText)
    props.draftEdit.content = htmlBody
    debouncedContentSave(props.draftEdit, htmlBody, plainText)
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 0,
        zIndex: 9999,
        right: 0,
        marginRight: '8px',
        marginLeft: '8px',
        maxHeight: 'calc(100vh - 48px)',
      }}>
      {/* {(window as any).debug(id)}
      {(window as any).debug(sender)}
      {(window as any).debug(recipients)}
      {(window as any).debug(subject)}
      {(window as any).debug(content)} */}
      <Card
        sx={{
          width: 'calc(100vw - 15px)',
          maxWidth: '480px',
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          boxShadow: '0 8px 16px rgba(0,0,0,0.45)',
        }}>
        <CardHeader
          sx={{
            background: colors.grey[800],
            height: 10,
            '& .MuiCardHeader-action': { marginTop: '-11px' },
          }}
          avatar={<DraftsIcon sx={{ height: 18, width: 18, color: colors.grey[50] }} />}
          action={
            <Box component="span">
              <IconButton
                sx={{
                  padding: 0,
                  margin: '0 4px',
                  color: colors.grey[400],
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: colors.grey[50],
                  },
                }}>
                {/* <MinimizeIcon sx={{ height: 18, width: 18 }} /> */}
              </IconButton>
              <IconButton
                sx={{
                  padding: 0,
                  margin: '0 4px',
                  color: colors.grey[400],
                  transition: 'color 0.2s',
                  '&:hover': {
                    color: colors.grey[50],
                  },
                }}
                onClick={() =>
                  props.draftEdit.content && props.draftEdit.content !== '<p class="editor-paragraph"><br></p>'
                    ? closeDraftEdit(props.draftEdit.id)
                    : draftsDelete(props.draftEdit.id)
                }>
                <ClearIcon sx={{ height: 18, width: 18 }} />
              </IconButton>
            </Box>
          }
        />
        <CardContent
          sx={{ display: 'flex', flexDirection: 'column', height: '570px', padding: 0, '&:last-child': { pb: 1 } }}>
          <RecipientsSelect
            sx={{ maxHeight: 100, overflow: 'auto', paddingTop: 1 }}
            draftEdit={props.draftEdit}></RecipientsSelect>
          <Divider />
          <InputBase
            sx={{ width: '100%', padding: '4px 12px', fontWeight: 'bold' }}
            placeholder={'Subject'}
            inputProps={{
              'aria-label': 'Subject',
            }}
            value={subject}
            onChange={handleSubjectChange}
          />
          <Divider />
          <Box sx={{ flex: 1, minHeight: 0 }}>
            {!isMobileLandscape && <Editor initialValue={props.draftEdit.content} onChange={handleContentChange} />}
            {isMobileLandscape && <Editor initialValue={props.draftEdit.content} onChange={handleContentChange} />}
          </Box>
          <CardActions sx={{ flex: 0, padding: '8px 12px 4px' }} disableSpacing>
            <Button variant="contained" color="primary" onClick={() => draftsSend(props.draftEdit.id)}>
              {'Send'}
            </Button>
          </CardActions>
        </CardContent>
      </Card>
    </Box>
  )
}

export default EditDraft
