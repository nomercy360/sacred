package contract

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"sacred/internal/db"
	"time"
)

type Error struct {
	Message string `json:"message"`
}

type UserResponse struct {
	ID           string        `json:"id"`
	Name         *string       `json:"name"`
	Username     string        `json:"username"`
	ChatID       int64         `json:"chat_id"`
	LanguageCode *string       `json:"language_code"`
	CreatedAt    time.Time     `json:"created_at"`
	Email        *string       `json:"email"`
	ReferralCode string        `json:"referral_code"`
	ReferredBy   *string       `json:"referred_by"`
	Interests    []db.Interest `json:"interests"`
	AvatarURL    *string       `json:"avatar_url"`
}

type UserProfileResponse struct {
	ID         string        `json:"id"`
	Name       *string       `json:"name"`
	Username   string        `json:"username"`
	CreatedAt  time.Time     `json:"created_at"`
	AvatarURL  *string       `json:"avatar_url"`
	Interests  []db.Interest `json:"interests"`
	Followers  int           `json:"followers"`
	SavedItems []db.Wish     `json:"wishlist_items"`
}

type AuthResponse struct {
	Token  string       `json:"token"`
	User   UserResponse `json:"user"`
	Wishes []db.Wish    `json:"wishes"`
}

type UpdateWishRequest struct {
	URL         *string  `json:"url"`
	Name        *string  `json:"name"`
	Price       *float64 `json:"price"`
	Currency    *string  `json:"currency"`
	Notes       *string  `json:"notes"`
	IsPublic    bool     `json:"is_public"`
	CategoryIDs []string `json:"category_ids"`
}

type FollowUserRequest struct {
	FollowingID string `json:"following_id"`
}

type CreateWishResponse struct {
	ID     string `json:"id"`
	UserID string `json:"user_id"`
}

func (r *FollowUserRequest) Validate() error {
	if r.FollowingID == "" {
		return fmt.Errorf("following_id is empty")
	}

	return nil
}

var validCurrencies = map[string]struct{}{
	"USD": {},
	"EUR": {},
	"RUB": {},
	"THB": {},
}

func (r *UpdateWishRequest) Validate() error {
	if r.URL != nil {
		parsed, err := url.Parse(*r.URL)
		if err != nil {
			return err
		}

		if parsed.Scheme == "" || parsed.Host == "" {
			return errors.New("invalid URL")
		}
	}

	if r.Price != nil && *r.Price < 0 {
		return errors.New("price cannot be negative")
	}

	if len(r.CategoryIDs) == 0 {
		return errors.New("categories can not be empty")
	}

	if r.Notes != nil && len(*r.Notes) > 1000 {
		return errors.New("notes cannot be longer than 1000 characters")
	}

	if r.Name != nil && len(*r.Name) > 200 && len(*r.Name) < 1 {
		return errors.New("name cannot be longer than 200 characters and cannot be empty")
	}

	if r.Currency != nil {
		if _, ok := validCurrencies[*r.Currency]; !ok {
			return errors.New("invalid currency")
		}
	}

	return nil
}

type UpdateUserRequest struct {
	Interests []string `json:"interests"`
	Email     string   `json:"email"`
}

func (u UpdateUserRequest) Validate() error {
	if len(u.Interests) == 0 {
		return errors.New("interests cannot be empty")
	}

	re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !re.MatchString(u.Email) {
		return errors.New("invalid email format")
	}

	return nil
}
