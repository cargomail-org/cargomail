package mail

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"io"

	"github.com/emersion/go-message/textproto"
	"github.com/federizer/fedemail/generated/proto/fedemail/v1"
)

type MailMessage struct {
	Message *fedemailv1.Message
}

func (m *MailMessage) GetParsedMessage() (*fedemailv1.Message, error) {
	data, err := base64.URLEncoding.WithPadding(base64.NoPadding).DecodeString(m.Message.Raw)
	if err != nil {
		return nil, err
	}

	headers, b, err := m.headerAndBody(data)
	if err != nil {
		return nil, err
	}

	var messageHeaders []*fedemailv1.MessagePartHeader
	var mimeType string

	for k, v := range headers.Map() {
		// fmt.Printf("%s -> %s\n", k, v)
		var messagePartHeader fedemailv1.MessagePartHeader
		messagePartHeader.Name = k
		messagePartHeader.Value = v[0]
		messageHeaders = append(messageHeaders, &messagePartHeader)

		if k == "Content-Type" {
			mimeType = v[0]
		}
	}

	body, err := io.ReadAll(b)
	if err != nil {
		return nil, err
	}

	decodedBody, err := base64.StdEncoding.DecodeString(string(body))
	if err != nil {
		return nil, err
	}

	m.Message.Payload = &fedemailv1.MessagePart{
		MimeType: mimeType,
		Headers:  messageHeaders,
		Body: &fedemailv1.MessagePartBody{
			Data: string(body),
			Size: int32(len(decodedBody)),
		}}

	return m.Message, nil
}

func (m *MailMessage) headerAndBody(data []byte) (textproto.Header, io.Reader, error) {
	body := bufio.NewReader(bytes.NewReader(data))
	hdr, err := textproto.ReadHeader(body)
	return hdr, body, err
}
