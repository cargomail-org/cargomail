## Notice

Please do not use the code from this repo, as it is unlikely to function properly.

## Introduction

Despite the importance of email infrastructure, the whole ecosystem still relies on more than 40-year-old push-based architecture and protocol design.
While conceptually sound as a communication means, the email system is structurally obsolete and functionally deficient.

Cargomail uses push-pull data transfer architecture.
The main benefit of using this architecture is the ability to send and receive a large number of email attachments of any size.

## White Paper

This project is constantly evolving. You can download the latest revision (draft) of the whitepaper here: [Cargomail.pdf](https://github.com/cargomail-org/cargomail/raw/main/whitepaper/Cargomail.pdf).

## Architecture

![Alt Cargomail architecture](whitepaper/cargomail_architecture.png)

![#b4c7dc](https://placehold.co/8x8/b4c7dc/b4c7dc.png) Push System
![#f7d1d5](https://placehold.co/8x8/f7d1d5/f7d1d5.png) Pull System

This architecture separates the mailbox from the email address and uses a push-pull mechanism to enable data exchange between resource mailboxes.

#### *Key Points*

• Each email consists of an envelope, a <i>placeholder message</i> created in the <i>resource mailbox</i>, and related external bodies stored in the same <i>resource mailbox</i>.

• The resources owned by the sender, stored in the origin <i>resource mailbox</i>, are temporarily shared with recipients. Following a successful sharing process, a <i>placeholder message</i> is sent to each recipient through the push system. The <i>placeholder message</i> contains the origin <i>resource mailbox</i> URL, the cryptographic hash values of the referenced resources (Content-IDs), and the category of correspondence, e.g., personal, business, or healthcare (see Appendix A for a <i>placeholder message</i> example).


• After receiving the <i>placeholder message</i>, the recipient's <i>resource broker</i> determines (according to the user's preferences and the category of correspondence) which destination <i>resource mailbox</i> will be used for communication. Once the destination <i>resource mailbox</i> is determined, the <i>resource broker</i> adds the header with the <i>destination resource</i> mailbox URL to the <i>placeholder message</i> and posts it to the relevant destination <i>resource mailbox</i> using the GRIP authentication mechanism.


• The <i>resource transfer agent</i> at the destination server gets the origin <i>resource mailbox</i> URL and the cryptographic hash values of the referenced resources in the <i>placeholder message</i>. Using the GRIP authentication mechanism, the agent tries to retrieve the external resources from the origin <i>resource mailbox</i>. After successful authentication, the data is retrieved and stored in the destination <i>resource mailbox</i>. Finally, the <i>email application</i> downloads the relevant data from the destination <i>resource mailbox</i> and reconstructs the original message according to the <i>placeholder message</i> template.

## Placeholder Message

Here is a placeholder message in JSON format with external bodies accessible via content-addressed URIs.
```yaml
{
  "headers": {
    "X-Origin-Resource-Mailbox-URL": "mailbox.foo.com",
    "X-Destination-Resource-Mailbox-URL": "mailbox.bar.com",
    "From": "Alice Sanders <alice@foo.com>",
    "Subject": "Meeting",
    "To": "Bob Sanders <bob@bar.com>",
    "Cc": "Carol <carol@bar.com>, Daniel <dan@bar.com>",
    "Date": "Tue Sep 19 20:52:05 CEST 2023",
    "Message-ID": "<b07d0cdf-c6f4-4f67-b24c-cc847a4c2df4@foo.com>",
    "X-Thread-ID": "<68fb9177-6853-466a-8f7d-c96fbb885f81@foo.com>",
    "X-Correspondence-Category": "primary",
    "Content-Type": "multipart/mixed"},
  "parts": [
    {
      "headers": {
        "Content-Type": "multipart/alternative"
      },
      "parts": [
        {
          "headers": {
            "Content-Disposition": "inline",
            "Content-ID": "<aSQnmlBT6RndpDnwTSStJUVhlh9XL9_y2QXX42NhKuI>",
            "Content-Type": [
              "message/external-body; access-type=\"x-content-addressed-uri\"; hash-algorithm=\"sha256\"; size=\"42\"",
              "text/plain; charset=UTF-8"
            ]
          }
        },
        {
          "headers": {
            "Content-Disposition": "inline",
            "Content-ID": "<Y_ION3g8WQuqGzhsDlVrhAgQ0D7AbXu9T-HSv3w--zY>",
            "Content-Type": [
              "message/external-body; access-type=\"x-content-addressed-uri\"; hash-algorithm=\"sha256\"; size=\"109\"",
              "text/html; charset=UTF-8"
            ]
          }
        }
      ]
    },
    {
      "headers": {
        "Content-Type": "multipart/mixed"
      },
      "parts": [
        {
          "headers": {
            "Content-Disposition": "attachment; filename=\"cargomail_architecture.svg\"",
            "Content-ID": "<1pzyqfFWbfhJ3hrydjL9jO9Qgeg70TgZQ_zpOkt4HOU>",
            "Content-Type": [
              "message/external-body; access-type=\"x-content-addressed-uri\"; hash-algorithm=\"sha256\"; size=\"52247\"",
              "image/svg+xml"
            ]
          }
        },
        {
          "headers": {
            "Content-Disposition": "attachment; filename=\"Cargomail.pdf\"",
            "Content-ID": "<6G6Mkapa3-Om7B6BVhPUBEsCLP6t6LAVP4bHxhQF5nc>",
            "Content-Type": [
              "message/external-body; access-type=\"x-content-addressed-uri\"; hash-algorithm=\"sha256\"; size=\"153403\"",
              "application/pdf"
            ]
          }
        }
      ]
    }
  ]
}
```
