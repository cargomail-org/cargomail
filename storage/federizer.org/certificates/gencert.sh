########################## Self-Signed ##########################
# ------------------------ federizer.org Cargomail Server --------------------------
# server.key
openssl genrsa -out server.key 2048
# server.crt
openssl req -x509 -days 3650 -nodes -key server.key -out server.crt -subj /O="Cargomail Provider"/CN="_cargomail-dev-server.federizer.org" -addext "subjectAltName=IP:127.0.0.3"

# ------------------------ federizer.org Cargomail Agent --------------------------
# agent.key
openssl genrsa -out agent.key 2048
# agent.crt
openssl req -x509 -days 3650 -nodes -key agent.key -out agent.crt -subj /O="Cargomail Provider"/CN="_cargomail-dev-agent.federizer.org"
