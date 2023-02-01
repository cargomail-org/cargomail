package handler

import (
	"context"
	"fmt"
	"strconv"

	emailv1 "github.com/cargomail-org/cargomail/generated/proto/email/v1"
	repository "github.com/cargomail-org/cargomail/internal/repository/email/v1"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"
)

type handler struct {
	emailv1.UnimplementedEmailServer
	repo repository.Repo
}

func NewHandler(repo repository.Repo) *handler {
	return &handler{repo: repo}
}

func (h *handler) LabelsList(ctx context.Context, req *emptypb.Empty) (*emailv1.ListLabelsResponse, error) {
	labels, err := h.repo.LabelsList(ctx)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	labelList := &emailv1.ListLabelsResponse{Labels: labels}
	return labelList, nil
}

func (h *handler) ThreadsList(ctx context.Context, req *emailv1.ThreadsListRequest) (*emailv1.ListThreadsResponse, error) {
	threads, err := h.repo.ThreadsList(ctx)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	threadList := &emailv1.ListThreadsResponse{Threads: threads}
	return threadList, nil
}

func (h *handler) ThreadsGet(ctx context.Context, req *emailv1.ThreadsGetRequest) (*emailv1.Thread, error) {
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

func (h *handler) MessagesModify(ctx context.Context, req *emailv1.MessagesModifyRequest) (*emailv1.Message, error) {
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

func (h *handler) DraftsList(ctx context.Context, req *emailv1.DraftsListRequest) (*emailv1.ListDraftsResponse, error) {
	drafts, err := h.repo.DraftsList(ctx)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	draftList := &emailv1.ListDraftsResponse{Drafts: drafts}
	return draftList, nil
}

func (h *handler) DraftsGet(ctx context.Context, req *emailv1.DraftsGetRequest) (*emailv1.Draft, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return nil, err
	}
	draft, err := h.repo.DraftsGet(ctx, id)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return draft, nil
}

func (h *handler) DraftsCreate(ctx context.Context, req *emailv1.DraftsCreateRequest) (*emailv1.Draft, error) {
	draft, err := h.repo.DraftsCreate(ctx, req.MessageRaw)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return draft, nil
}

func (h *handler) DraftsUpdate(ctx context.Context, req *emailv1.DraftsUpdateRequest) (*emailv1.Draft, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return nil, err
	}
	draft, err := h.repo.DraftsUpdate(ctx, id, req.MessageRaw.Message)
	if err != nil {
		return nil, status.Error(codes.Aborted, err.Error())
	}
	return draft, nil
}

func (h *handler) DraftsUpdateAttachment(ctx context.Context, req *emailv1.DraftsUpdateAttachmentRequest) (*emptypb.Empty, error) {
	cnt, err := h.repo.DraftsUpdateAttachment(ctx, req.Attachment)
	if err != nil {
		return &emptypb.Empty{}, status.Error(codes.Aborted, err.Error())
	} else if cnt == 0 {
		return &emptypb.Empty{}, status.Error(codes.Aborted, fmt.Sprintf("attachments with uploadId: %s not found", req.Attachment.UploadId))
	}
	return &emptypb.Empty{}, nil
}

func (h *handler) DraftsDelete(ctx context.Context, req *emailv1.DraftsDeleteRequest) (*emptypb.Empty, error) {
	id, err := strconv.ParseInt(req.GetId(), 10, 64)
	if err != nil {
		return &emptypb.Empty{}, err
	}
	cnt := h.repo.DraftsDelete(ctx, id)
	if cnt == 0 {
		return &emptypb.Empty{}, status.Error(codes.Aborted, fmt.Sprintf("the record id: %d not found", id))
	}
	return &emptypb.Empty{}, nil
}
