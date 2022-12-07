// Add bellow trusted domains, access tokens will automatically injected to be send to
// trusted domain can also be a path like https://www.myapi.com/users,
// then all subroute like https://www.myapi.com/useers/1 will be authorized to send access_token to.

// Domains used by OIDC server must be also declared here
// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
const trustedDomains = {
  default: ['http://localhost:9998', 'http://localhost:8180'],
}
