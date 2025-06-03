package main

import (
	"context"
	"errors"
	"fmt"
	"github.com/go-playground/validator/v10"
	telegram "github.com/go-telegram/bot"
	"github.com/labstack/echo/v4"
	"gopkg.in/yaml.v3"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sacred/internal/api"
	"sacred/internal/db"
	"sacred/internal/middleware"
	"sacred/internal/s3"
	"syscall"
	"time"
)

type Config struct {
	Host             string `yaml:"host"`
	Port             int    `yaml:"port"`
	DBPath           string `yaml:"db_path"`
	TelegramBotToken string `yaml:"telegram_bot_token"`
	JWTSecret        string `yaml:"jwt_secret"`
	MetaFetchURL     string `yaml:"meta_fetch_url"`
	WebhookURL       string `yaml:"webhook_url"`
	AWS              struct {
		AccessKeyID     string `yaml:"access_key_id"`
		SecretAccessKey string `yaml:"secret_access_key"`
		Endpoint        string `yaml:"endpoint"`
		Bucket          string `yaml:"bucket"`
	} `yaml:"aws"`
	AssetsURL string `yaml:"assets_url"`
}

func ReadConfig(filePath string) (*Config, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open config file: %w", err)
	}
	defer file.Close()

	var cfg Config
	decoder := yaml.NewDecoder(file)
	if err := decoder.Decode(&cfg); err != nil {
		return nil, fmt.Errorf("failed to decode config file: %w", err)
	}

	return &cfg, nil
}

func ValidateConfig(cfg *Config) error {
	validate := validator.New()
	return validate.Struct(cfg)
}

type customValidator struct {
	validator *validator.Validate
}

func (cv *customValidator) Validate(i interface{}) error {
	if err := cv.validator.Struct(i); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}
	return nil
}

func gracefulShutdown(e *echo.Echo, logr *slog.Logger) {
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logr.Info("Shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := e.Shutdown(ctx); err != nil {
		logr.Error("Error during server shutdown", "error", err)
	}
	logr.Info("Server gracefully stopped")
}

func main() {
	configFilePath := "config.yml"
	configFilePathEnv := os.Getenv("CONFIG_FILE_PATH")
	if configFilePathEnv != "" {
		configFilePath = configFilePathEnv
	}

	cfg, err := ReadConfig(configFilePath)

	if err != nil {
		log.Fatalf("error reading configuration: %v", err)
	}

	if err := ValidateConfig(cfg); err != nil {
		log.Fatalf("invalid configuration: %v", err)
	}

	storage, err := db.NewStorage(cfg.DBPath)

	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}

	logr := slog.New(slog.NewJSONHandler(os.Stdout, nil))

	e := echo.New()

	e.HideBanner = true
	e.HidePort = true
	e.IPExtractor = func(req *http.Request) string {
		if cfIP := req.Header.Get("CF-Connecting-IP"); cfIP != "" {
			return cfIP
		}
		return echo.ExtractIPFromXFFHeader()(req)
	}

	middleware.Setup(e, logr)

	aConfig := api.Config{
		TelegramBotToken: cfg.TelegramBotToken,
		JWTSecret:        cfg.JWTSecret,
		MetaFetchURL:     cfg.MetaFetchURL,
		AssetsURL:        cfg.AssetsURL,
		WebhookURL:       cfg.WebhookURL,
	}

	s3Client, err := s3.NewS3Client(
		cfg.AWS.AccessKeyID, cfg.AWS.SecretAccessKey, cfg.AWS.Endpoint, cfg.AWS.Bucket)

	if err != nil {
		log.Fatalf("Failed to initialize AWS S3 client: %v", err)
	}

	bot, err := telegram.New(cfg.TelegramBotToken)
	if err != nil {
		log.Fatalf("failed to create telegram bot: %v", err)
	}

	a := api.New(storage, aConfig, s3Client, bot)

	if err := a.SetupWebhook(context.Background()); err != nil {
		log.Fatalf("failed to setup webhook: %v", err)
	}

	a.SetupRoutes(e)

	// TODO: e.GET("/swagger/*", echoSwagger.WrapHandler)

	go gracefulShutdown(e, logr)

	address := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)
	logr.Info("Starting server", "address", address)
	if err := e.Start(address); err != nil && !errors.Is(err, http.ErrServerClosed) {
		logr.Error("Error starting server", "error", err)
	}
}
