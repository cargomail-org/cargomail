# Email

Email is the most pervasive form of business information exchange. People use email as an interpersonal communication tool and as the default choice to send files. Over time, your inbox becomes a personal email feed of what was sent by whom and when. Such an email feed has one fundamental flaw. Due to the design principle of the email system, the email cannot contain large attachments. Therefore, users often send links to external files instead of email attachments. However, external files lose their authenticity by being removed from the correspondence context. Furthermore, links may expire with time or be blocked. As a result, your email feed deteriorates.

# Cargomail

Cargomail does not use email attachments or links to external files. Instead, it uses an advanced web editor that allows users to reference documents, images, and videos in the message body by their content via a cryptographic hash value while keeping the respective resources in a content-addressed resource mailbox. Cargomail exchanges referenced resources between resource mailboxes using the [GRIP](https://github.com/cargomail-org/grip) mechanism. The final download link is constructed in the email client using the resource mailbox URI and the cryptographic hash value of the referenced resource. The content of the email resource can be displayed directly in the message body.

# Features and Benefits

People can use Cargomail to store and exchange messages, documents, images, audio, and videos. Since Cargomail differs from the current email system, several decisive advantages are worth mentioning.

## Trustworthiness and Data Sovereignty

Your email feed will never break apart. Messages and their resources are kept together in chronological tamper-resistant records. A resource mailbox ensures the authenticity and integrity of email messages and their resources. The cryptographic hash value guarantees the storage of only a single instance of a resource.

## Security

Cargomail uses the [GRIP](https://github.com/cargomail-org/grip) mechanism to protect against spam. This mechanism does not protect against unsolicited emails — anyone can send you an email —  it protects you against a [DKIM replay attack](https://www.ietf.org/id/draft-chuang-dkim-replay-problem-01.html) that spammers use to bypass spam filters.

## Privacy

The [GRIP](https://github.com/cargomail-org/grip) mechanism decouples the resource mailbox from the user's email address. This separation allows a user with a single email address to use multiple mailboxes. You can keep official, business, and personal correspondence separate on designated servers by using a single email address.

## How it works

<div class="diagram">
    <img src=./images/cargomail_architecture.svg alt="Cargomail architecture">
</div>

<p class="figure">
Fig.&nbsp;1.&emsp;Cargomail architecture
</p>