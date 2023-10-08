## Notice

Please do not use the code from this repo, as it is unlikely to function properly.

## Introduction

Despite the importance of email infrastructure, the whole ecosystem still relies on more than 40-year-old architecture and protocol design.
While conceptually sound as a communication means, the email system is structurally obsolete and functionally deficient.

The revised architecture of Cargomail eliminates the hassle of using the existing email infrastructure. The main benefit of using this architecture is the ability to send and receive a large number of email attachments of any size.

## White Paper

This project is constantly evolving. You can download the latest revision (draft) of the whitepaper here: [Cargomail.pdf](https://github.com/cargomail-org/cargomail/raw/main/whitepaper/Cargomail.pdf).

## Architecture

![Alt Cargomail architecture](whitepaper/cargomail_architecture.png)

![#b4c7dc](https://placehold.co/8x8/b4c7dc/b4c7dc.png) Email System
![#f7d1d5](https://placehold.co/8x8/f7d1d5/f7d1d5.png) Mailbox System

This architecture separates the mailbox from the email address and uses a push-pull mechanism to enable data exchange between mailboxes.

## Placeholder email message

Here is a placeholder email message in JSON format with external bodies accessible via content-addressed URIs.
```yaml
{
  "headers": {
    "X-Origin-Resource-Mailbox-URL": "mailbox.cargomail.org",
    "X-Destination-Resource-Mailbox-URL": "mailbox.cargomail.org",
    "From": "Alice Sanders <alice@cargomail.org>",
    "Subject": "Meeting",
    "To": "Bob Sanders <bob@cargomail.org>",
    "Cc": "Carol <carol@cargomail.org>, Daniel <dan@cargomail.org>",
    "Date": "Tue Sep 19 20:52:05 CEST 2023",
    "Message-ID": "<b07d0cdf-c6f4-4f67-b24c-cc847a4c2df4@cargomail.org>",
    "X-Thread-ID": "<68fb9177-6853-466a-8f7d-c96fbb885f81@cargomail.org>",
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
