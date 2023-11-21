package agent

import (
	"bytes"
	"cargomail/internal/mailbox/repository"
	"cargomail/internal/shared/config"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/miekg/dns"
)

type UseMessageSubmissionAgent interface {
	Post(ctx context.Context, message *repository.Message) (*http.Response, error)
}

type MessageSubmissionAgent struct {
	repository repository.Repository
	httpClient *http.Client
	dohClient  *http.Client
}

func (a *MessageSubmissionAgent) Post(ctx context.Context, message *repository.Message) (*http.Response, error) {
	_, ok := ctx.Value(repository.UserContextKey).(*repository.User)
	if !ok {
		return nil, repository.ErrMissingUserContext
	}

	query := dns.Msg{}
	srvName := "_mss"
	if config.DevStage() {
		srvName = srvName + "-dev"
	}

	srvName = srvName + "._tcp." + config.Configuration.DomainName + "."

	query.SetQuestion(srvName, dns.TypeSRV)
	msg, err := query.Pack()
	if err != nil {
		return nil, err
	}

	dohURL := url.URL{Scheme: "https", Host: config.Configuration.DoHProviderHost, Path: "/dns-query"}

	dohReq, err := http.NewRequestWithContext(ctx, http.MethodPost, dohURL.String(), bytes.NewBuffer([]byte(msg)))
	if err != nil {
		return nil, err
	}

	dohReq.Header.Set("Content-Type", "application/dns-message")

	dohResp, err := a.dohClient.Do(dohReq)
	if err != nil {
		return nil, err
	}

	defer dohResp.Body.Close()

	body, err := io.ReadAll(dohResp.Body)
	if err != nil {
		return nil, err
	}

	if err := dohResp.Body.Close(); err != nil {
		return nil, err
	}

	dnsResp := dns.Msg{}
	dnsResp.Unpack(body)

	// log.Printf("Dns answer is :%v\n", dnsResp.String())

	var hmsaHost string
	var hmsaPort uint16

	for _, a := range dnsResp.Answer {
		t, ok := a.(*dns.SRV)
		if !ok {
			continue
		}
		hmsaHost = t.Target
		hmsaHost = strings.TrimSuffix(hmsaHost, ".")
		hmsaPort = t.Port
	}

	URL := url.URL{Scheme: "https", Host: net.JoinHostPort(hmsaHost, strconv.Itoa(int(hmsaPort))), Path: "/api/v1/messages/post"}

	messageJSON, err := json.Marshal(message)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, URL.String(), bytes.NewBuffer(messageJSON))
	if err != nil {
		return nil, err
	}

	resp, err := a.httpClient.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	return resp, err
}
