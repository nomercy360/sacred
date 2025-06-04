package contract

import (
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"regexp"
	"sacred/internal/db"
	"time"
)

type OkResponse struct {
	Message string `json:"message"`
} // @Name OkResponse

type ErrorResponse struct {
	Error string `json:"error"`
} // @Name ErrorResponse

type StatusResponse struct {
	Success bool `json:"success"`
} // @Name StatusResponse

type JWTClaims struct {
	jwt.RegisteredClaims
	UID    string `json:"uid"`
	ChatID int64  `json:"chat_id"`
}

type AuthTelegramRequest struct {
	Query string `json:"query"`
} // @Name AuthTelegramRequest

func (a AuthTelegramRequest) Validate() error {
	if a.Query == "" {
		return fmt.Errorf("query cannot be empty")
	}

	return nil
}

type UserResponse struct {
	ID           string        `json:"id"`
	Name         *string       `json:"name"`
	Username     string        `json:"username"`
	ChatID       int64         `json:"chat_id"`
	LanguageCode string        `json:"language_code"`
	CreatedAt    time.Time     `json:"created_at"`
	Email        *string       `json:"email"`
	ReferralCode string        `json:"referral_code"`
	ReferredBy   *string       `json:"referred_by"`
	Interests    []db.Interest `json:"interests"`
	AvatarURL    *string       `json:"avatar_url"`
}

type UserProfileResponse struct {
	ID          string        `json:"id"`
	Name        *string       `json:"name"`
	Username    string        `json:"username"`
	CreatedAt   time.Time     `json:"created_at"`
	AvatarURL   *string       `json:"avatar_url"`
	Interests   []db.Interest `json:"interests"`
	Followers   int           `json:"followers"`
	SavedItems  []db.Wish     `json:"wishlist_items"`
	IsFollowing bool          `json:"is_following"`
}

// ShortUserProfile represents a subset of user information.
type ShortUserProfile struct {
	ID        string  `json:"id"`
	Username  string  `json:"username"`
	Name      *string `json:"name,omitempty"`
	AvatarURL *string `json:"avatar_url,omitempty"`
	Followers int     `json:"followers"`
}

func ToShortUserProfile(u db.User) ShortUserProfile {
	return ShortUserProfile{
		ID:        u.ID,
		Username:  u.Username,
		Name:      u.Name,
		AvatarURL: u.AvatarURL,
		Followers: u.Followers,
	}
}

type WishResponse struct {
	Wish       db.Wish            `json:"wish"`
	SaversInfo WishSaversResponse `json:"savers"`
}

type WishSaversResponse struct {
	Users []ShortUserProfile `json:"users"`
	Total int                `json:"total"`
}

type AuthResponse struct {
	Token  string       `json:"token"`
	User   UserResponse `json:"user"`
	Wishes []db.Wish    `json:"wishes"`
}

type FollowUserRequest struct {
	FollowingID string `json:"following_id"`
}

type CreateWishResponse struct {
	ID        string   `json:"id"`
	UserID    string   `json:"user_id"`
	Name      *string  `json:"name"`
	Notes     *string  `json:"notes"`
	Currency  *string  `json:"currency"`
	Price     *float64 `json:"price"`
	ImageURLs []string `json:"image_urls"`
	URL       *string  `json:"url"`
}

func (r *FollowUserRequest) Validate() error {
	if r.FollowingID == "" {
		return fmt.Errorf("following_id is empty")
	}

	return nil
}

type UpdateUserRequest struct {
	Interests []string `json:"interests"`
	Email     string   `json:"email"`
	Name      *string  `json:"name"`
	Username  *string  `json:"username"`
}

func (u UpdateUserRequest) Validate() error {
	if len(u.Interests) == 0 {
		return errors.New("interests cannot be empty")
	}

	re := regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
	if !re.MatchString(u.Email) {
		return errors.New("invalid email format")
	}

	if u.Name != nil && len(*u.Name) > 100 && len(*u.Name) < 1 {
		return errors.New("name cannot be longer than 100 characters")
	}

	if u.Username != nil && len(*u.Username) > 100 && len(*u.Username) < 1 {
		return errors.New("username cannot be longer than 100 characters")
	}

	return nil
}

type FeedItem struct {
	ID         string         `json:"id"`
	Name       *string        `json:"name"`
	URL        *string        `json:"url"`
	Price      *float64       `json:"price,omitempty"`
	Currency   *string        `json:"currency,omitempty"`
	Notes      *string        `json:"notes,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	Categories []db.Category  `json:"categories"`
	Images     []db.WishImage `json:"images"`
	CopyID     *string        `json:"copy_id,omitempty"`
}

func ToFeedItem(w db.Wish) FeedItem {
	return FeedItem{
		ID:         w.ID,
		Name:       w.Name,
		URL:        w.URL,
		Price:      w.Price,
		Currency:   w.Currency,
		Notes:      w.Notes,
		CreatedAt:  w.CreatedAt,
		UpdatedAt:  w.UpdatedAt,
		Categories: w.Categories,
		Images:     w.Images,
		CopyID:     w.CopyID,
	}
}
