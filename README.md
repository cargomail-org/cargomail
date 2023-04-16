# Email

Email is the most pervasive form of business information exchange. People use email as an interpersonal communication tool and as the default choice to send files. Over time, your inbox becomes a personal email feed of what was sent by whom and when. Such an email feed has one fundamental flaw. Due to the design principle of the email system, the email cannot contain large attachments. Therefore, users often send links to external files instead of email attachments. However, external files lose their authenticity by being removed from the correspondence context. Furthermore, links may expire with time or be blocked. As a result, your email feed deteriorates.

# Cargomail

Cargomail does not use email attachments or links to external files. Instead, it uses an advanced web editor that allows users to reference documents, images, and videos in the message body by their content via a cryptographic hash value while keeping the respective resources in a content-addressed resource mailbox. Cargomail exchanges referenced resources between resource mailboxes using the [GRIP](https://github.com/cargomail-org/grip) mechanism. The final download link is constructed in the email client using the resource mailbox URI and the cryptographic hash value of the referenced resource. The email application renders the content of the email resource directly into the message body.

# Features and Benefits

People can use Cargomail to store and exchange messages, documents, images, audio, and videos. Since Cargomail differs from the current email system, several decisive advantages are worth mentioning.

## Trustworthiness and Data Sovereignty

Your email feed will never break apart. Messages and their resources are kept together in chronological tamper-resistant records. A resource mailbox ensures the authenticity and integrity of email messages and their resources. The cryptographic hash value guarantees the storage of only a single instance of a resource.

## Security

Cargomail may use the [GRIP](https://github.com/cargomail-org/grip) mechanism to protect against spam. This mechanism does not protect against unsolicited emails — anyone can send you an email —  it protects you against a [DKIM replay attack](https://www.ietf.org/id/draft-chuang-dkim-replay-problem-01.html) that spammers use to bypass spam filters.

## Privacy

The [GRIP](https://github.com/cargomail-org/grip) mechanism decouples the resource mailbox from the user's email address. This separation allows a user with a single email address to use multiple mailboxes. You can keep official, business, and personal correspondence separate on designated servers by using a single email address.

## How It Works

Cargomail introduces a new type of mailbox—a resource mailbox—compatible with the existing email ecosystem. While the actual correspondence takes place between the resource mailboxes, the default user mailbox of the email system is used only for notification emails, as shown in Figure 1.

<div class="diagram">
    <img src=./images/cargomail_architecture.png alt="Cargomail architecture">
</div>

<p class="figure">
Fig.&nbsp;1.&emsp;Cargomail architecture
</p>

#### *Key Points*

<!-- https://tex.stackexchange.com/questions/41681/correct-way-to-bold-italicize-text >
<!-- https://editor.codecogs.com/ >
<!-- \textbf{\raisebox{.5pt}{\textcircled{\raisebox{-.9pt}{\small{1}}}} -->


* Each email consists of resources (message and referenced files) stored in the resource mailbox—on the email-specific resource server.
* ![](images/1.svg) The email resources owned by the sender, stored in a sender's resource mailbox, are temporarily shared with the recipient.
* ![](images/2.svg), ![](images/3.svg), ![](images/4.svg) Following a successful sharing process, a notification email is sent to the recipient's email application through the standard email system. The notification email contains the sender's resource mailbox URI, the cryptographic hash values of the referenced resources, and the category of correspondence, e.g., personal, business, or healthcare, as illustrated in Figure 2. 
* ![](images/5.svg) TBD
* ![](images/6.svg) TBD
* ![](images/7.svg) TBD

<div class="diagram">
    <img src=./images/notification-message.png alt="Notification message">
</div>

<p class="figure">
Fig.&nbsp;2.&emsp;Notification message
</p>

