package api

import (
	"context"
	"errors"
	"fmt"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	initdata "github.com/telegram-mini-apps/init-data-golang"
	"io"
	"log"
	"math/rand"
	"net/http"
	"sacred/internal/contract"
	"sacred/internal/db"
	"time"
)

const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

const (
	ErrInvalidInitData = "invalid init data from telegram"
	ErrInvalidRequest  = "failed to validate request"
)

func (a *API) AuthTelegram(c echo.Context) error {
	var req contract.AuthTelegramRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, ErrInvalidRequest).WithInternal(err)
	}

	if err := req.Validate(); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, ErrInvalidRequest).WithInternal(err)
	}

	expIn := 24 * time.Hour
	botToken := a.cfg.TelegramBotToken

	if err := initdata.Validate(req.Query, botToken, expIn); err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, ErrInvalidInitData).WithInternal(err)
	}

	data, err := initdata.Parse(req.Query)
	if err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, ErrInvalidInitData).WithInternal(err)
	}

	user, err := a.storage.GetUserByChatID(data.User.ID)
	if err != nil && errors.Is(err, db.ErrNotFound) {
		username := data.User.Username
		if username == "" {
			username = "user_" + fmt.Sprintf("%d", data.User.ID)
		}

		var name *string
		if data.User.FirstName != "" {
			name = &data.User.FirstName
			if data.User.LastName != "" {
				nameWithLast := fmt.Sprintf("%s %s", data.User.FirstName, data.User.LastName)
				name = &nameWithLast
			}
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
			Name:         name,
			LanguageCode: lang,
			AvatarURL:    &imgUrl,
		}

		if err = a.storage.CreateUser(context.Background(), &create); err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to create user").WithInternal(err)
		}

		user, err = a.storage.GetUserByChatID(data.User.ID)
		if err != nil {
			return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user").WithInternal(err)
		}
	} else if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user").WithInternal(err)
	}

	token, err := generateJWT(user.ID, user.ChatID, a.cfg.JWTSecret)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "jwt library error").WithInternal(err)
	}

	uresp := contract.UserResponse{
		ID:           user.ID,
		Name:         user.Name,
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
		return echo.NewHTTPError(http.StatusInternalServerError, "failed to get user's wishlists").WithInternal(err)
	}

	resp := &contract.AuthResponse{
		Token:  token,
		User:   uresp,
		Wishes: wishes,
	}

	return c.JSON(http.StatusOK, resp)
}

func generateJWT(userID string, chatID int64, secretKey string) (string, error) {
	claims := &contract.JWTClaims{
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
