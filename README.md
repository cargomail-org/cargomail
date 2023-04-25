# Introduction

Cargomail is a privacy-aware email system designed with the precept that the storage of email messages should be the responsibility of the sender and respective recipients and not of the email providers, as it is with the current email architecture.

You can download the [whitepaper](https://github.com/cargomail-org/cargomail/raw/main/whitepaper/Cargomail.pdf) if anyone is interested.

# Email

Email is the most pervasive form of business information exchange. People use email as an interpersonal communication tool and as the default choice to send files. Over time, your inbox becomes a personal email feed of what was sent by whom and when. Such an email feed has one fundamental flaw. Due to the design principle of the email system, the email cannot contain large attachments. Therefore, users often send links to external files instead of email attachments. However, external files lose their authenticity by being removed from the correspondence context. Furthermore, links may expire with time or be blocked. As a result, your email feed deteriorates.

# Cargomail

Cargomail does not use email attachments or links to external files. Instead, it uses an advanced web editor that allows users to reference documents, images, and videos in the message body by their content via a cryptographic hash value while keeping the respective resources in a content-addressed resource mailbox. Cargomail exchanges referenced resources between resource mailboxes using the [GRIP](https://github.com/cargomail-org/grip) mechanism. The final download link is constructed in the email client using the resource mailbox URI and the cryptographic hash value of the referenced resource. The email application renders the content of the email resource directly into the message body.

# Features and Benefits

People can use Cargomail to store and exchange messages, documents, images, audio, and videos. Since Cargomail differs from the current email system, several decisive advantages are worth mentioning.

## Trustworthiness and Data Sovereignty

Your email feed will never break apart. Messages and their resources are kept together in chronological tamper-resistant records. A resource mailbox ensures the authenticity and integrity of email messages and their resources. The cryptographic hash value guarantees the storage of only a single instance of a resource.

## Security

Cargomail may use the [GRIP](https://github.com/cargomail-org/grip) mechanism to protect against spam. This mechanism does not protect against unsolicited emails — anyone can send you an email — it protects you against a [DKIM replay attack](https://www.ietf.org/id/draft-chuang-dkim-replay-problem-01.html) that spammers use to bypass spam filters. This protection only applies if the GRIP authentication mechanism is used in addition to DKIM during SMTP data transfer.

## Privacy

The [GRIP](https://github.com/cargomail-org/grip) mechanism decouples the resource mailbox from the user's email address. This separation allows a user with a single email address to use multiple mailboxes. You can keep official, business, and personal correspondence separate on designated servers by using a single email address. Information you send or receive—buying a car, applying for a loan, taking out insurance, purchasing a T-shirt for your dad, requesting a government grant, getting turned down for credit, seeing a doctor—never reaches an email service provider.

## How It Works

Cargomail introduces a new type of mailbox—a resource mailbox—compatible with the existing email ecosystem. While the actual correspondence takes place between the resource mailboxes, the default user mailbox of the email system is used only for notification emails, as shown in Figure 1.

<div class="diagram">
    <img src=./images/cargomail_architecture.png alt="Cargomail architecture">
</div>

<p class="figure">
Fig.&nbsp;1.&emsp;Cargomail architecture
</p>

#### _Key Points_

<!-- https://tex.stackexchange.com/questions/41681/correct-way-to-bold-italicize-text >
<!-- https://editor.codecogs.com/ >
<!-- \textbf{\raisebox{.5pt}{\textcircled{\raisebox{-.9pt}{\small{1}}}} -->

- Each email consists of resources (message and referenced files) stored in the resource mailbox—on the email-specific resource server.
- ![](images/1.svg) The email resources owned by the sender, stored in an origin resource mailbox, are temporarily shared with recipients.
- ![](images/2.svg), ![](images/3.svg), ![](images/4.svg) Following a successful sharing process, a notification email is sent to each recipient through the standard email system. The notification email contains the origin resource mailbox URI in the `X-Origin-Resource-Mailbox-URI` header, the cryptographic hash values of the referenced resources in the `Content-ID` headers, and the category of correspondence, e.g., personal, business, or healthcare in the `X-Correspondence-Category` header, as illustrated in Figure 2.
- ![](images/5.svg) After receiving the notification email, the recipient's email application determines (according to the user's preferences and the category of correspondence) which destination resource mailbox will be used for communication. Following the destination resource mailbox determination, the email application adds the `X-Destination-Resource-Mailbox-URI` header to the notification email and posts the updated notification email to the relevant destination resource server.
- ![](images/6.svg) The resource retrieval agent at the destination resource server gets the origin resource mailbox URI and the cryptographic hash values of the referenced resources in the notification email. Using the GRIP mechanism, the agent tries to retrieve the email resources from the origin resource mailbox. After successful authentication, the data is retrieved and stored in the destination resource mailbox.
- ![](images/7.svg) Finally, the email application can access the retrieved data stored in the destination resource mailbox.

<div class="diagram">
    <img src=./images/notification-message.png alt="Notification message">
</div>

<p class="figure">
Fig.&nbsp;2.&emsp;Notification message
</p>

## Screencast



https://user-images.githubusercontent.com/13551645/234233539-03e1b8a1-670a-44ce-a716-5d0192410300.mp4



## Implementation Concerns

This section deals with the issues of implementing the Cargomail data exchange mechanism into the existing email infrastructure.

#### *A. MIME External-Body Subtype*

Cargomail uses the MIME `message/external-body` subtype in the push notification to indicate that the actual body data are not included but merely referenced. Although this is a standardized method of referencing external data, not every email provider handles it correctly.

#### *B. Decentralized Notification System from Scratch*

As an alternative to email-based notifications, a new decentralized notification system built around the GRIP authentication mechanism can be considered.

## Discussion

Although this proposal seems closely related to the [Internet Mail 2000](https://en.wikipedia.org/wiki/Internet_Mail_2000) concept proposed by Daniel J. Bernstein, Cargomail is designed on a different principle—that the storage of message and its resources should be the responsibility of the sender and recipients and not of the email providers, as it is with the current email architecture.
