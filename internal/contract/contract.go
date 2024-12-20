package contract

import (
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
	ID         string            `json:"id"`
	FirstName  *string           `json:"first_name"`
	LastName   *string           `json:"last_name"`
	Username   string            `json:"username"`
	CreatedAt  time.Time         `json:"created_at"`
	AvatarURL  *string           `json:"avatar_url"`
	Interests  []db.Interest     `json:"interests"`
	Followers  int               `json:"followers"`
	SavedItems []db.WishlistItem `json:"wishlist_items"`
}

type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

type CreateWishItemByURLRequest struct {
	URL        string `json:"url" validate:"required,url"`
	WishlistID string `json:"wishlist_id" validate:"required"`
}

type WishlistItemResponse struct {
	ID          string    `json:"id"`
	WishlistID  string    `json:"wishlist_id"`
	Title       *string   `json:"title"`
	URL         string    `json:"url"`
	Price       *float64  `json:"price"`
	ImageURL    *string   `json:"image_url"`
	Notes       *string   `json:"notes"`
	IsPurchased bool      `json:"is_purchased"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
