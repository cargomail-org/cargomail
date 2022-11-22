package repository

import (
	"context"
	"database/sql"

	peoplev1 "github.com/cargomail-org/cargomail/generated/proto/people/v1"
	"google.golang.org/grpc/metadata"
)

type Repo interface {
	ContactsList(context.Context, *peoplev1.ContactsListRequest) ([]*peoplev1.Person, error)
	ContactsCreate(context.Context, *peoplev1.ContactsCreateRequest) (*peoplev1.Person, error)
}

type Repository struct {
	db *sql.DB
}

func NewRepository(db *sql.DB) *Repository {
	return &Repository{db}
}

func getUsername(ctx context.Context) string {
	md, ok := metadata.FromIncomingContext(ctx)
	if ok && len(md["username"]) > 0 {
		return md["username"][0]
	}
	return ""
}

func (r *Repository) ContactsList(ctx context.Context, req *peoplev1.ContactsListRequest) ([]*peoplev1.Person, error) {
	var people []*peoplev1.Person

	sqlStatement := `SELECT people.contacts_list_v1($1);`
	rows, err := r.db.Query(sqlStatement, getUsername(ctx))
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

func (r *Repository) ContactsCreate(ctx context.Context, req *peoplev1.ContactsCreateRequest) (*peoplev1.Person, error) {
	var scanPerson ScanPerson
	scanPerson.Person = req.Person

	sqlStatement := `SELECT people.contacts_create_v1($1, $2);`
	err := r.db.QueryRow(sqlStatement, getUsername(ctx), scanPerson).Scan(&scanPerson)
	if err != nil {
		return nil, err
	}

	return scanPerson.Person, err
}
