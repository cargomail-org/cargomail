# Cargomail

## Introduction

Despite the importance of the email infrastructure, the entire ecosystem still relies on a push-based architecture and protocol design that is more than 40 years old. While conceptually sound as a means of communication, the Internet Mail system is structurally outdated and functionally deficient.

Cargomail introduces a [revised Internet Mail architecture](#revised-internet-mail-architecture) that includes a new Resource Handling Service (RHS) alongside the existing Message Handling Service (MHS). The RHS performs data exchange between resource servers. These servers store email message resources such as message bodies and attachments. Such an architecture offers several benefits, including advanced anti-spam protection that uses a challenge-response mechanism to ensure that only legitimate messages are delivered to the recipient. The challenge-response mechanism requires a certain amount of computational effort on the sender's side to make bulk spamming costly. This means that while anyone can send you an email, those who want to spread spam en masse will find it difficult and time-consuming to do so. Additionally, this architecture allows for the exchange of large volumes of documents, images, videos, and audio files of unlimited size, making it a versatile and efficient way to handle email communication.

<!--
## White Paper

This project is constantly evolving. You can download the latest revision of the whitepaper here: [Cargomail.pdf](https://github.com/cargomail-org/cargomail/raw/main/whitepaper/Cargomail.pdf).
-->

## Revised Internet Mail Architecture

This section proposes a revised version of the [Internet Mail Architecture, IETF RFC 5598](https://www.rfc-editor.org/rfc/rfc5598.html). The revised architecture separates the mailbox from the email address and uses a mechanism of push-and-pull requests over different routes to enable direct data exchange between resource servers. This mechanism has the potential to address spam and attachment issues more effectively than the current push-only email system. An additional pull layer facilitates the efficient transfer of data of any size.

![Revised Internet Mail Architecture](whitepaper/revised_internet_mail_architecture.svg)

#### *Key Points*

• Each email consists of a <i>placeholder message</i> and associated external resources (message bodies) stored on the Resource Server (RS) in the respective <i>mailbox</i>, where the <i>placeholder message</i> also acts as an access control list for its external body resources.

• The body resources owned by the author, stored on the RS in the origin <i>mailbox service</i>, are temporarily shared with recipients. Following a successful sharing process, a <i>placeholder message</i> is sent to each recipient through the MHS. The <i>placeholder message</i> contains the origin <i>mailbox service</i> URL, the cryptographic hash values of the referenced body resources (Content-IDs), and the category of correspondence, e.g., personal, business, or healthcare (see Appendix A for a <i>placeholder message</i> example).
<!--
• After receiving the <i>placeholder message</i>, the recipient's Message Delivery Agent (MDA) determines (according to the user's preferences and the category of correspondence) which destination <i>mailbox</i> will be used for communication. Once the destination <i>mailbox</i> is determined, the MDA adds the header with the destination <i>mailbox</i> URL to the <i>placeholder message</i> and delivers it to the resolved destination <i>mailbox</i> using the [GRIP](https://github.com/cargomail-org/grip) authentication mechanism.

• The Resource Fetch Agent (RFA) at the destination server gets the origin <i>mailbox</i> URL and the cryptographic hash values of the referenced body resources in the <i>placeholder message</i>. Using the GRIP authentication mechanism, the agent tries to fetch the external body resources from the aRS in the origin <i>mailbox</i>. After successful authentication, the data is fetched and stored on the rRS in the destination <i>mailbox</i>. Finally, the <i>email application</i> gets the relevant data from the rRS in the destination <i>mailbox</i> and reconstructs the original message according to the <i>placeholder message</i> template.
-->

## Appendix A—Placeholder Message

Here is a placeholder message in JSON format with external bodies accessible via content-addressed URIs.

```yaml
{
  "headers":
    {
      "X-Origin-Resource-Mailbox-URL": "https://foo.com/mbx",
      "X-Destination-Resource-Mailbox-URL": "https://bar.com/mbx",
      "From": "Alice Sanders <alice@foo.com>",
      "Subject": "Meeting",
      "To": "Bob Sanders <bob@bar.com>",
      "Cc": "Carol <carol@bar.com>, Daniel <dan@bar.com>",
      "Date": "Tue Sep 19 20:52:05 CEST 2023",
      "Message-ID": "<b07d0cdf-c6f4-4f67-b24c-cc847a4c2df4@foo.com>",
      "X-Thread-ID": "<68fb9177-6853-466a-8f7d-c96fbb885f81@foo.com>",
      "X-Correspondence-Category": "primary",
      "Content-Type": "multipart/mixed",
    },
  "parts":
    [
      {
        "headers": { "Content-Type": "multipart/alternative" },
        "parts":
          [
            {
              "headers":
                {
                  "Content-Disposition": "inline",
                  "Content-ID": "<aSQnmlBT6RndpDnwTSStJUVhlh9XL9_y2QXX42NhKuI>",
                  "Content-Type":
                    [
                      'message/external-body; access-type="x-content-addressed-uri"; hash-algorithm="sha256"; size="42"',
                      "text/plain; charset=UTF-8",
                    ],
                },
            },
            {
              "headers":
                {
                  "Content-Disposition": "inline",
                  "Content-ID": "<Y_ION3g8WQuqGzhsDlVrhAgQ0D7AbXu9T-HSv3w--zY>",
                  "Content-Type":
                    [
                      'message/external-body; access-type="x-content-addressed-uri"; hash-algorithm="sha256"; size="109"',
                      "text/html; charset=UTF-8",
                    ],
                },
            },
          ],
      },
      {
        "headers": { "Content-Type": "multipart/mixed" },
        "parts":
          [
            {
              "headers":
                {
                  "Content-Disposition": 'attachment; filename="cargomail_architecture.svg"',
                  "Content-ID": "<1pzyqfFWbfhJ3hrydjL9jO9Qgeg70TgZQ_zpOkt4HOU>",
                  "Content-Type":
                    [
                      'message/external-body; access-type="x-content-addressed-uri"; hash-algorithm="sha256"; size="52247"',
                      "image/svg+xml",
                    ],
                },
            },
            {
              "headers":
                {
                  "Content-Disposition": 'attachment; filename="Cargomail.pdf"',
                  "Content-ID": "<6G6Mkapa3-Om7B6BVhPUBEsCLP6t6LAVP4bHxhQF5nc>",
                  "Content-Type":
                    [
                      'message/external-body; access-type="x-content-addressed-uri"; hash-algorithm="sha256"; size="153403"',
                      "application/pdf",
                    ],
                },
            },
          ],
      },
    ],
}
```
