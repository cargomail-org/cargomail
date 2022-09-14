package repository

import (
	"database/sql/driver"
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
