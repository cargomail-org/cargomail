# Email

Email is the most pervasive form of business information exchange. People use email as an interpersonal communication tool and as the default choice to send files. Over time, your inbox becomes a personal email feed of what was sent by whom and when. Such a feed has one fundamental flaw. Due to the design principle of the email system, the email cannot contain large attachments. Thus, users often send links to external files instead of attachments or inline images. Links may expire with time, or external files may change. Consequently, your email feed gradually deteriorates.

# Cargomail

Cargomail does not use attachments or links to external files. Instead, it uses an advanced web editor that allows users to reference documents, images, and videos in the message body by their content via a cryptographic hash value while keeping the respective resources in a content-addressable mailbox. Cargomail exchanges referenced resources between content-addressable mailboxes along with the corresponding email message. The final download link is constructed in the email client using the content-addressable mailbox location and the cryptographic hash value of the referenced resource.

# Advantages

Being different from the current email system, Cargomail has several decisive advantages.

## Timeline Consistency

Your email feed will never break apart. Messages and their resources are kept together in chronological tamper-resistant records.

## Security

Cargomail uses the [GRIP](https://github.com/cargomail-org/grip) mechanism to protect against spam. This mechanism does not protect against unsolicited emails — anyone can send you an email — it protects you from mass spam bots that send lots of emails.

## Privacy

The [GRIP](https://github.com/cargomail-org/grip) mechanism decouples the content-addressable mailbox from the user's email address. This separation allows a user with a single email address to use multiple mailboxes. You can keep official, business, and personal correspondence separately in designated mailboxes using a single email address.
