package handler

import (
	"context"
	"fmt"
	"strconv"

	"github.com/federizer/fedemail/generated/proto/fedemail/v1"
	"github.com/federizer/fedemail/internal/repository/fedemail/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type handler struct {
	fedemailv1.UnimplementedFedemailServer
	repo repository.Repo
}

func NewHandler(repo repository.Repo) *handler {
	return &handler{repo: repo}
}

func (h *handler) LabelsList(ctx context.Context, req *emptypb.Empty) (*fedemailv1.ListLabelsResponse, error) {
	labels, err := h.repo.LabelsList(ctx)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	labelList := &fedemailv1.ListLabelsResponse{Labels: labels}
	return labelList, nil
}

func (h *handler) ThreadsList(ctx context.Context, req *fedemailv1.ThreadsListRequest) (*fedemailv1.ListThreadsResponse, error) {
	threads, err := h.repo.ThreadsList(ctx)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	threadList := &fedemailv1.ListThreadsResponse{Threads: threads}
	return threadList, nil
}

func (h *handler) ThreadsGet(ctx context.Context, req *fedemailv1.ThreadsGetRequest) (*fedemailv1.Thread, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return nil, err
	}
	thread, err := h.repo.ThreadsGet(ctx, id)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return thread, nil
}

func (h *handler) MessagesModify(ctx context.Context, req *fedemailv1.MessagesModifyRequest) (*fedemailv1.Message, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return nil, err
	}
	message, err := h.repo.MessagesModify(ctx, id, req.ModifyMessageRequest.AddLabelIds, req.ModifyMessageRequest.RemoveLabelIds)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return message, nil
}

func (h *handler) DraftsCreate(ctx context.Context, req *fedemailv1.DraftsCreateRequest) (*fedemailv1.Draft, error) {
	draft, err := h.repo.DraftsCreate(ctx, req.MessageRaw)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return draft, nil
}

func (h *handler) DraftsUpdate(ctx context.Context, req *fedemailv1.DraftsUpdateRequest) (*fedemailv1.Draft, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return nil, err
	}
	draft, err := h.repo.DraftsUpdate(ctx, id, req.MessageRaw)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return draft, nil
}

func (h *handler) DraftsDelete(ctx context.Context, req *fedemailv1.DraftsDeleteRequest) (*emptypb.Empty, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return &emptypb.Empty{}, err
	}
	cnt := h.repo.DraftsDelete(ctx, id)
	if cnt == 0 {
		return &emptypb.Empty{}, status.Error(codes.Aborted, fmt.Sprintf("the record id:%d not found", id))
	}
	return &emptypb.Empty{}, nil
}
