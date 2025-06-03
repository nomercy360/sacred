package api

import (
	"context"
	"errors"
	"fmt"
	telegram "github.com/go-telegram/bot"
	"github.com/golang-jwt/jwt/v5"
	echojwt "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/middleware"
	"sacred/internal/s3"
)

// storager interface for database operations
type storager interface {
	Health() (db.HealthStats, error)
	GetUserByChatID(chatID int64) (db.User, error)
	GetUserByID(id string) (db.User, error)
	CreateUser(ctx context.Context, user *db.User) error
	UpdateWish(ctx context.Context, wish db.Wish, categories []string) error
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
	DeleteWishImages(ctx context.Context, wishID string, photoIDs []string) error
	SaveWishToBookmarks(ctx context.Context, uid, wishID string) error
	RemoveWishFromBookmarks(ctx context.Context, uid, wishID string) error
	ListBookmarkedWishes(ctx context.Context, uid string) ([]db.Wish, error)
	DeleteWish(ctx context.Context, uid, id string) error
	GetPublicWishesFeed(ctx context.Context, uid string, search string) ([]db.Wish, error)
	GetWishAutocomplete(ctx context.Context, prefix string, limit int) ([]db.AutocompleteSuggestion, error)
}

type API struct {
	storage storager
	s3      *s3.Client
	bot     *telegram.Bot

	cfg Config
}

type Config struct {
	JWTSecret        string
	TelegramBotToken string
	MetaFetchURL     string
	WebAppURL        string
	AssetsURL        string
	WebhookURL       string
}

func New(storage storager, cfg Config, s3 *s3.Client, bot *telegram.Bot) *API {
	return &API{
		storage: storage,
		cfg:     cfg,
		s3:      s3,
		bot:     bot,
	}
}

func getUserID(c echo.Context) (string, error) {
	user := c.Get("user")
	if user == nil {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "no authentication token")
	}

	token, ok := user.(*jwt.Token)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "invalid token")
	}

	claims, ok := token.Claims.(*contract.JWTClaims)
	if !ok {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "invalid claims")
	}

	if claims.UID == "" {
		return "", echo.NewHTTPError(http.StatusUnauthorized, "user ID not found in token")
	}

	return claims.UID, nil
}

func (a *API) SetupWebhook(ctx context.Context) error {
	if a.bot == nil {
		return errors.New("bot is not initialized")
	}

	webhookURL := fmt.Sprintf("%s/webhook", a.cfg.WebhookURL)

	whParams := telegram.SetWebhookParams{
		DropPendingUpdates: true,
		URL:                webhookURL,
	}

	ok, err := a.bot.SetWebhook(ctx, &whParams)

	if err != nil {
		return fmt.Errorf("failed to set webhook: %w", err)
	}

	if !ok {
		return errors.New("webhook registration returned false")
	}

	fmt.Println("telegram webhook set successfully", "url", webhookURL)
	return nil
}

func (a *API) SetupRoutes(e *echo.Echo) {

	e.POST("/auth/telegram", a.AuthTelegram)
	e.POST("/webhook", a.HandleWebhook)

	// Regular API routes (require JWT auth)
	v1 := e.Group("/v1")
	v1.Use(echojwt.WithConfig(middleware.GetUserAuthConfig(a.cfg.JWTSecret)))

	v1.PUT("/wishes/:id", a.UpdateWishHandler)
	v1.POST("/wishes", a.CreateWishHandler)
	v1.GET("/wishes/:id", a.GetWishHandler)
	v1.PUT("/user/settings", a.UpdateUserPreferences)
	v1.PUT("/user/interests", a.UpdateUserInterests)
	v1.GET("/categories", a.ListCategories)
	v1.GET("/user/wishes", a.ListUserWishes)
	v1.GET("/feed", a.GetWishesFeed)
	v1.GET("/feed/search", a.SearchFeed)
	v1.GET("/profiles", a.ListProfiles)
	v1.GET("/profiles/:id", a.GetUserProfile)
	v1.POST("/users/follow", a.FollowUser)
	v1.POST("/users/unfollow", a.UnfollowUser)
	v1.POST("/wishes/:id/bookmark", a.SaveWishToBookmarks)
	v1.DELETE("/wishes/:id/bookmark", a.RemoveWishFromBookmarks)
	v1.GET("/bookmarks", a.ListBookmarkedWishes)
	v1.POST("/wishes/:id/copy", a.CopyWishHandler)
	v1.DELETE("/wishes/:id", a.DeleteWishHandler)
}
