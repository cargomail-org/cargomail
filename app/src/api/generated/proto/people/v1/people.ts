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
 * @generated from protobuf message people.v1.ListConnectionsResponse
 */
export interface ListConnectionsResponse {
    /**
     * @generated from protobuf field: repeated people.v1.Person connections = 1;
     */
    connections: Person[];
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
     * @generated from protobuf field: repeated people.v1.EmailAddress email_addresses = 2;
     */
    emailAddresses: EmailAddress[];
    /**
     * @generated from protobuf field: repeated people.v1.Name names = 3;
     */
    names: Name[];
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
class ListConnectionsResponse$Type extends MessageType<ListConnectionsResponse> {
    constructor() {
        super("people.v1.ListConnectionsResponse", [
            { no: 1, name: "connections", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Person }
        ]);
    }
    create(value?: PartialMessage<ListConnectionsResponse>): ListConnectionsResponse {
        const message = { connections: [] };
        globalThis.Object.defineProperty(message, MESSAGE_TYPE, { enumerable: false, value: this });
        if (value !== undefined)
            reflectionMergePartial<ListConnectionsResponse>(this, message, value);
        return message;
    }
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: ListConnectionsResponse): ListConnectionsResponse {
        let message = target ?? this.create(), end = reader.pos + length;
        while (reader.pos < end) {
            let [fieldNo, wireType] = reader.tag();
            switch (fieldNo) {
                case /* repeated people.v1.Person connections */ 1:
                    message.connections.push(Person.internalBinaryRead(reader, reader.uint32(), options));
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
    internalBinaryWrite(message: ListConnectionsResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter {
        /* repeated people.v1.Person connections = 1; */
        for (let i = 0; i < message.connections.length; i++)
            Person.internalBinaryWrite(message.connections[i], writer.tag(1, WireType.LengthDelimited).fork(), options).join();
        let u = options.writeUnknownFields;
        if (u !== false)
            (u == true ? UnknownFieldHandler.onWrite : u)(this.typeName, message, writer);
        return writer;
    }
}
/**
 * @generated MessageType for protobuf message people.v1.ListConnectionsResponse
 */
export const ListConnectionsResponse = new ListConnectionsResponse$Type();
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
            { no: 2, name: "email_addresses", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => EmailAddress },
            { no: 3, name: "names", kind: "message", repeat: 1 /*RepeatType.PACKED*/, T: () => Name }
        ]);
    }
    create(value?: PartialMessage<Person>): Person {
        const message = { id: "", emailAddresses: [], names: [] };
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
                case /* repeated people.v1.EmailAddress email_addresses */ 2:
                    message.emailAddresses.push(EmailAddress.internalBinaryRead(reader, reader.uint32(), options));
                    break;
                case /* repeated people.v1.Name names */ 3:
                    message.names.push(Name.internalBinaryRead(reader, reader.uint32(), options));
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
        /* repeated people.v1.EmailAddress email_addresses = 2; */
        for (let i = 0; i < message.emailAddresses.length; i++)
            EmailAddress.internalBinaryWrite(message.emailAddresses[i], writer.tag(2, WireType.LengthDelimited).fork(), options).join();
        /* repeated people.v1.Name names = 3; */
        for (let i = 0; i < message.names.length; i++)
            Name.internalBinaryWrite(message.names[i], writer.tag(3, WireType.LengthDelimited).fork(), options).join();
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
/**
 * @generated ServiceType for protobuf service people.v1.People
 */
export const People = new ServiceType("people.v1.People", [
    { name: "ConnectionsList", options: {}, I: Empty, O: ListConnectionsResponse }
]);