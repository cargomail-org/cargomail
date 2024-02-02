## Introduction

Cargomail uses the Global Reference Identity Protocol (GRIP) for email authentication instead of the DomainKeys Identified Mail (DKIM) authentication method. GRIP employs [identity propagation and assertion apparatus](https://github.com/cargomail-org/grip) to convey identity information about the end user across different administrative authorities of the email services.

Furthermore, instead of using MX records to determine the communication route, Cargomail relies on DNS SRV records.

#### GRIP Acronyms

Cargomail GRIP uses special jargon. For the sake of brevity of this document, the following list of acronyms will be used:
<pre>
MHS     Message Handling Service
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

## Identity Propagation

The sequence diagram illustrated in Figure&nbsp;1 shows the identity propagation flow without end-user involvement. The client requests access to the server on behalf of the impersonated user using a self-issued security token.

The sequence diagram is self-explanatory.

<div>
    <img src=./self-issued_identity_propagation_flow.svg alt="Sequence Diagram">
</div>

<p class="figure">
    Fig.&nbsp;1.&emsp;Identity Propagation Flow
</p>

## Data Provenance

TBD

<div>
    <img src=./data_provenance.svg alt="Chain of Transactions" width="500">
</div>

<p class="figure">
Fig.&nbsp;2.&emsp;Chain of Transactions
</p>