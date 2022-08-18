package repository

import (
	"database/sql/driver"
	"encoding/json"

	"github.com/federizer/fedemail/gen/proto/people/v1"
)

type ScanPerson struct {
	*peoplev1.Person
}

func (s ScanPerson) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanPerson) Scan(value interface{}) error {
	err := json.Unmarshal(value.([]byte), &s)
	return err
}
