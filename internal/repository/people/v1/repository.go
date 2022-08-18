package repository

import (
	"database/sql"

	"github.com/federizer/fedemail/gen/proto/people/v1"
)

type Repo interface {
	ConnectionsList() ([]*peoplev1.Person, error)
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db}
}

func (r *Repository) ConnectionsList() ([]*peoplev1.Person, error) {
	var people []*peoplev1.Person

	sqlStatement := `SELECT people.connections_list($1);`
	rows, err := r.db.Query(sqlStatement, "matthew.cuthbert@demo.localhost")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var scanPerson ScanPerson
		err = rows.Scan(&scanPerson)
		if err != nil {
			return nil, err
		}
		people = append(people, scanPerson.Person)
	}

	err = rows.Err()
	if err != nil {
		return nil, err
	}

	return people, nil
}
