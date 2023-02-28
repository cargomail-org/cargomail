package service

import (
	"context"

	peoplev1 "github.com/cargomail-org/cargomail/generated/proto/people/v1"
	repository "github.com/cargomail-org/cargomail/internal/repository/people/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	// "google.golang.org/protobuf/types/known/emptypb"
)

type service struct {
	peoplev1.UnimplementedPeopleServer
	repo repository.Repo
}

func NewService(repo repository.Repo) *service {
	return &service{repo: repo}
}

func (h *service) ContactsList(ctx context.Context, req *peoplev1.ContactsListRequest) (*peoplev1.ListContactsResponse, error) {
	people, err := h.repo.ContactsList(ctx, req)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	connectionsList := &peoplev1.ListContactsResponse{Contacts: people}
	return connectionsList, nil
}

func (h *service) ContactsCreate(ctx context.Context, req *peoplev1.ContactsCreateRequest) (*peoplev1.Person, error) {
	person, err := h.repo.ContactsCreate(ctx, req)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return person, nil
}
