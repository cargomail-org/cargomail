// @generated by protobuf-ts 2.7.0
// @generated from protobuf file "proto/people/v1/people.proto" (package "people.v1", syntax proto3)
// tslint:disable
import type { RpcTransport } from "@protobuf-ts/runtime-rpc";
import type { ServiceInfo } from "@protobuf-ts/runtime-rpc";
import { People } from "./people";
import type { Empty } from "../../../google/protobuf/empty";
import type { ContactsDeleteRequest } from "./people";
import type { ContactsUpdateRequest } from "./people";
import type { Person } from "./people";
import type { ContactsCreateRequest } from "./people";
import { stackIntercept } from "@protobuf-ts/runtime-rpc";
import type { ListContactsResponse } from "./people";
import type { ContactsListRequest } from "./people";
import type { UnaryCall } from "@protobuf-ts/runtime-rpc";
import type { RpcOptions } from "@protobuf-ts/runtime-rpc";
/**
 * @generated from protobuf service people.v1.People
 */
export interface IPeopleClient {
    /**
     * @generated from protobuf rpc: ContactsList(people.v1.ContactsListRequest) returns (people.v1.ListContactsResponse);
     */
    contactsList(input: ContactsListRequest, options?: RpcOptions): UnaryCall<ContactsListRequest, ListContactsResponse>;
    /**
     * @generated from protobuf rpc: ContactsCreate(people.v1.ContactsCreateRequest) returns (people.v1.Person);
     */
    contactsCreate(input: ContactsCreateRequest, options?: RpcOptions): UnaryCall<ContactsCreateRequest, Person>;
    /**
     * @generated from protobuf rpc: ContactsUpdate(people.v1.ContactsUpdateRequest) returns (people.v1.Person);
     */
    contactsUpdate(input: ContactsUpdateRequest, options?: RpcOptions): UnaryCall<ContactsUpdateRequest, Person>;
    /**
     * @generated from protobuf rpc: ContactsDelete(people.v1.ContactsDeleteRequest) returns (google.protobuf.Empty);
     */
    contactsDelete(input: ContactsDeleteRequest, options?: RpcOptions): UnaryCall<ContactsDeleteRequest, Empty>;
}
/**
 * @generated from protobuf service people.v1.People
 */
export class PeopleClient implements IPeopleClient, ServiceInfo {
    typeName = People.typeName;
    methods = People.methods;
    options = People.options;
    constructor(private readonly _transport: RpcTransport) {
    }
    /**
     * @generated from protobuf rpc: ContactsList(people.v1.ContactsListRequest) returns (people.v1.ListContactsResponse);
     */
    contactsList(input: ContactsListRequest, options?: RpcOptions): UnaryCall<ContactsListRequest, ListContactsResponse> {
        const method = this.methods[0], opt = this._transport.mergeOptions(options);
        return stackIntercept<ContactsListRequest, ListContactsResponse>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ContactsCreate(people.v1.ContactsCreateRequest) returns (people.v1.Person);
     */
    contactsCreate(input: ContactsCreateRequest, options?: RpcOptions): UnaryCall<ContactsCreateRequest, Person> {
        const method = this.methods[1], opt = this._transport.mergeOptions(options);
        return stackIntercept<ContactsCreateRequest, Person>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ContactsUpdate(people.v1.ContactsUpdateRequest) returns (people.v1.Person);
     */
    contactsUpdate(input: ContactsUpdateRequest, options?: RpcOptions): UnaryCall<ContactsUpdateRequest, Person> {
        const method = this.methods[2], opt = this._transport.mergeOptions(options);
        return stackIntercept<ContactsUpdateRequest, Person>("unary", this._transport, method, opt, input);
    }
    /**
     * @generated from protobuf rpc: ContactsDelete(people.v1.ContactsDeleteRequest) returns (google.protobuf.Empty);
     */
    contactsDelete(input: ContactsDeleteRequest, options?: RpcOptions): UnaryCall<ContactsDeleteRequest, Empty> {
        const method = this.methods[3], opt = this._transport.mergeOptions(options);
        return stackIntercept<ContactsDeleteRequest, Empty>("unary", this._transport, method, opt, input);
    }
}