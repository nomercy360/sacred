package api

import (
	"context"
	"errors"
	"fmt"
	telegram "github.com/go-telegram/bot"
	"github.com/go-telegram/bot/models"
	"github.com/labstack/echo/v4"
	nanoid "github.com/matoous/go-nanoid/v2"
	"io"
	"log"
	"math/rand"
	"net/http"
	"sacred/internal/db"
)

func (a *API) HandleWebhook(c echo.Context) error {
	var update models.Update
	if err := c.Bind(&update); err != nil {
		log.Printf("Failed to bind update: %v", err)
		return c.NoContent(400)
	}

	if update.Message == nil && update.CallbackQuery == nil {
		return c.NoContent(200)
	}

	resp := a.handleUpdate(&update)
	if resp != nil {
		if _, err := a.bot.SendMessage(context.Background(), resp); err != nil {
			log.Printf("Failed to send message: %v", err)
		}
	}

	return c.NoContent(200)
}

func (a *API) handleUpdate(update *models.Update) (msg *telegram.SendMessageParams) {
	var chatID int64
	var telegramUserID int64
	var name *string
	var username string
	if update.Message != nil && update.Message.From != nil {
		chatID = update.Message.From.ID
		telegramUserID = update.Message.From.ID
		username = update.Message.From.Username

		name = &update.Message.From.FirstName
		if update.Message.From.FirstName != "" {
			name = &update.Message.From.FirstName
			if update.Message.From.LastName != "" {
				nameWithLast := fmt.Sprintf("%s %s", update.Message.From.FirstName, update.Message.From.LastName)
				name = &nameWithLast
			}
		}
	}

	if username == "" {
		usernameFromID := fmt.Sprintf("user_%d", chatID)
		username = usernameFromID
	}

	user, err := a.storage.GetUserByChatID(chatID)

	msg = &telegram.SendMessageParams{
		ChatID: chatID,
	}

	if err != nil && errors.Is(err, db.ErrNotFound) {
		// Fetch user avatar from Telegram
		avatarURL, err := a.fetchAndUploadUserAvatar(context.Background(), telegramUserID)
		if err != nil {
			log.Printf("Failed to fetch/upload user avatar: %v", err)
			// Fallback to default avatar
			defaultAvatar := fmt.Sprintf("%s/avatars/%d.svg", "https://assets.peatch.io", rand.Intn(30)+1)
			avatarURL = &defaultAvatar
		}

		newUser := &db.User{
			ID:        nanoid.Must(),
			ChatID:    chatID,
			Username:  username,
			Name:      name,
			AvatarURL: avatarURL,
		}

		if err := a.storage.CreateUser(context.Background(), newUser); err != nil {
			log.Printf("Failed to save user: %v", err)
			msg.Text = "Ошибка при регистрации пользователя. Попробуй позже."
		} else {
			msg.Text = "Добро пожаловать! Используй /start для начала работы с ботом."
			// Set menu button for new user
			a.setMenuButton(chatID)
		}

		user, err = a.storage.GetUserByChatID(chatID)
		if err != nil {
			log.Printf("Failed to get user after saving: %v", err)
			msg.Text = "Ошибка при получении пользователя. Попробуй позже."
		}
	} else if err != nil {
		log.Printf("Failed to get user: %v", err)
		msg.Text = "Ошибка при получении пользователя. Попробуй позже."
	}

	if update.Message == nil || user.ID == "" {
		return msg
	}

	// Check if it's a command
	if update.Message.Text != "" && len(update.Message.Text) > 0 && update.Message.Text[0] == '/' {
		command := update.Message.Text[1:]
		// Extract command without args
		for i, r := range command {
			if r == ' ' || r == '@' {
				command = command[:i]
				break
			}
		}

		switch command {
		case "start":
			msg.Text = "Привет\\!"
			msg.ParseMode = models.ParseModeMarkdown
			// Set menu button on start
			a.setMenuButton(chatID)
		case "help":
			msg.Text = "TODO: Справка по командам\\!"
			msg.ParseMode = models.ParseModeMarkdown
		case "test":
			webAppInfo := &models.WebAppInfo{
				URL: "https://127.0.0.1:3000",
			}
			replyMarkup := &models.InlineKeyboardMarkup{
				InlineKeyboard: [][]models.InlineKeyboardButton{
					{
						{
							Text:   "Test WebApp",
							WebApp: webAppInfo,
						},
					},
				},
			}
			msg.Text = "for local dev"
			msg.ReplyMarkup = replyMarkup
		default:
			msg.Text = "Неизвестная команда. Используй /help для получения справки."
		}
		return msg
	}

	if msg.Text == "" {
		msg.Text = "Send me a photo of your food to track nutrition!"
	}

	return msg
}

// fetchAndUploadUserAvatar fetches user avatar from Telegram and uploads to S3
func (a *API) fetchAndUploadUserAvatar(ctx context.Context, userID int64) (*string, error) {
	// Get user profile photos
	photos, err := a.bot.GetUserProfilePhotos(ctx, &telegram.GetUserProfilePhotosParams{
		UserID: userID,
		Limit:  1,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get user profile photos: %w", err)
	}

	if photos.TotalCount == 0 || len(photos.Photos) == 0 || len(photos.Photos[0]) == 0 {
		return nil, fmt.Errorf("no profile photos found")
	}

	// Get the largest photo
	var largestPhoto *models.PhotoSize
	maxSize := 0
	for _, photo := range photos.Photos[0] {
		size := photo.Width * photo.Height
		if size > maxSize {
			maxSize = size
			largestPhoto = &photo
		}
	}

	if largestPhoto == nil {
		return nil, fmt.Errorf("no suitable photo found")
	}

	// Get file info
	file, err := a.bot.GetFile(ctx, &telegram.GetFileParams{
		FileID: largestPhoto.FileID,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get file: %w", err)
	}

	// Download the file
	fileURL := fmt.Sprintf("https://api.telegram.org/file/bot%s/%s", a.cfg.BotToken, file.FilePath)
	resp, err := http.Get(fileURL)
	if err != nil {
		return nil, fmt.Errorf("failed to download file: %w", err)
	}
	defer resp.Body.Close()

	// Read file content
	fileData, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read file data: %w", err)
	}

	// Generate filename
	fileName := fmt.Sprintf("avatars/telegram_%d.jpg", userID)

	// Upload to S3
	_, err = a.s3.UploadFile(fileData, fileName)
	if err != nil {
		return nil, fmt.Errorf("failed to upload to S3: %w", err)
	}

	// Return the S3 URL
	avatarURL := fmt.Sprintf("%s/%s", a.cfg.AssetsURL, fileName)
	return &avatarURL, nil
}

func (a *API) setMenuButton(chatID int64) {
	ctx := context.Background()

	menu := telegram.SetChatMenuButtonParams{
		ChatID: chatID,
		MenuButton: models.MenuButtonWebApp{
			Type:   "web_app",
			Text:   "Open App",
			WebApp: models.WebAppInfo{URL: a.cfg.WebAppURL},
		},
	}

	if _, err := a.bot.SetChatMenuButton(ctx, &menu); err != nil {
		fmt.Printf("failed to set menu button: %v\n", err)
		return
	}

	fmt.Printf("menu button set successfully for chat %d\n", chatID)
}
