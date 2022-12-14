// @generated by protobuf-ts 2.7.0
// @generated from protobuf file "proto/people/v1/people.proto" (package "people.v1", syntax proto3)
// tslint:disable
import { Empty } from "../../../google/protobuf/empty";
import { ServiceType } from "@protobuf-ts/runtime-rpc";
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import { WireType } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import { UnknownFieldHandler } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { reflectionMergePartial } from "@protobuf-ts/runtime";
import { MESSAGE_TYPE } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * @generated from protobuf message people.v1.EmailAddress
 */
export interface EmailAddress {
    /**
     * @generated from protobuf field: string display_name = 1;
     */
    displayName: string;
    /**
     * @generated from protobuf field: string value = 2;
     */
    value: string;
}
/**
 * @generated from protobuf message people.v1.ListContactsResponse
 */
export interface ListContactsResponse {
    /**
     * @generated from protobuf field: repeated people.v1.Person contacts = 1;
     */
    contacts: Person[];
}
/**
 * @generated from protobuf message people.v1.Name
 */
export interface Name {
    /**
     * @generated from protobuf field: string display_name = 1;
     */
    displayName: string;
    /**
     * @generated from protobuf field: string display_name_last_first = 2;
     */
    displayNameLastFirst: string;
    /**
     * @generated from protobuf field: string family_name = 3;
     */
    familyName: string;
    /**
     * @generated from protobuf field: string given_name = 4;
     */
    givenName: string;
}
/**
 * @generated from protobuf message people.v1.Person
 */
export interface Person {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: people.v1.Name name = 2;
     */
    name?: Name;
    /**
     * @generated from protobuf field: repeated people.v1.EmailAddress email_addresses = 3;
     */
    emailAddresses: EmailAddress[];
}
/**
 * @generated from protobuf message people.v1.ContactsListRequest
 */
export interface ContactsListRequest {
    /**
     * @generated from protobuf field: int64 max_results = 1;
     */
    maxResults: bigint;
}
/**
 * @generated from protobuf message people.v1.ContactsCreateRequest
 */
export interface ContactsCreateRequest {
    /**
     * @generated from protobuf field: people.v1.Person person = 1;
     */
    person?: Person;
}
/**
 * @generated from protobuf message people.v1.ContactsGetRequest
 */
export interface ContactsGetRequest {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
}
/**
 * @generated from protobuf message people.v1.ContactsUpdateRequest
 */
export interface ContactsUpdateRequest {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
    /**
     * @generated from protobuf field: people.v1.Person person = 2;
     */
    person?: Person;
}
/**
 * @generated from protobuf message people.v1.ContactsDeleteRequest
 */
