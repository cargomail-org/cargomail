package repository

import (
	"database/sql/driver"
	"encoding/json"

	peoplev1 "github.com/cargomail-org/cargomail/generated/proto/people/v1"
)

type ScanPerson struct {
	*peoplev1.Person
}

func (s ScanPerson) Value() (driver.Value, error) {
	return json.Marshal(s)
}

func (s *ScanPerson) Scan(value interface{}) error {
	data, ok := value.([]byte)
	if !ok {
		s.Person = &peoplev1.Person{}
		return nil
	}
	return json.Unmarshal(data, &s)
}
