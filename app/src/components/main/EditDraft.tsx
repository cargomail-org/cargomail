import { useContext } from 'react'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  colors,
  Divider,
  IconButton,
  InputBase,
  MenuItem,
  Select,
  Typography,
} from '@mui/material'
import DraftsIcon from '@mui/icons-material/Drafts'
import ClearIcon from '@mui/icons-material/Clear'
import MinimizeIcon from '@mui/icons-material/Minimize'
// import classNames from 'classnames'

import { ContactsContext } from '../../context/ContactsContext'
import { DraftsContext } from '../../context/DraftsContext'
import useFedemailAPI from '../../api/FedemailAPI'

const styles = () => ({
  root: {
    position: 'absolute',
    bottom: 0,
    zIndex: 9999,
    right: 0,
    marginRight: '8px',
    marginLeft: '8px',
    maxHeight: 'calc(100vh - 80px)',
  },
  card: {
    width: '480px',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    boxShadow: '0 8px 16px rgba(0,0,0,0.45)',
  },
  header: {
    background: colors.grey[800],
    height: 40,
  },
  icon: {
    height: 18,
    width: 18,
  },
  logoIcon: {
    color: colors.grey[50],
  },
  iconButton: {
    padding: 0,
    margin: '0 4px',
    color: colors.grey[400],
    transition: 'color 0.2s',
    '&:hover': {
      color: colors.grey[50],
    },
  },
  content: {
    padding: 0,
  },
  input: {
    padding: '4px 12px',
    display: 'block',
  },
  subject: {
    padding: '12px 12px',
    fontWeight: 'bold',
  },
})

const EditDraft = ({ classes, sender, id, subject, receipients, content }: any) => {
  // const { closeDraftEdit } = useContext(DraftsContext)
  const { contacts } = useContext(ContactsContext)
  const { updateDraft, sendDraft, deleteDraft } = useFedemailAPI()
  const draft = {
    id,
    receipients,
    sender,
    subject,
    content,
  }
  const update = (field: string) => (e: { target: { value: any } }) =>
    updateDraft({ ...draft, [field]: e.target.value })
  return (
    <div className={classes.root}>
      <Card className={classes.card}>
        <CardHeader
          className={classes.header}
          //   avatar={<DraftsIcon className={classNames(classes.icon, classes.logoIcon)} />}
          action={
            <span>
              <IconButton className={classes.iconButton}>
                <MinimizeIcon className={classes.icon} />
              </IconButton>
              {/* <IconButton
                className={classes.iconButton}
                onClick={() => (content ? closeDraftEdit(id) : deleteDraft(id))}>
                <ClearIcon className={classes.icon} />
              </IconButton> */}
            </span>
          }
        />
        <CardContent className={classes.content}>
          <Select
            multiple
            autoWidth
            value={receipients.slice().split(',')}
            onChange={(e) =>
              updateDraft({
                ...draft,
                receipients: `${receipients},${e.target.value}`,
              })
            }
            input={
              <InputBase
                placeholder="Receipient"
                className={classes.input}
                inputProps={{
                  'aria-label': 'Receipient',
                }}
              />
            }>
            {Object.values(contacts).map((contact) => (
              <MenuItem key={contact.id} value={contact.emailAddresses[0].value}>
                {contact.emailAddresses[0].value}
              </MenuItem>
            ))}
          </Select>

          <Divider />
          <div className={classes.input}>
            <Typography variant="caption">{'Sender'}: </Typography>
            <InputBase
              placeholder={'Sender'}
              inputProps={{
                'aria-label': 'Sender',
              }}
              value={sender}
              onChange={update('sender')}
            />
          </div>
          <Divider />
          <InputBase
            placeholder={'Subject'}
            className={classes.subject}
            inputProps={{
              'aria-label': 'Subject',
            }}
            value={subject}
            onChange={update('subject')}
          />
          <br />
          <InputBase
            placeholder={'Content'}
            className={classes.input}
            multiline
            rows={10}
            inputProps={{
              'aria-label': 'Content',
            }}
            value={content}
            onChange={update('content')}
          />
        </CardContent>
        <CardActions disableSpacing>
          <Button variant="contained" color="primary" onClick={() => sendDraft(id)}>
            {'Send'}
          </Button>
        </CardActions>
      </Card>
    </div>
  )
}

export default EditDraft
