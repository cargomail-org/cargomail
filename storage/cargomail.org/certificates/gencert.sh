########################## Self-Signed ##########################
# ------------------------ cargomail.org Resource Handling Service (RHS) Dev Server --------------------------
# rhs-server.key
openssl genrsa -out rhs-server.key 2048
# rhs-server.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key rhs-server.key -out rhs-server.crt -subj /O="Cargomail Provider"/CN="rhs-dev-server.cargomail.org" -addext "subjectAltName=IP:127.0.0.1" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-server._rhs._grip.bar.com"

# ------------------------ cargomail.org Resource Handling Service (RHS) Dev Client --------------------------
# rhs-client.key
openssl genrsa -out rhs-client.key 2048
# rhs-client.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key rhs-client.key -out rhs-client.crt -subj /O="Cargomail Provider"/CN="cargomail.org" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-client._rhs._grip.foo.com"

# ------------------------ cargomail.org Message Submission Service (MSS) Dev Server --------------------------
# mss-server.key
openssl genrsa -out mss-server.key 2048
# mss-server.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key mss-server.key -out mss-server.crt -subj /O="Cargomail Provider"/CN="mss-dev-server.cargomail.org" -addext "subjectAltName=IP:127.0.0.1" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-server._mss._grip.bar.com"

# ------------------------ cargomail.org Message Submission Service (MSS) Dev Client --------------------------
# mss-client.key
openssl genrsa -out mss-client.key 2048
# mss-client.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key mss-client.key -out mss-client.crt -subj /O="Cargomail Provider"/CN="cargomail.org" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-client._mss._grip.foo.com"

# ------------------------ cargomail.org Message Handling Service (MHS) Dev Server --------------------------
# mhs-server.key
openssl genrsa -out mhs-server.key 2048
# mhs-server.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key mhs-server.key -out mhs-server.crt -subj /O="Cargomail Provider"/CN="mhs-dev-server.cargomail.org" -addext "subjectAltName=IP:127.0.0.1" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-server._mhs._grip.bar.com"

# ------------------------ cargomail.org Message Handling Service (MHS) Dev Client --------------------------
# mhs-client.key
openssl genrsa -out mhs-client.key 2048
# mhs-client.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key mhs-client.key -out mhs-client.crt -subj /O="Cargomail Provider"/CN="cargomail.org" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-client._mhs._grip.foo.com"

# ------------------------ cargomail.org Message Delivery Service (MDS) Dev Server --------------------------
# mds-server.key
openssl genrsa -out mds-server.key 2048
# mds-server.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key mds-server.key -out mds-server.crt -subj /O="Cargomail Provider"/CN="mds-dev-server.cargomail.org" -addext "subjectAltName=IP:127.0.0.1" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-server._mds._grip.bar.com"

# ------------------------ cargomail.org Message Delivery Service (MDS) Dev Client --------------------------
# mds-client.key
openssl genrsa -out mds-client.key 2048
# mds-client.crt
openssl req -x509 -config openssl.cnf -extensions v3_req -days 3650 -nodes -key mds-client.key -out mds-client.crt -subj /O="Cargomail Provider"/CN="cargomail.org" -addext "1.2.3.4.5.6.7.8.1=ASN1:UTF8String:dev-client._mds._grip.foo.com"
