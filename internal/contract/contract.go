package contract

import (
	"errors"
	"fmt"
	"net/url"
	"sacred/internal/db"
	"time"
)

type Error struct {
	Message string `json:"message"`
}

type UserResponse struct {
	ID           string        `json:"id"`
	FirstName    *string       `json:"first_name"`
	LastName     *string       `json:"last_name"`
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
	FirstName  *string       `json:"first_name"`
	LastName   *string       `json:"last_name"`
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

type CreateImage struct {
	URL    string `json:"url"`
	Width  int    `json:"width"`
	Height int    `json:"height"`
	Size   int    `json:"size"`
}
type CreateWishRequest struct {
	URL         *string       `json:"url"`
	Name        *string       `json:"name"`
	Price       *float64      `json:"price"`
	Currency    *string       `json:"currency"`
	Images      []CreateImage `json:"images"`
	Notes       *string       `json:"notes"`
	IsPublic    bool          `json:"is_public"`
	CategoryIDs []string      `json:"category_ids"`
}

type FollowUserRequest struct {
	FollowingID string `json:"following_id"`
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

func (r *CreateWishRequest) Validate() error {
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

	if len(r.Images) > 5 {
		return errors.New("image_urls cannot be longer than 5")
	} else if len(r.Images) > 0 {
		for _, imgURL := range r.Images {
			parsed, err := url.Parse(imgURL.URL)
			if err != nil {
				return err
			}

			if parsed.Scheme == "" || parsed.Host == "" {
				return errors.New("invalid image URL")
			}
		}
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

type WishResponse struct {
	ID          string    `json:"id"`
	UserID      string    `json:"user_id"`
	Title       *string   `json:"title"`
	URL         string    `json:"url"`
	Price       *float64  `json:"price"`
	Notes       *string   `json:"notes"`
	IsPurchased bool      `json:"is_purchased"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