export interface ContactsDeleteRequest {
    /**
     * @generated from protobuf field: string id = 1;
     */
    id: string;
}
// @generated message type with reflection information, may provide speed optimized methods
class EmailAddress$Type extends MessageType<EmailAddress> {
    constructor() {
        super("people.v1.EmailAddress", [
            { no: 1, name: "display_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "value", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<EmailAddress>): EmailAddress {
        const message = { displayName: "", value: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<EmailAddress>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: EmailAddress): EmailAddress {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string display_name */ 1:
                    message.displayName = reader.string();
                    break;
                case /* string value */ 2:
                    message.value = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: EmailAddress, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string display_name = 1; */
        if (message.displayName !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.displayName);
        /* string value = 2; */
        if (message.value !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.value);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.EmailAddress
 */
export const EmailAddress = new EmailAddress$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ListContactsResponse$Type extends MessageType<ListContactsResponse> {
    constructor() {
        super("people.v1.ListContactsResponse", [
            { no: 1, name: "contacts", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Person }
        ]);
    }
    create(value?: PartialMessage<ListContactsResponse>): ListContactsResponse {
        const message = { contacts: [] };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ListContactsResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListContactsResponse): ListContactsResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated people.v1.Person contacts */ 1:
                    message.contacts.push(Person.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ListContactsResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated people.v1.Person contacts = 1; */
        for (let i = 0; i < message.contacts.length; i++)
            Person.internalBinaryWrite(message.contacts[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ListContactsResponse
 */
export const ListContactsResponse = new ListContactsResponse$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Name$Type extends MessageType<Name> {
    constructor() {
        super("people.v1.Name", [
            { no: 1, name: "display_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "display_name_last_first", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 3, name: "family_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 4, name: "given_name", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<Name>): Name {
        const message = { displayName: "", displayNameLastFirst: "", familyName: "", givenName: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<Name>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Name): Name {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string display_name */ 1:
                    message.displayName = reader.string();
                    break;
                case /* string display_name_last_first */ 2:
                    message.displayNameLastFirst = reader.string();
                    break;
                case /* string family_name */ 3:
                    message.familyName = reader.string();
                    break;
                case /* string given_name */ 4:
                    message.givenName = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: Name, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string display_name = 1; */
        if (message.displayName !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.displayName);
        /* string display_name_last_first = 2; */
        if (message.displayNameLastFirst !== "")
            writer.tag(2, WireType.LengthDelimited).string(message.displayNameLastFirst);
        /* string family_name = 3; */
        if (message.familyName !== "")
            writer.tag(3, WireType.LengthDelimited).string(message.familyName);
        /* string given_name = 4; */
        if (message.givenName !== "")
            writer.tag(4, WireType.LengthDelimited).string(message.givenName);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.Name
 */
export const Name = new Name$Type();
// @generated message type with reflection information, may provide speed optimized methods
class Person$Type extends MessageType<Person> {
    constructor() {
        super("people.v1.Person", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "name", kind: "message", T: () => Name },
            { no: 3, name: "email_addresses", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => EmailAddress }
        ]);
    }
    create(value?: PartialMessage<Person>): Person {
        const message = { id: "", emailAddresses: [] };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<Person>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: Person): Person {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* people.v1.Name name */ 2:
                    message.name = Name.internalBinaryRead(reader, reader.uint32(), options, message.name);
                    break;
                case /* repeated people.v1.EmailAddress email_addresses */ 3:
                    message.emailAddresses.push(EmailAddress.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: Person, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* people.v1.Name name = 2; */
        if (message.name)
            Name.internalBinaryWrite(message.name, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* repeated people.v1.EmailAddress email_addresses = 3; */
        for (let i = 0; i < message.emailAddresses.length; i++)
            EmailAddress.internalBinaryWrite(message.emailAddresses[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.Person
 */
export const Person = new Person$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ContactsListRequest$Type extends MessageType<ContactsListRequest> {
    constructor() {
        super("people.v1.ContactsListRequest", [
            { no: 1, name: "max_results", kind: "scalar", T: 3 /*ScalarType.INT64*/, L: 0 /*LongType.BIGINT*/ }
        ]);
    }
    create(value?: PartialMessage<ContactsListRequest>): ContactsListRequest {
        const message = { maxResults: 0n };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ContactsListRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ContactsListRequest): ContactsListRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* int64 max_results */ 1:
                    message.maxResults = reader.int64().toBigInt();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ContactsListRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* int64 max_results = 1; */
        if (message.maxResults !== 0n)
            writer.tag(1, WireType.Varint).int64(message.maxResults);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ContactsListRequest
 */
export const ContactsListRequest = new ContactsListRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ContactsCreateRequest$Type extends MessageType<ContactsCreateRequest> {
    constructor() {
        super("people.v1.ContactsCreateRequest", [
            { no: 1, name: "person", kind: "message", T: () => Person }
        ]);
    }
    create(value?: PartialMessage<ContactsCreateRequest>): ContactsCreateRequest {
        const message = {};
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ContactsCreateRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ContactsCreateRequest): ContactsCreateRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* people.v1.Person person */ 1:
                    message.person = Person.internalBinaryRead(reader, reader.uint32(), options, message.person);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ContactsCreateRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* people.v1.Person person = 1; */
        if (message.person)
            Person.internalBinaryWrite(message.person, writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ContactsCreateRequest
 */
export const ContactsCreateRequest = new ContactsCreateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ContactsGetRequest$Type extends MessageType<ContactsGetRequest> {
    constructor() {
        super("people.v1.ContactsGetRequest", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ContactsGetRequest>): ContactsGetRequest {
        const message = { id: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ContactsGetRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ContactsGetRequest): ContactsGetRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ContactsGetRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ContactsGetRequest
 */
export const ContactsGetRequest = new ContactsGetRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ContactsUpdateRequest$Type extends MessageType<ContactsUpdateRequest> {
    constructor() {
        super("people.v1.ContactsUpdateRequest", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ },
            { no: 2, name: "person", kind: "message", T: () => Person }
        ]);
    }
    create(value?: PartialMessage<ContactsUpdateRequest>): ContactsUpdateRequest {
        const message = { id: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ContactsUpdateRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ContactsUpdateRequest): ContactsUpdateRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                case /* people.v1.Person person */ 2:
                    message.person = Person.internalBinaryRead(reader, reader.uint32(), options, message.person);
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ContactsUpdateRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        /* people.v1.Person person = 2; */
        if (message.person)
            Person.internalBinaryWrite(message.person, writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ContactsUpdateRequest
 */
export const ContactsUpdateRequest = new ContactsUpdateRequest$Type();
// @generated message type with reflection information, may provide speed optimized methods
class ContactsDeleteRequest$Type extends MessageType<ContactsDeleteRequest> {
    constructor() {
        super("people.v1.ContactsDeleteRequest", [
            { no: 1, name: "id", kind: "scalar", T: 9 /*ScalarType.STRING*/ }
        ]);
    }
    create(value?: PartialMessage<ContactsDeleteRequest>): ContactsDeleteRequest {
        const message = { id: "" };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ContactsDeleteRequest>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ContactsDeleteRequest): ContactsDeleteRequest {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* string id */ 1:
                    message.id = reader.string();
                    break;
                default:
                    let u = options.readUnknownField;
                    if (u === "throw")
                        throw new globalThis.Error(`Unknown field ${fieldNo} (wire type ${wireType}) for ${this.typeName}`);
                    let d = reader.skip(wireType);
                    if (u !== false)
                        (u === true ? UnknownFieldHandler.onRead : u)(this.typeName, message, fieldNo, wireType, d);
            }
        }
        return message;
    }
    internalBinaryWrite(message: ContactsDeleteRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* string id = 1; */
        if (message.id !== "")
            writer.tag(1, WireType.LengthDelimited).string(message.id);
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ContactsDeleteRequest
 */
export const ContactsDeleteRequest = new ContactsDeleteRequest$Type();
/**
 * @generated ServiceType for protobuf service people.v1.People
 */
export const People = new ServiceType("people.v1.People", [
    { name: "ContactsList", options: {}, I: ContactsListRequest, O: ListContactsResponse },
    { name: "ContactsCreate", options: {}, I: ContactsCreateRequest, O: Person },
    { name: "ContactsUpdate", options: {}, I: ContactsUpdateRequest, O: Person },
    { name: "ContactsDelete", options: {}, I: ContactsDeleteRequest, O: Empty }
]);
