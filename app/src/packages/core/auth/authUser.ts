type AuthUserType = 'anonymous' | 'authenticated'
type GenericUser<T extends AuthUserType, Payload extends object = {}> = {
  type: T
} & Payload
type UserData = { id: string; username: string; userFirst: string; userLast: string; userEmailAddress: string }
export type AnonymousAuthUser = GenericUser<'anonymous'>
export type AuthenticatedAuthUser = GenericUser<'authenticated', { data?: UserData }>
export type AuthUser = AnonymousAuthUser | AuthenticatedAuthUser
