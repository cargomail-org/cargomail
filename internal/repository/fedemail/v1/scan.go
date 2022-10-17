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

func (s *ScanMessage) MarshalJSON() ([]byte, error) {
	j, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}

	var f interface{}
	if err := json.Unmarshal(j, &f); err != nil {
		return nil, err
	}
	m := f.(map[string]interface{})
	for k, v := range m {
		if k == "payload" {
			m2 := v.(map[string]interface{})
			for k2, v2 := range m2 {
				if k2 == "mime_type" && v2 == "application/json" {
					for k2, v2 := range m2 {
						if k2 == "body" {
							m3 := v2.(map[string]interface{})
							for k3, v3 := range m3 {
								if k3 == "data" {
									b, err := base64.StdEncoding.WithPadding(base64.StdPadding).DecodeString(v3.(string))
									if err != nil {
										return nil, err
									}
									var ff interface{}
									if err := json.Unmarshal(b, &ff); err != nil {
										return nil, err
									}
									m3[k3] = ff
								}
							}
						}
					}
				}
			}
		}
	}

	if (s.Payload.MimeType == "application/json") {
		return json.Marshal(m)
	}

	return json.Marshal(s)
}

func (s ScanMessage) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanMessage) UnmarshalJSON(data []byte) error {
	var applicationJsonData bool = false

	var f interface{}
	if err := json.Unmarshal(data, &f); err != nil {
		return err
	}
	m := f.(map[string]interface{})
	for k, v := range m {
		if k == "payload" {
			m2 := v.(map[string]interface{})
			for k2, v2 := range m2 {
				if k2 == "mime_type" && v2 == "application/json" {
					for k2, v2 := range m2 {
						if k2 == "body" {
							m3 := v2.(map[string]interface{})
							for k3, v3 := range m3 {
								if k3 == "data" {
									applicationJsonData = true
									b, _ := json.Marshal(v3)
									m3[k3] = base64.StdEncoding.WithPadding(base64.StdPadding).EncodeToString(b)
								}
							}
						}
					}
				}
			}
		}
	}

	if applicationJsonData {
		b, err := json.Marshal(m)
		if err != nil {
			return err
		}

		type t ScanMessage
		return json.Unmarshal(b, (*t)(s))
	}

	type t ScanMessage
	return json.Unmarshal(data, (*t)(s))
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
	return json.Marshal(s)
}

func (s *ScanDraft) Scan(value interface{}) error {
	data, ok := value.([]byte)
	if !ok {
		s.Draft = &fedemailv1.Draft{}
		return nil
	}
	return json.Unmarshal(data, &s)
}
