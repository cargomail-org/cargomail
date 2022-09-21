import { Typography } from '@mui/material'
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
          title: {
            paddingLeft: 24,
            margin: 5,
          },
        }}>
        {t(clusters.label, { date: clusters.date })}
      </Typography>
      {clusters.threads.map((props: any) =>
        props.id ? (
          // console.log('Cluster:', props)
          <Thread key={props.id} {...props} actions={actions} />
        ) : (
          // <div key={props.id}>Thread</div>
          // console.log('Cluster:', props)
          <Cluster key={props.primaryLabel.id} {...props} actions={actions} />
          // <div key={props.primaryLabel.id}>Cluster</div>
        )
      )}
    </div>
  )
}

export default Preview
