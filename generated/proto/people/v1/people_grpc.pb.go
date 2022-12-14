// Code generated by protoc-gen-go-grpc. DO NOT EDIT.
// versions:
// - protoc-gen-go-grpc v1.2.0
// - protoc             (unknown)
// source: proto/people/v1/people.proto

package peoplev1

import (
	context "context"
	grpc "google.golang.org/grpc"
	codes "google.golang.org/grpc/codes"
	status "google.golang.org/grpc/status"
	emptypb "google.golang.org/protobuf/types/known/emptypb"
)

// This is a compile-time assertion to ensure that this generated file
// is compatible with the grpc package it is being compiled against.
// Requires gRPC-Go v1.32.0 or later.
const _ = grpc.SupportPackageIsVersion7

// PeopleClient is the client API for People service.
//
// For semantics around ctx use and closing/ending streaming RPCs, please refer to https://pkg.go.dev/google.golang.org/grpc/?tab=doc#ClientConn.NewStream.
type PeopleClient interface {
	ContactsList(ctx context.Context, in *ContactsListRequest, opts ...grpc.CallOption) (*ListContactsResponse, error)
	ContactsCreate(ctx context.Context, in *ContactsCreateRequest, opts ...grpc.CallOption) (*Person, error)
	ContactsUpdate(ctx context.Context, in *ContactsUpdateRequest, opts ...grpc.CallOption) (*Person, error)
	ContactsDelete(ctx context.Context, in *ContactsDeleteRequest, opts ...grpc.CallOption) (*emptypb.Empty, error)
}

type peopleClient struct {
	cc grpc.ClientConnInterface
}

func NewPeopleClient(cc grpc.ClientConnInterface) PeopleClient {
	return &peopleClient{cc}
}

func (c *peopleClient) ContactsList(ctx context.Context, in *ContactsListRequest, opts ...grpc.CallOption) (*ListContactsResponse, error) {
	out := new(ListContactsResponse)
	err := c.cc.Invoke(ctx, "/people.v1.People/ContactsList", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *peopleClient) ContactsCreate(ctx context.Context, in *ContactsCreateRequest, opts ...grpc.CallOption) (*Person, error) {
	out := new(Person)
	err := c.cc.Invoke(ctx, "/people.v1.People/ContactsCreate", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *peopleClient) ContactsUpdate(ctx context.Context, in *ContactsUpdateRequest, opts ...grpc.CallOption) (*Person, error) {
	out := new(Person)
	err := c.cc.Invoke(ctx, "/people.v1.People/ContactsUpdate", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (c *peopleClient) ContactsDelete(ctx context.Context, in *ContactsDeleteRequest, opts ...grpc.CallOption) (*emptypb.Empty, error) {
	out := new(emptypb.Empty)
	err := c.cc.Invoke(ctx, "/people.v1.People/ContactsDelete", in, out, opts...)
	if err != nil {
		return nil, err
	}
	return out, nil
}

// PeopleServer is the server API for People service.
// All implementations must embed UnimplementedPeopleServer
// for forward compatibility
type PeopleServer interface {
	ContactsList(context.Context, *ContactsListRequest) (*ListContactsResponse, error)
	ContactsCreate(context.Context, *ContactsCreateRequest) (*Person, error)
	ContactsUpdate(context.Context, *ContactsUpdateRequest) (*Person, error)
	ContactsDelete(context.Context, *ContactsDeleteRequest) (*emptypb.Empty, error)
	mustEmbedUnimplementedPeopleServer()
}

// UnimplementedPeopleServer must be embedded to have forward compatible implementations.
type UnimplementedPeopleServer struct {
}

func (UnimplementedPeopleServer) ContactsList(context.Context, *ContactsListRequest) (*ListContactsResponse, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ContactsList not implemented")
}
func (UnimplementedPeopleServer) ContactsCreate(context.Context, *ContactsCreateRequest) (*Person, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ContactsCreate not implemented")
}
func (UnimplementedPeopleServer) ContactsUpdate(context.Context, *ContactsUpdateRequest) (*Person, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ContactsUpdate not implemented")
}
func (UnimplementedPeopleServer) ContactsDelete(context.Context, *ContactsDeleteRequest) (*emptypb.Empty, error) {
	return nil, status.Errorf(codes.Unimplemented, "method ContactsDelete not implemented")
}
func (UnimplementedPeopleServer) mustEmbedUnimplementedPeopleServer() {}

// UnsafePeopleServer may be embedded to opt out of forward compatibility for this service.
// Use of this interface is not recommended, as added methods to PeopleServer will
// result in compilation errors.
type UnsafePeopleServer interface {
	mustEmbedUnimplementedPeopleServer()
}

func RegisterPeopleServer(s grpc.ServiceRegistrar, srv PeopleServer) {
	s.RegisterService(&People_ServiceDesc, srv)
}

func _People_ContactsList_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ContactsListRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PeopleServer).ContactsList(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/people.v1.People/ContactsList",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PeopleServer).ContactsList(ctx, req.(*ContactsListRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _People_ContactsCreate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ContactsCreateRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PeopleServer).ContactsCreate(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/people.v1.People/ContactsCreate",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PeopleServer).ContactsCreate(ctx, req.(*ContactsCreateRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _People_ContactsUpdate_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ContactsUpdateRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PeopleServer).ContactsUpdate(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/people.v1.People/ContactsUpdate",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PeopleServer).ContactsUpdate(ctx, req.(*ContactsUpdateRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _People_ContactsDelete_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ContactsDeleteRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PeopleServer).ContactsDelete(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/people.v1.People/ContactsDelete",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PeopleServer).ContactsDelete(ctx, req.(*ContactsDeleteRequest))
	}
	return interceptor(ctx, in, info, handler)
}

// People_ServiceDesc is the grpc.ServiceDesc for People service.
// It's only intended for direct use with grpc.RegisterService,
// and not to be introspected or modified (even as a copy)
var People_ServiceDesc = grpc.ServiceDesc{
	ServiceName: "people.v1.People",
	HandlerType: (*PeopleServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "ContactsList",
			Handler:    _People_ContactsList_Handler,
		},
		{
			MethodName: "ContactsCreate",
			Handler:    _People_ContactsCreate_Handler,
		},
		{
			MethodName: "ContactsUpdate",
			Handler:    _People_ContactsUpdate_Handler,
		},
		{
			MethodName: "ContactsDelete",
			Handler:    _People_ContactsDelete_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "proto/people/v1/people.proto",
}
