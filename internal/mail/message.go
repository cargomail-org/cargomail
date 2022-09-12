package mail

import (
	"bufio"
	"bytes"
	"io"
	"net/mail"
	"time"

	"github.com/emersion/go-message/textproto"
)

type Message struct {
	Message []byte
	Uid     uint32
	Header  mail.Header
	Date    time.Time
	Size    uint32
	Flags   []string
	Body    []byte
}

func (m *Message) HeaderAndBody() (textproto.Header, io.Reader, error) {
	body := bufio.NewReader(bytes.NewReader([]byte(m.Message)))
	hdr, err := textproto.ReadHeader(body)
	return hdr, body, err
}

