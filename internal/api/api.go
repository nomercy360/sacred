package api

import (
	"context"
	telegram "github.com/go-telegram/bot"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"sacred/internal/db"
	"sacred/internal/s3"
)

// storager interface for database operations
type storager interface {
	Health() (db.HealthStats, error)
	GetUserByChatID(chatID int64) (db.User, error)
	GetUserByID(id string) (db.User, error)
	CreateUser(ctx context.Context, user *db.User) error
	UpdateWish(ctx context.Context, wish db.Wish, categories []string) (db.Wish, error)
	CreateWish(ctx context.Context, wish db.Wish, categories []string) error
	CreateWishlist(ctx context.Context, list db.Wishlist) (db.Wishlist, error)
	GetWishByID(ctx context.Context, uid, id string) (db.Wish, error)
	GetWishlistByID(ctx context.Context, id string) (db.Wishlist, error)
	UpdateUser(ctx context.Context, user db.User, interests []string) error
	ListCategories(ctx context.Context) ([]db.Category, error)
	ListUsers(ctx context.Context, uid string) ([]db.User, error)
	GetWishesByUserID(ctx context.Context, userID string) ([]db.Wish, error)
	FollowUser(ctx context.Context, uid, followID string) error
	UnfollowUser(ctx context.Context, uid, UnfollowID string) error
	IsFollowing(ctx context.Context, followerID, followingID string) (bool, error)
	CreateWishImage(ctx context.Context, image db.WishImage) (db.WishImage, error)
	DeleteWishPhoto(ctx context.Context, wishID, photoID string) error
	SaveWishToBookmarks(ctx context.Context, uid, wishID string) error
	RemoveWishFromBookmarks(ctx context.Context, uid, wishID string) error
	ListBookmarkedWishes(ctx context.Context, uid string) ([]db.Wish, error)
	DeleteWish(ctx context.Context, uid, id string) error
	GetPublicWishesFeed(ctx context.Context, uid string, search string) ([]db.Wish, error)
}

type API struct {
	storage storager
	s3      *s3.Client
	bot     *telegram.Bot

	cfg Config
}

type Config struct {
	JWTSecret    string
	BotToken     string
	MetaFetchURL string
	WebAppURL    string
	AssetsURL    string
}

func New(storage storager, cfg Config, s3 *s3.Client, bot *telegram.Bot) *API {
	return &API{
		storage: storage,
		cfg:     cfg,
		s3:      s3,
		bot:     bot,
	}
}

func getUserID(c echo.Context) string {
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(*JWTClaims)
	return claims.UID
}
