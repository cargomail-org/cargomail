package messages

type UseMessageRepository interface {
	// Send(user *User, draft *Message) error
}

type MessageRepository struct {
	// db *sql.DB
}

// func (r MessageRepository) Send(user *User, message *Message) error {
// 	return nil
// }
