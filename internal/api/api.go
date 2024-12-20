package api

import (
	"context"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"sacred/internal/db"
	"sacred/internal/s3"
	"sync"
)

// storager interface for database operations
type storager interface {
	Health() (db.HealthStats, error)
	GetUserByChatID(chatID int64) (db.User, error)
	GetUserByID(id string) (db.User, error)
	CreateUser(ctx context.Context, user db.User) error
	UpdateWish(ctx context.Context, wish db.Wish) (db.Wish, error)
	CreateWish(ctx context.Context, wish db.Wish) (db.Wish, error)
	CreateWishlist(ctx context.Context, list db.Wishlist) (db.Wishlist, error)
	GetWishByID(ctx context.Context, id string) (db.Wish, error)
	GetWishlistByID(ctx context.Context, id string) (db.Wishlist, error)
	UpdateUser(ctx context.Context, user db.User, interests []string) error
	ListCategories(ctx context.Context) ([]db.Category, error)
	ListIdeas(ctx context.Context, userID string) ([]db.Idea, error)
	ListUsers(ctx context.Context, uid string) ([]db.User, error)
	GetWishesByUserID(ctx context.Context, userID string) ([]db.Wish, error)
	FollowUser(ctx context.Context, uid, followID string) error
	UnfollowUser(ctx context.Context, uid, UnfollowID string) error
	GetIdeaByID(ctx context.Context, id string) (db.Idea, error)
}

type API struct {
	storage  storager
	jobQueue chan MetadataFetchJob
	mutex    *sync.Mutex
	s3Client *s3.Client

	cfg Config
}

type Config struct {
	JWTSecret    string
	BotToken     string
	MetaFetchURL string
	AssetsURL    string
}

func New(storage storager, cfg Config, s3 *s3.Client) *API {
	return &API{
		storage:  storage,
		cfg:      cfg,
		s3Client: s3,
	}
}

func getUserID(c echo.Context) string {
	user := c.Get("user").(*jwt.Token)
	claims := user.Claims.(*JWTClaims)
	return claims.UID
}
