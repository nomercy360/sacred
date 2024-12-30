package api

import (
	"context"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	initdata "github.com/telegram-mini-apps/init-data-golang"
	"io"
	"log"
	"math/rand"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"sacred/internal/nanoid"
	"sacred/internal/terrors"
	"time"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

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

		imgUrl := fmt.Sprintf("%s/avatars/%d.svg", a.cfg.AssetsURL, rand.Intn(30)+1)

		if data.User.PhotoURL != "" {
			imgFile := fmt.Sprintf("fb/users/%s.jpg", nanoid.Must())
			imgUrl = fmt.Sprintf("%s/%s", a.cfg.AssetsURL, imgFile)
			go func() {
				if err = a.uploadImageToS3(data.User.PhotoURL, imgFile); err != nil {
					log.Printf("failed to upload user avatar to S3: %v", err)
				}
			}()
		}

		create := db.User{
			ID:           nanoid.Must(),
			Username:     username,
			ChatID:       data.User.ID,
			ReferralCode: nanoid.Must(),
			FirstName:    first,
			LastName:     last,
			LanguageCode: &lang,
			AvatarURL:    &imgUrl,
		}

		if err = a.storage.CreateUser(context.Background(), create); err != nil {
			return terrors.InternalServer(err, "failed to create user")
		}

		user, err = a.storage.GetUserByChatID(data.User.ID)
		if err != nil {
			return terrors.InternalServer(err, "failed to get user")
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
		AvatarURL:    user.AvatarURL,
	}

	wishes, err := a.storage.GetWishesByUserID(context.Background(), user.ID)
	if err != nil {
		return terrors.InternalServer(err, "failed to get user's wishlists")
	}

	resp := &contract.AuthResponse{
		Token:  token,
		User:   uresp,
		Wishes: wishes,
	}

	return c.JSON(http.StatusOK, resp)
}

type JWTClaims struct {
	jwt.RegisteredClaims
	UID    string `json:"uid"`
	ChatID int64  `json:"chat_id"`
}

func generateJWT(userID string, chatID int64, secretKey string) (string, error) {
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

func (a *API) uploadImageToS3(imgURL string, fileName string) error {
	resp, err := http.Get(imgURL)

	if err != nil {
		return fmt.Errorf("failed to download file: %v", err)

	}

	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)

	if err != nil {
		return fmt.Errorf("failed to read file: %v", err)
	}

	if _, err = a.s3.UploadFile(data, fileName); err != nil {
		return fmt.Errorf("failed to upload user avatar to S3: %v", err)
	}

	return nil
}
