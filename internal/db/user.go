package db

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"github.com/mattn/go-sqlite3"
	"time"
)

// User represents a user in the system
type User struct {
	ID           string         `db:"id" json:"id"`
	Username     string         `db:"username" json:"username"`
	LanguageCode *string        `db:"language_code" json:"language_code"`
	ChatID       int64          `db:"chat_id" json:"chat_id"`
	CreatedAt    time.Time      `db:"created_at" json:"created_at"`
	Name         *string        `db:"name" json:"name"`
	Email        *string        `db:"email" json:"email"`
	ReferralCode string         `db:"referral_code" json:"referral_code"`
	ReferredBy   *string        `db:"referred_by" json:"referred_by"`
	AvatarURL    *string        `db:"avatar_url" json:"avatar_url"`
	Interests    InterestsArray `db:"interests" json:"interests"`
	Followers    int            `db:"followers" json:"followers"`
	IsFollowing  bool           `db:"is_following" json:"is_following"`
}

type InterestsArray []Interest

type Interest struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	ImageURL string `json:"image_url"`
}

type ItemsArray []Wish

func (ia *InterestsArray) Scan(src interface{}) error {
	var source []byte
	switch src := src.(type) {
	case []byte:
		source = src
	case string:
		source = []byte(src)
	case nil:
		return nil
	default:
		return errors.New("unsupported type")
	}

	if len(source) == 0 {
		source = []byte("[]")
	}

	return json.Unmarshal(source, ia)
}

func (wa *ItemsArray) Scan(src interface{}) error {
	var source []byte
	switch src := src.(type) {
	case []byte:
		source = src
	case string:
		source = []byte(src)
	case nil:
		return nil
	default:
		return errors.New("unsupported type")
	}

	if len(source) == 0 {
		source = []byte("[]")
	}

	return json.Unmarshal(source, wa)
}

func IsNoRowsError(err error) bool {
	return errors.Is(err, sql.ErrNoRows)
}

func IsUniqueViolationError(err error) bool {
	var sqliteErr sqlite3.Error
	errors.As(err, &sqliteErr)
	if errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintUnique) {
		return true
	}
	return false
}

func IsForeignKeyViolationError(err error) bool {
	var sqliteErr sqlite3.Error
	if errors.As(err, &sqliteErr) {
		return errors.Is(sqliteErr.ExtendedCode, sqlite3.ErrConstraintForeignKey)
	}
	return false
}

func (s *storage) CreateUser(ctx context.Context, user *User) error {
	query := `
		INSERT INTO users (id, chat_id, username, name, language_code, email, referral_code, referred_by, avatar_url) 
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`

	_, err := s.db.ExecContext(
		ctx,
		query,
		user.ID,
		user.ChatID,
		user.Username,
		user.Name,
		user.LanguageCode,
		user.Email,
		user.ReferralCode,
		user.ReferredBy,
		user.AvatarURL,
	)

	return err
}

func (s *storage) getUserBy(query string, arg interface{}) (User, error) {
	var user User

	if err := s.db.QueryRowContext(context.Background(), query, arg).Scan(
		&user.ID,
		&user.Username,
		&user.LanguageCode,
		&user.ChatID,
		&user.CreatedAt,
		&user.Name,
		&user.Email,
		&user.ReferralCode,
		&user.ReferredBy,
		&user.AvatarURL,
		&user.Interests,
	); err != nil && IsNoRowsError(err) {
		return User{}, ErrNotFound
	} else if err != nil {
		return User{}, err
	}

	return user, nil
}

func (s *storage) GetUserByChatID(chatID int64) (User, error) {
	query := `
		SELECT 
		    u.id,
		    u.username,
		    u.language_code,
		    u.chat_id, 
		    u.created_at, 
		    u.name,
		    u.email,
		    u.referral_code, 
		    u.referred_by,
		    u.avatar_url,
		    json_group_array(distinct json_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) filter (where c.id is not null) as interests
		FROM users u
		LEFT JOIN user_interests ui ON u.id = ui.user_id
		LEFT JOIN categories c ON ui.category_id = c.id
		WHERE u.chat_id = ?
		GROUP BY u.id`

	return s.getUserBy(query, chatID)
}

