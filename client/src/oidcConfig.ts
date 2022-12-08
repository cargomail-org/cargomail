// This configuration use the ServiceWorker mode only
// "access_token" will be provided automaticaly to the urls and domains configured inside "OidcTrustedDomains.js"
export const oidcConfig = {
  client_id: process.env.REACT_APP_OIDC_CLIENT_ID || '',
  redirect_uri: window.location.origin + process.env.REACT_APP_OIDC_REDIRECT_URI,
  scope: process.env.REACT_APP_OIDC_SCOPE || '',
  authority: process.env.REACT_APP_OIDC_AUTHORITY || '',
  service_worker_relative_url: '/OidcServiceWorker.js',
  service_worker_only: true,
}
