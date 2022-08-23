import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import reportWebVitals from './reportWebVitals'
import { ServiceProvider } from './ServiceProvider'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  // StrictMode renders components twice (on dev but not production) in order to detect any problems with your code and warn you about them
  <React.StrictMode>
    <ServiceProvider>
      <App />
    </ServiceProvider>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
