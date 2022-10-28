package repository

import (
	"database/sql/driver"
	"encoding/base64"
	"encoding/json"

	"github.com/federizer/fedemail/generated/proto/fedemail/v1"
)

type ScanLabel struct {
	*fedemailv1.Label
}

type ScanThread struct {
	*fedemailv1.Thread
}

type ScanMessage struct {
	*fedemailv1.Message
}
type ScanDraft struct {
	*fedemailv1.Draft
	Message *ScanMessage `json:"message,omitempty"`
}

func (s ScanLabel) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanLabel) Scan(value interface{}) error {
	data, ok := value.([]byte)
	if !ok {
		s.Label = &fedemailv1.Label{}
		return nil
	}
	return json.Unmarshal(data, &s)
}

func (s ScanThread) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanThread) Scan(value interface{}) error {
	data, ok := value.([]byte)
	if !ok {
		s.Thread = &fedemailv1.Thread{}
		return nil
	}
	return json.Unmarshal(data, &s)
}

func (s ScanMessage) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanMessage) Scan(value interface{}) error {
	data, ok := value.([]byte)
	if !ok {
		s.Message = &fedemailv1.Message{}
		return nil
	}
	return json.Unmarshal(data, &s)
}

func (s ScanDraft) Value() (driver.Value, error) {
	s.Message = &ScanMessage{
		Message: s.Draft.Message,
	}

	return json.Marshal(s.Message)
}

func (s *ScanDraft) Scan(value interface{}) error {
	data, ok := value.([]byte)
	if !ok {
		s.Draft = &fedemailv1.Draft{}
		return nil
	}

	err := json.Unmarshal(data, &s)
	if err != nil {
		return err
	}

	s.Draft.Message = s.Message.Message
	return nil
}

func (s ScanMessage) MarshalJSON() ([]byte, error) {
	type ScanMessageAlias ScanMessage

	aux := &struct {
		*ScanMessageAlias
		Payload struct {
			*fedemailv1.MessagePart
			MimeType string `json:"mime_type,omitempty"`
			Body     struct {
				*fedemailv1.MessagePartBody
				Data interface{} `json:"data,omitempty"`
			} `json:"body,omitempty"`
		} `json:"payload,omitempty"`
	}{ScanMessageAlias: (*ScanMessageAlias)(&s)}

	b, err := json.Marshal((*ScanMessageAlias)(&s))
	if err != nil {
		return nil, err
	}
	json.Unmarshal(b, aux)

	if aux.Payload.MimeType == "application/json" && len(s.Payload.Body.Data) > 0 {
		data, err := base64.StdEncoding.WithPadding(base64.StdPadding).DecodeString(s.Payload.Body.Data)
		if err != nil {
			return nil, err
		}

		if err := json.Unmarshal(data, &aux.Payload.Body.Data); err != nil {
			return nil, err
		}
	}

	return json.Marshal(aux)
}

func (s *ScanMessage) UnmarshalJSON(data []byte) error {
	type ScanMessageAlias ScanMessage

	aux := &struct {
		*ScanMessageAlias
		Payload struct {
			*fedemailv1.MessagePart
			MimeType string `json:"mime_type,omitempty"`
			Body     struct {
				*fedemailv1.MessagePartBody
				Data interface{} `json:"data,omitempty"`
			} `json:"body,omitempty"`
		} `json:"payload,omitempty"`
	}{ScanMessageAlias: (*ScanMessageAlias)(s)}

	err := json.Unmarshal(data, aux)
	if err != nil {
		return err
	}

	if aux.Payload.MimeType == "application/json" {
		b, err := json.Marshal(aux.Payload.Body.Data)
		if err != nil {
			return err
		}

		aux.Payload.Body.Data = base64.StdEncoding.WithPadding(base64.StdPadding).EncodeToString(b)
	}

	b, _ := json.Marshal(aux)
	return json.Unmarshal(b, (*ScanMessageAlias)(s))
}
