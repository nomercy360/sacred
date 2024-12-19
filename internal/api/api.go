package api

import (
	"context"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"sacred/internal/db"
	"sync"
)

// storager interface for database operations
type storager interface {
	Health() (db.HealthStats, error)
	GetUserByChatID(chatID int64) (db.User, error)
	GetUserByID(id int64) (db.User, error)
	CreateUser(ctx context.Context, user db.User) error
	UpdateWishlistItem(ctx context.Context, item db.WishlistItem) (db.WishlistItem, error)
	CreateWishlistItem(ctx context.Context, item db.WishlistItem) (db.WishlistItem, error)
	CreateWishlist(ctx context.Context, list db.Wishlist) (db.Wishlist, error)
	GetWishlistItemByID(ctx context.Context, id int64) (db.WishlistItem, error)
	GetWishlistByID(ctx context.Context, id int64) (db.Wishlist, error)
	UpdateUser(ctx context.Context, user db.User, interests []int) error
	ListCategories(ctx context.Context) ([]db.Category, error)
	GetWishlistByUserID(ctx context.Context, userID int64) (db.Wishlist, error)
}

type API struct {
	storage  storager
	jobQueue chan MetadataFetchJob
	mutex    *sync.Mutex

	cfg Config
}

type Config struct {
	JWTSecret    string
	BotToken     string
	MetaFetchURL string
}

func New(storage storager, cfg Config) *API {
	return &API{
		storage: storage,
		cfg:     cfg,
	}
}

func getUserID(c echo.Context) int64 {
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(*JWTClaims)
	return claims.UID
}
