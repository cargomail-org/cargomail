# Email

Email is the most pervasive form of business information exchange. Email is often used not only as an interpersonal communication tool but also as the default choice to send files. Over time, your inbox becomes a personal knowledge repository of what was sent by whom and when. Such an email repository has one fundamental flaw. Due to the design principle of the email system, the email cannot contain large messages. Thus, users often send links to external files instead of attachments or inline images. Links may expire with time, and external files can change. Consequently, your knowledge repository deteriorates.

# Cargomail

Cargomail is built on top of the OAuth 2.0 industry-standard protocol and its extensions. It uses an advanced web editor, which allows users to link documents, images, and videos in the message body while keeping the respective resource data at the Cargo resource server. To ensure the integrity of email message and their resources, Cargomail relies on resource hashes. The newly designed [Message Transfer Agent (MTA)](https://github.com/cargomail-org/mta) together with the [Resource Retrieval System (RRS)](https://github.com/cargomail-org/rrs) enables the transfer of email messages and resources in two modes — push and pull. The sender's MTA sends an email to the recipient's MTA, which checks for the presence of links to the message resources, and then the Resource Retrieval Agent (RRA) pulls the respective resources from the sender's Resource Server (RS). This concept allows transferring of a massive amount of data without the risk of receiving spam.

# Architecture

![Architecture](./images/cargomail_architecture.png)

<p class="figure">
Fig.&nbsp;1.&emsp;Cargomail Architecture
</p>

