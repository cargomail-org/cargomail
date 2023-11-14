package api

import (
	"cargomail/internal/mailbox/repository"
)

type SessionApi struct {
	useUserRepository    repository.UseUserRepository
	useSessionRepository repository.UseSessionRepository
}
