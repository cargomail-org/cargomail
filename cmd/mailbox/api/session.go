package api

import (
	"cargomail/internal/repository"
)

type SessionApi struct {
	useUserRepository    repository.UseUserRepository
	useSessionRepository repository.UseSessionRepository
}
