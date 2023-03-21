# Acknowledgments

As of December 2022, the following resources have been used to develop the Cargomail project:

- Gmail API [documentation](https://developers.google.com/gmail/api/reference/rest), licensed under the Creative Commons Attribution 4.0 License, has been used to design a gRPC interface between Cargomail Client and Cargo Mailbox.

- Zitadel [OpenID Connect SDK](https://github.com/zitadel/oidc), licensed under the Apache-2.0 License, has been adapted to meet the [Global Reference Identity Protocol (GRIP)](https://github.com/cargomail-org/grip) concept.

- Linbox, a Google Inbox-inspired [webmail client](https://github.com/yanglin5689446/linbox) licensed under the DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE, was cloned to speed up the Cargomail Client application development. The source code has been heavily customized to be aligned with the MTA proof of concept.

- A set of [react components](https://github.com/AxaGuilDEv/react-oidc) that enables web application integration with OpenID Connect (OIDC) providers. A Service Worker is responsible for obtaining tokens from the OIDC server and making requests to the resource server. Components are licensed under MIT License.

- Lexical, Meta's [extensible text editor framework](https://github.com/facebook/lexical), licensed under MIT License.

- TUS, [Resumable File Uploads](https://github.com/tus), an open protocol for resumable file uploads.