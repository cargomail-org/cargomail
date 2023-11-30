## Introduction

Cargomail uses the Global Reference Identity Protocol (GRIP) for email authentication instead of the DomainKeys Identified Mail (DKIM) authentication method. GRIP employs [identity propagation and assertion apparatus](https://github.com/cargomail-org/grip) to convey identity information about the end user across different administrative authorities of the email services.

Furthermore, instead of using MX records to determine the communication route, Cargomail relies on DNS SRV records.

## Cargomail GRIP Acronyms

Cargomail GRIP uses special jargon. For the sake of brevity of this document, the following list of acronyms will be used:
<pre>
DNS     Domain Name System
CA      Certificate Authority
CN      Common Name
TLS     Transport Layer Security
mTLS    Mutual Transport Layer Security
OID     Object Identifier

RS      Resource Server
JWT     JSON Web Token
JWK     JSON Web Key
</pre>

## Cargomail Self-Issued Identity Propagation

The sequence diagram illustrated in Figure&nbsp;1 shows the self-issued identity propagation flow without an authorization server and end-user involvement. The client requests access to resources stored on the RS on behalf of the impersonated user using a self-issued token.

The sequence diagram is self-explanatory.

<div class="diagram">
    <img src=./self-issued_identity_propagation_flow.svg alt="Sequence Diagram">
</div>

<p class="figure">
Fig.&nbsp;1.&emsp;Self-Issued Identity Propagation flow
</p>