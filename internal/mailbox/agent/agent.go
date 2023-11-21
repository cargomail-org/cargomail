package agent

import (
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/shared/config"
	"crypto/tls"
	"crypto/x509"
	"log"
	"net"
	"net/http"
	"time"
)

type Agent struct {
	MessageSubmission UseMessageSubmissionAgent
	ResourceFetch     UseResourceFetchAgent
}

func NewAgent(repository repository.Repository) Agent {
	certFile := config.Configuration.MailboxServiceCertPath
	keyFile := config.Configuration.MailboxServiceKeyPath
	// rootCertPath := config.Configuration.MailboxServiceRootCertPath

	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		log.Fatal(err)
	}

	// caCert, err := os.ReadFile(rootCertPath)
	// if err != nil {
	// 	log.Fatal(err)
	// }

	caCertPool := x509.NewCertPool()
	// caCertPool.AppendCertsFromPEM(caCert)

	tlsConfig := &tls.Config{
		Certificates:       []tls.Certificate{cert},
		RootCAs:            caCertPool,
		InsecureSkipVerify: true,
	}

	httpTransport := &http.Transport{
		Dial: (&net.Dialer{
			Timeout: 2 * time.Second,
		}).Dial,
		TLSHandshakeTimeout: 2 * time.Second,
		TLSClientConfig:     tlsConfig,
	}

	httpClient := &http.Client{
		Timeout:   time.Second * 4,
		Transport: httpTransport,
	}

	dohClient := &http.Client{
		Timeout:   time.Second * 4,
	}

	return Agent{
		MessageSubmission: &MessageSubmissionAgent{repository, httpClient, dohClient},
		ResourceFetch:     &ResourceFetchAgent{repository},
	}
}
