package api

import (
	"cargomail/internal/mailbox/repository"
)

type UserApi struct {
	useUserRepository repository.UseUserRepository
}
