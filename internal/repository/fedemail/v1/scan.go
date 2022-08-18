package repository

import (
	"database/sql/driver"
	"encoding/json"

	"github.com/federizer/fedemail/gen/proto/fedemail/v1"
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
	err := json.Unmarshal(value.([]byte), &s)
	return err
}

func (s ScanThread) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanThread) Scan(value interface{}) error {
	err := json.Unmarshal(value.([]byte), &s)
	return err
}

func (s ScanMessage) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanMessage) Scan(value interface{}) error {
	err := json.Unmarshal(value.([]byte), &s)
	return err
}

func (s ScanDraft) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanDraft) Scan(value interface{}) error {
	err := json.Unmarshal(value.([]byte), &s)
	return err
}