func (s *storage) GetUserByID(id string) (User, error) {
	query := `
		SELECT 
		    u.id,
		    u.username, 
		    u.language_code,
		    u.chat_id, 
		    u.created_at, 
		    u.name,
		    u.email,
		    u.referral_code, 
		    u.referred_by,
		    u.avatar_url,
		    json_group_array(distinct json_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) filter (where c.id is not null) as interests
		FROM users u
		LEFT JOIN user_interests ui ON u.id = ui.user_id
		LEFT JOIN categories c ON ui.category_id = c.id
		WHERE u.id = ?
		GROUP BY u.id`
	return s.getUserBy(query, id)
}

func (s *storage) UpdateUser(ctx context.Context, user User, interests []string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	query := `
		UPDATE users
		SET username = ?,
			name = ?,
			language_code = ?,
			email = ?
		WHERE id = ?`

	_, err = tx.ExecContext(
		ctx,
		query,
		user.Username,
		user.Name,
		user.LanguageCode,
		user.Email,
		user.ID,
	)

	if err != nil {
		tx.Rollback()
		return err
	}

	// Delete all existing interests
	_, err = tx.ExecContext(ctx, "DELETE FROM user_interests WHERE user_id = ?", user.ID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Insert new interests
	for _, interest := range interests {
		_, err = tx.ExecContext(ctx, "INSERT INTO user_interests (user_id, category_id) VALUES (?, ?)", user.ID, interest)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	return tx.Commit()
}

func (s *storage) ListUsers(ctx context.Context, uid string) ([]User, error) {
	var users []User

	query := `
		SELECT 
		    u.id,
		    u.username,
		    u.language_code,
		    u.chat_id, 
		    u.created_at, 
		    u.name,
		    u.email,
		    u.referral_code, 
		    u.referred_by,
		    u.avatar_url,
		    json_group_array(distinct json_object('id', c.id, 'name', c.name, 'image_url', c.image_url)) filter (where c.id is not null) as interests,
		    (SELECT COUNT(*) FROM followers f WHERE f.following_id = u.id) as followers,
		    EXISTS(SELECT 1 FROM followers f WHERE f.follower_id = ? AND f.following_id = u.id) as is_following
		FROM users u
		LEFT JOIN user_interests ui ON u.id = ui.user_id
		LEFT JOIN categories c ON ui.category_id = c.id
		WHERE u.id != ?
		GROUP BY u.id, u.username, u.language_code, u.chat_id, u.created_at, u.name, u.email, u.referral_code, u.referred_by, u.avatar_url
		ORDER BY u.created_at DESC
		LIMIT 100`

	rows, err := s.db.QueryContext(ctx, query, uid, uid)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user User
		var isFollowing bool
		if err := rows.Scan(
			&user.ID,
			&user.Username,
			&user.LanguageCode,
			&user.ChatID,
			&user.CreatedAt,
			&user.Name,
			&user.Email,
			&user.ReferralCode,
			&user.ReferredBy,
			&user.AvatarURL,
			&user.Interests,
			&user.Followers,
			&isFollowing,
		); err != nil {
			return nil, err
		}

		user.IsFollowing = isFollowing
		users = append(users, user)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func (s *storage) FollowUser(ctx context.Context, uid, followID string) error {
	query := `
		INSERT INTO followers (following_id, follower_id)
		VALUES (?, ?)
	`

	_, err := s.db.ExecContext(
		ctx,
		query,
		followID,
		uid,
	)

	return err
}

func (s *storage) UnfollowUser(ctx context.Context, uid, unfollowID string) error {
	query := `
		DELETE FROM followers WHERE following_id = ? AND follower_id = ? 
	`

	_, err := s.db.ExecContext(
		ctx,
		query,
		unfollowID,
		uid,
	)

	return err
}

func (s *storage) IsFollowing(ctx context.Context, followerID, followingID string) (bool, error) {
	var exists bool
	query := `SELECT EXISTS(SELECT 1 FROM followers WHERE follower_id = ? AND following_id = ?)`

	err := s.db.QueryRowContext(ctx, query, followerID, followingID).Scan(&exists)
	if err != nil {
		return false, err
	}

	return exists, nil
}
