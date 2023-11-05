package api

import (
	"cargomail/internal/repository"
)

type UserApi struct {
	useUserRepository repository.UseUserRepository
}
