import { colors } from '@mui/material'
import Typography from '@mui/material/Typography'
import { useTranslation } from 'react-i18next'

import Cluster from './Cluster'
import Thread from './Thread'

const Preview = ({ clusters, actions = {} }: any) => {
  const { t } = useTranslation(['date'])
  return (
    <div>
      <Typography
        variant="subtitle1"
        sx={{
          paddingLeft: '40px',
          backgroundColor: colors.grey[100],
        }}>
        {t(clusters.label, { date: clusters.date })}
      </Typography>
      {clusters.threads.map((props: any) =>
        props.id ? (
          <Thread key={props.id} {...props} actions={actions} />
        ) : (
          <Cluster key={props.primaryLabel.id} {...props} actions={actions} />
        )
      )}
    </div>
  )
}

export default Preview
