package api

import (
	"context"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	initdata "github.com/telegram-mini-apps/init-data-golang"
	"math/rand"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/terrors"
	"time"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

func GenerateReferralCode(length int) string {
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	code := make([]byte, length)
	for i := range code {
		code[i] = charset[seededRand.Intn(len(charset))]
	}
	return string(code)
}

func (a *API) AuthTelegram(c echo.Context) error {
	query := c.QueryString()

	expIn := 24 * time.Hour
	botToken := a.cfg.BotToken

	if err := initdata.Validate(query, botToken, expIn); err != nil {
		return terrors.Unauthorized(err, "invalid init data from telegram")
	}

	data, err := initdata.Parse(query)

	if err != nil {
		return terrors.Unauthorized(err, "cannot parse init data from telegram")
	}

	user, err := a.storage.GetUserByChatID(data.User.ID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		username := data.User.Username
		if username == "" {
			username = "user_" + fmt.Sprintf("%d", data.User.ID)
		}

		var first, last *string

		if data.User.FirstName != "" {
			first = &data.User.FirstName
		}

		if data.User.LastName != "" {
			last = &data.User.LastName
		}

		lang := "ru"

		if data.User.LanguageCode != "ru" {
			lang = "en"
		}

		create := db.User{
			Username:     username,
			ChatID:       data.User.ID,
			ReferralCode: GenerateReferralCode(6),
			FirstName:    first,
			LastName:     last,
			LanguageCode: &lang,
		}

		if err = a.storage.CreateUser(context.Background(), create); err != nil {
			return terrors.InternalServer(err, "failed to create user")
		}

		user, err = a.storage.GetUserByChatID(data.User.ID)
		if err != nil {
			return terrors.InternalServer(err, "failed to get user")
		}

		// Create default wishlist
		wishlist := db.Wishlist{
			UserID:      user.ID,
			Name:        fmt.Sprintf("%s's board", user.Username),
			Description: "Default wishlist",
			IsPublic:    false,
		}

		if _, err = a.storage.CreateWishlist(context.Background(), wishlist); err != nil {
			return terrors.InternalServer(err, "failed to create default wishlist")
		}
	} else if err != nil {
		return terrors.InternalServer(err, "failed to get user")
	}

	token, err := generateJWT(user.ID, user.ChatID, a.cfg.JWTSecret)

	if err != nil {
		return terrors.InternalServer(err, "jwt library error")
	}

	uresp := contract.UserResponse{
		ID:           user.ID,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		Username:     user.Username,
		ChatID:       user.ChatID,
		LanguageCode: user.LanguageCode,
		CreatedAt:    user.CreatedAt,
		Email:        user.Email,
		ReferralCode: user.ReferralCode,
		ReferredBy:   user.ReferredBy,
		Interests:    user.Interests,
	}

	resp := &contract.AuthResponse{
		Token: token,
		User:  uresp,
	}

	return c.JSON(http.StatusOK, resp)
}

type JWTClaims struct {
	jwt.RegisteredClaims
	UID    int64 `json:"uid"`
	ChatID int64 `json:"chat_id"`
}

func generateJWT(userID, chatID int64, secretKey string) (string, error) {
	claims := &JWTClaims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
		UID:    userID,
		ChatID: chatID,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	t, err := token.SignedString([]byte(secretKey))
	if err != nil {
		return "", err
	}

	return t, nil
}
