package handler

import (
	"context"

	"github.com/federizer/fedemail/generated/proto/people/v1"
	"github.com/federizer/fedemail/internal/repository/people/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	// "google.golang.org/protobuf/types/known/emptypb"
)

type handler struct {
	peoplev1.UnimplementedPeopleServer
	repo repository.Repo
}

func NewHandler(repo repository.Repo) *handler {
	return &handler{repo: repo}
}

func (h *handler) ContactsList(ctx context.Context, in *peoplev1.ContactsListRequest) (*peoplev1.ListContactsResponse, error) {
	people, err := h.repo.ContactsList(ctx, in)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	connectionsList := &peoplev1.ListContactsResponse{Contacts: people}
	return connectionsList, nil
}
