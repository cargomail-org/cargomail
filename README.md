# Email

Email is the most pervasive form of business information exchange. Email is often used not only as an interpersonal communication tool but also as the default choice to send files. Over time, your inbox becomes a personal knowledge repository of what was sent by whom and when. Such an email repository has one fundamental flaw. Due to the design principle of the email system, the email cannot contain large messages. Thus, users often send links to external files instead of attachments or inline images. Links may expire with time, and external files can change. Consequently, your knowledge repository deteriorates.

# Cargomail

Cargomail is built on top of the OAuth 2.0 industry-standard protocol and its extensions. It uses an advanced web editor, which allows users to link documents, images, and videos in the message body while keeping the respective resource data at the Cargo resource server. To ensure the integrity of email message and their resources, Cargomail relies on resource hashes. The newly designed [intermodal Message Transfer Agent (iMTA)](https://github.com/cargomail-org/imta) enables the transfer of email messages and resources in two modes — push and pull. The sender's iMTA sends an email to the recipient's iMTA, which checks for the presence of links to the message resources, and then pulls the respective resources via the sender's iMTA. This concept allows transferring of a massive amount of data without the risk of receiving spam.

# Internet Mail 2000 Legacy

This effort enhances the [Internet Mail 2000](https://en.wikipedia.org/wiki/Internet_Mail_2000) pull-based concept proposed by Daniel J. Bernstein and uses a specific [OAuth 2.0 constrained delegation mechanism](https://github.com/cargomail-org/identity-propagation-and-assertions), designed on the principle that the final storage of message resources—binary data (blobs) referenced by links in the message—should be the responsibility of the recipients, and not of the sender as it is with the SMTP push-based email architecture.

# Architecture

![Architecture](./images/cargomail_architecture.png)

<p class="figure">
Fig.&nbsp;1.&emsp;Cargomail Architecture
</p>

# Acknowledgments

As of December 2022, the following resources have been used to develop the Cargomail project:

- Gmail API [documentation](https://developers.google.com/gmail/api/reference/rest), licensed under the Creative Commons Attribution 4.0 License, has been used to design a gRPC interface between Cargomail Client and Cargo Mailbox.

- Zitadel [OpenID Connect SDK](https://github.com/zitadel/oidc), licensed under the Apache-2.0 License, has been adapted to meet the [Identity Propagation and Assertions](https://github.com/cargomail-org/identity-propagation-and-assertions) concept.

- Linbox, a Google Inbox-inspired [webmail client](https://github.com/yanglin5689446/linbox) licensed under the DO WHAT THE FUCK YOU WANT TO PUBLIC LICENSE, was cloned to speed up the Cargomail Client application development. The source code has been heavily customized to be aligned with the iMTA proof of concept.

- A set of [react components](https://github.com/AxaGuilDEv/react-oidc) that enables web application integration with OpenID Connect (OIDC) providers. A Service Worker is responsible for obtaining tokens from the OIDC server and making requests to the resource server. Components are licensed under MIT License.

- Lexical, Meta's [extensible text editor framework](https://github.com/facebook/lexical), licensed under MIT License.

- TUS, [Resumable File Uploads](https://github.com/tus), an open protocol for resumable file uploads.
